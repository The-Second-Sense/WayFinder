import modal
import base64
import requests
import os
import torch
import torchaudio
from pydantic import BaseModel

# --- CHANGE 1: NEW APP NAME TO FORCE REBUILD ---
app = modal.App("secure-fingerprint-agent-v2")
model_cache = modal.Volume.from_name("my-model-cache", create_if_missing=True)


class SecureRequest(BaseModel):
    current_voice_base64: str
    reference_fingerprint: list
    deberta_url: str


# --- CHANGE 2: FORCE PYTHON 3.11 & STABLE LIBRARIES ---
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg")
    .pip_install(
        "fastapi[standard]",
        "transformers",
        "torch==2.6.0",
        "torchaudio==2.6.0",
        "accelerate",
        "requests",
        "numpy",
        "soundfile"
    )
)


@app.cls(
    image=image,
    volumes={"/cache": model_cache},
    gpu="T4",
    scaledown_window=300
)
class SecurityAgent:
    @modal.enter()
    def load_models(self):
        from transformers import Wav2Vec2FeatureExtractor, WavLMForXVector, pipeline

        print("Loading WavLM...")
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained('microsoft/wavlm-base-plus-sv')
        self.verifier = WavLMForXVector.from_pretrained('microsoft/wavlm-base-plus-sv').to("cuda")

        print("Loading Whisper...")
        self.transcriber = pipeline(
            "automatic-speech-recognition",
            model="TransferRapid/whisper-large-v3-turbo_ro",
            device="cuda:0"
        )

    @modal.fastapi_endpoint(method="POST")
    def run_check(self, item: SecureRequest):
        import tempfile
        import torchaudio
        import subprocess

        # 1. Prepare Reference
        ref_tensor = torch.tensor(item.reference_fingerprint).to("cuda")
        if ref_tensor.dim() == 1:
            ref_tensor = ref_tensor.unsqueeze(0)

        # 2. Save Audio (Input File)
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            f.write(base64.b64decode(item.current_voice_base64))
            input_path = f.name

        # Define a clean WAV output path for Whisper
        clean_wav_path = input_path + "_clean.wav"

        try:
            # Convert to clean WAV for Whisper
            # This fixes the "malformed soundfile" error
            subprocess.run([
                "ffmpeg", "-y", "-i", input_path,
                "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le",
                clean_wav_path
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

            # 3. Load Audio (Use the clean WAV now)
            signal, fs = torchaudio.load(clean_wav_path)

            # 4. Generate Embedding
            inputs = self.feature_extractor(
                signal.squeeze().numpy(),
                sampling_rate=16000,
                return_tensors="pt"
            ).to("cuda")

            with torch.no_grad():
                new_embeddings = self.verifier(**inputs).embeddings
                new_embeddings = torch.nn.functional.normalize(new_embeddings, dim=-1)

            # 5. Compare
            score = torch.nn.functional.cosine_similarity(new_embeddings, ref_tensor).item()
            print(f"Similarity Score: {score}")

            if score < 0.75:
                return {"status": "DENIED", "score": score, "reason": "Voice mismatch"}

            # 6. Transcribe (Use the clean WAV file)
            res = self.transcriber(clean_wav_path, generate_kwargs={"language": "romanian"})
            text = res["text"].strip()

            # 7. Intent
            intent_data = {}
            if item.deberta_url:
                try:
                    r = requests.post(item.deberta_url, json={
                        "text": text,
                        "labels": ["TRANSFER", "SOLD", "TRANZACTII", "ADAUGA_BENEFICIAR", "PLATA_FACTURI", "ALTELE"]
                    })
                    intent_data = r.json()
                except Exception as e:
                    intent_data = {"error": str(e)}

            return {
                "status": "GRANTED",
                "score": score,
                "transcription": text,
                "intent": intent_data
            }

        except Exception as e:
            print(f"Error: {e}")
            return {"status": "ERROR", "reason": str(e)}

        finally:
            # Clean up both files
            if os.path.exists(input_path):
                os.remove(input_path)
            if os.path.exists(clean_wav_path):
                os.remove(clean_wav_path)

