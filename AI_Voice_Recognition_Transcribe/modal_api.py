import modal
import base64
import requests
import os
import torch
from pydantic import BaseModel

app = modal.App("secure-fingerprint-agent")
model_cache = modal.Volume.from_name("my-model-cache", create_if_missing=True)


# --- 1. DATA STRUCTURE ---
# This is what the API expects to receive
class SecureRequest(BaseModel):
    current_voice_base64: str  # The new audio (Base64)
    reference_fingerprint: list  # The list of numbers from your DB
    deberta_url: str  # The address of your other agent

image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install(
        "fastapi[standard]", "transformers", "torch", "accelerate",
        "speechbrain", "torchaudio", "requests", "numpy"
    )
)


@app.cls(
    image=image,
    volumes={"/cache": model_cache},
    gpu="T4",
    container_idle_timeout=300
)
class SecurityAgent:
    @modal.enter()
    def load_models(self):
        # Load SpeechBrain (The Verifier)
        from speechbrain.inference.speaker import EncoderClassifier
        self.verifier = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir="/cache/speechbrain",
            run_opts={"device": "cuda"}
        )

        # Load Whisper (The Transcriber)
        from transformers import pipeline
        self.transcriber = pipeline(
            "automatic-speech-recognition",
            model="TransferRapid/whisper-large-v3-turbo_ro",
            device="cuda:0"
        )

    @modal.web_endpoint(method="POST")
    def run_check(self, item: SecureRequest):
        import tempfile
        import torchaudio

        # --- STEP A: PREPARE DATA ---
        # 1. Convert the 'Database List' back into a 'Brain Tensor'
        # We need to put it on the GPU (cuda) to compare it
        ref_tensor = torch.tensor(item.reference_fingerprint).to("cuda")

        # Ensure it has the right shape (1 batch, 1 channel, 192 features)
        # This reshaping ensures the math works correctly
        if len(ref_tensor.shape) == 1:
            ref_tensor = ref_tensor.unsqueeze(0).unsqueeze(0)

        # 2. Save the NEW audio to a temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(base64.b64decode(item.current_voice_base64))
            temp_path = f.name

        try:
            # --- STEP B: GENERATE NEW FINGERPRINT ---
            # Load new audio
            signal, _ = torchaudio.load(temp_path)

            # Create fingerprint for the NEW voice
            # Notice: We only run the heavy computation on the NEW audio
            new_tensor = self.verifier.encode_batch(signal.to("cuda"))

            # --- STEP C: COMPARE (Cosine Similarity) ---
            # Compare the NEW tensor vs the STORED tensor
            similarity = torch.nn.functional.cosine_similarity(new_tensor, ref_tensor)

            # Get the score (Float)
            score = similarity.mean().item()
            print(f"Security Score: {score}")

            # --- STEP D: DECISION ---
            if score < 0.25:
                return {
                    "status": "DENIED",
                    "reason": "Voice did not match user profile.",
                    "score": score
                }

            # --- STEP E: ACTION (Transcribe & Classify) ---
            print("Access Granted. Transcribing...")

            # 1. Transcribe
            res = self.transcriber(temp_path, generate_kwargs={"language": "romanian"})
            text = res["text"].strip()

            # 2. Call Intent Agent
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

        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)