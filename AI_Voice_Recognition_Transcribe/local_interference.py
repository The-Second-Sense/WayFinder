import requests
import base64
import torch

# Import torchaudio with soundfile backend
import soundfile  # Import first to ensure it's available
import torchaudio

import json
import os
from transformers import Wav2Vec2FeatureExtractor, WavLMForXVector

from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()

AGENT_URL = os.getenv("AGENT_URL")
DEBERTA_URL = os.getenv("DEBERTA_URL")

REFERENCE_FILENAME = "reference.wav"
COMMAND_FILENAME = "command.wav"


def get_local_fingerprint(audio_path):
    """
    Generate speaker embedding using Microsoft's WavLM model from HuggingFace.
    This is a modern, well-maintained alternative to SpeechBrain.
    """
    print(f"Processing reference audio: {audio_path}")

    # Load the model and feature extractor
    feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained('microsoft/wavlm-base-plus-sv')
    model = WavLMForXVector.from_pretrained('microsoft/wavlm-base-plus-sv')

    # Load audio file using soundfile directly (more reliable than torchaudio)
    import numpy as np
    signal_np, fs = soundfile.read(audio_path, dtype='float32')

    # Convert to torch tensor and add batch dimension if needed
    signal = torch.from_numpy(signal_np)
    if signal.dim() == 1:
        signal = signal.unsqueeze(0)  # Add channel dimension
    elif signal.dim() == 2:
        signal = signal.T  # soundfile returns (samples, channels), we need (channels, samples)

    # Resample if needed (model expects 16kHz)
    if fs != 16000:
        print(f"  Resampling from {fs}Hz to 16000Hz...")
        resampler = torchaudio.transforms.Resample(fs, 16000)
        signal = resampler(signal)

    # Convert stereo to mono if needed
    if signal.shape[0] > 1:
        print("  Converting stereo to mono...")
        signal = torch.mean(signal, dim=0, keepdim=True)

    # Process audio
    inputs = feature_extractor(signal.squeeze().numpy(), sampling_rate=16000, return_tensors="pt")

    # Generate embeddings
    with torch.no_grad():
        embeddings = model(**inputs).embeddings

    # Normalize embeddings (important for cosine similarity)
    embeddings = torch.nn.functional.normalize(embeddings, dim=-1)

    # Convert tensor to a standard Python list
    return embeddings.squeeze().tolist()


def main():
    # 1. Check files
    if not os.path.exists(REFERENCE_FILENAME) or not os.path.exists(COMMAND_FILENAME):
        print(f"Error: Please ensure '{REFERENCE_FILENAME}' and '{COMMAND_FILENAME}' exist.")
        return

    # 2. Generate Fingerprint (Simulating Database Retrieval)
    try:
        fingerprint_list = get_local_fingerprint(REFERENCE_FILENAME)
        print("Fingerprint generated successfully.")
    except Exception as e:
        print(f"Error processing reference file: {e}")
        return

    # 3. Prepare Command Audio (Base64)
    try:
        with open(COMMAND_FILENAME, "rb") as f:
            command_b64 = base64.b64encode(f.read()).decode("utf-8")
    except Exception as e:
        print(f"Error reading command file: {e}")
        return

    # 4. Send Payload to Modal Agent
    payload = {
        "current_voice_base64": command_b64,
        "reference_fingerprint": fingerprint_list,
        "deberta_url": DEBERTA_URL
    }

    print(f"Sending request to: {AGENT_URL}")

    try:
        response = requests.post(AGENT_URL, json=payload)

        if response.status_code == 200:
            result = response.json()

            # Print Output
            print(f"Status:        {result.get('status')}")
            print(f"Match Score:   {result.get('score')}")

            if result.get('status') == 'GRANTED':
                print(f"Transcription: {result.get('transcription')}")
                print(f"Intent Data:   {json.dumps(result.get('intent'), indent=2)}")
            else:
                print(f"Reason:        {result.get('reason')}")

        else:
            print(f"Server Error {response.status_code}: {response.text}")

    except Exception as e:
        print(f"Connection Failed: {e}")


if __name__ == "__main__":
    main()