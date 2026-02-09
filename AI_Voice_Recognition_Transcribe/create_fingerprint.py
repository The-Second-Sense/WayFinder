import torch

# Import soundfile first to ensure torchaudio uses it
import soundfile
import torchaudio

from transformers import Wav2Vec2FeatureExtractor, WavLMForXVector


def get_fingerprint(audio_file):
    """
    Generate speaker embedding using Microsoft's WavLM model from HuggingFace.
    This is a modern, well-maintained alternative to SpeechBrain.

    Args:
        audio_file (str): Path to the audio file

    Returns:
        list: 512-dimensional speaker embedding as a Python list
    """
    print(f"Processing {audio_file}...")

    # 1. Load the Model and Feature Extractor
    feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained('microsoft/wavlm-base-plus-sv')
    model = WavLMForXVector.from_pretrained('microsoft/wavlm-base-plus-sv')

    # 2. Load the Audio using soundfile directly (more reliable than torchaudio)
    import numpy as np
    signal_np, fs = soundfile.read(audio_file, dtype='float32')

    # Convert to torch tensor and add batch dimension if needed
    signal = torch.from_numpy(signal_np)
    if signal.dim() == 1:
        signal = signal.unsqueeze(0)  # Add channel dimension
    elif signal.dim() == 2:
        signal = signal.T  # soundfile returns (samples, channels), we need (channels, samples)

    # 3. Resample if needed (model expects 16kHz)
    if fs != 16000:
        print(f"Resampling from {fs}Hz to 16000Hz...")
        resampler = torchaudio.transforms.Resample(fs, 16000)
        signal = resampler(signal)

    # 4. Convert stereo to mono if needed
    if signal.shape[0] > 1:
        print("Converting stereo to mono...")
        signal = torch.mean(signal, dim=0, keepdim=True)

    # 5. Process audio through feature extractor
    inputs = feature_extractor(signal.squeeze().numpy(), sampling_rate=16000, return_tensors="pt")

    # 6. Create the Fingerprint (Embedding)
    with torch.no_grad():
        embeddings = model(**inputs).embeddings

    # 7. Normalize embeddings (important for cosine similarity)
    embeddings = torch.nn.functional.normalize(embeddings, dim=-1)

    # 8. Convert to a simple List
    fingerprint_list = embeddings.squeeze().tolist()

    return fingerprint_list


if __name__ == "__main__":
    # Ensure the file exists before running or handle error
    try:
        my_fingerprint = get_fingerprint("my_voice_password.wav")
        print(f"Fingerprint created successfully!")
        print(f"Embedding dimension: {len(my_fingerprint)}")
        print(f"First 10 values: {my_fingerprint[:10]}")
    except FileNotFoundError:
        print("Error: Audio file 'my_voice_password.wav' not found.")
        print("Please ensure the file exists in the current directory.")
    except Exception as e:
        print(f"Error: {e}")