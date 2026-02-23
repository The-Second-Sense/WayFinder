import modal
from fastapi import UploadFile, File
import os

app = modal.App("create_fingerprint_api")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libsndfile1")
    .pip_install(
"fastapi[standard]",
        "torch==2.6.0",
        "torchaudio==2.6.0",
        "transformers",
        "librosa",
        "numpy",
        "scipy"
    )
)


@app.cls(image=image, cpu=2.0)
class AudioFingerprinter:

    @modal.enter()
    def load_model(self):
        from transformers import Wav2Vec2FeatureExtractor, WavLMForXVector
        import torch

        print("Loading WavLM model...")
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained('microsoft/wavlm-base-plus-sv')
        self.model = WavLMForXVector.from_pretrained('microsoft/wavlm-base-plus-sv')
        self.model.eval()

    @modal.web_endpoint(method="POST")
    async def get_fingerprint(self, audio: UploadFile = File(...)):
        import librosa
        import torch
        import torchaudio

        temp_path = f"/tmp/{audio.filename}"

        try:
            with open(temp_path, "wb") as f:
                content = await audio.read()
                f.write(content)

            print(f"Processing {temp_path}...")

            signal_np, fs = librosa.load(temp_path, sr=None, mono=False)

            signal = torch.from_numpy(signal_np)
            if signal.dim() == 1:
                signal = signal.unsqueeze(0)

            if fs != 16000:
                resampler = torchaudio.transforms.Resample(fs, 16000)
                signal = resampler(signal)

            if signal.shape[0] > 1:
                signal = torch.mean(signal, dim=0, keepdim=True)

            inputs = self.feature_extractor(signal.squeeze().numpy(), sampling_rate=16000, return_tensors="pt")

            with torch.no_grad():
                embeddings = self.model(**inputs).embeddings

            embeddings = torch.nn.functional.normalize(embeddings, dim=-1)
            return embeddings.squeeze().tolist()

        except Exception as e:
            return {"error": str(e)}
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)