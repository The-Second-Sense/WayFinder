import torch
import torchaudio
from transformers import Wav2Vec2FeatureExtractor, WavLMForXVector


def get_fingerprint(audio_file):
    """
    Generate speaker embedding using Microsoft's WavLM model.
    Handles M4A/MP4 audio files (common mobile phone format).

    Args:
        audio_file (str): Path to the audio file

    Returns:
        list: 512-dimensional speaker embedding as a Python list
    """
    print(f"Processing {audio_file}...")

    # Load the Model and Feature Extractor
    feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained('microsoft/wavlm-base-plus-sv')
    model = WavLMForXVector.from_pretrained('microsoft/wavlm-base-plus-sv')

    # Load audio using librosa (handles M4A, MP4, WAV, etc.)
    try:
        import librosa

        signal_np, fs = librosa.load(audio_file, sr=None, mono=False)
        signal = torch.from_numpy(signal_np)

        if signal.dim() == 1:
            signal = signal.unsqueeze(0)

        print(f"  Loaded: {fs}Hz, {signal.shape[0]} channel(s)")

    except ImportError:
        raise Exception("librosa is required. Install with: pip install librosa")
    except Exception as e:
        raise Exception(f"Error loading audio '{audio_file}': {e}")

    # Resample to 16kHz if needed
    if fs != 16000:
        print(f"  Resampling from {fs}Hz to 16000Hz...")
        resampler = torchaudio.transforms.Resample(fs, 16000)
        signal = resampler(signal)

    # Convert stereo to mono if needed
    if signal.shape[0] > 1:
        print("  Converting stereo to mono...")
        signal = torch.mean(signal, dim=0, keepdim=True)

    # Generate embedding
    inputs = feature_extractor(signal.squeeze().numpy(), sampling_rate=16000, return_tensors="pt")

    with torch.no_grad():
        embeddings = model(**inputs).embeddings

    # Normalize embeddings
    embeddings = torch.nn.functional.normalize(embeddings, dim=-1)

    return embeddings.squeeze().tolist()


if __name__ == "__main__":
    # Ensure the file exists before running or handle error
    try:
        my_fingerprint = get_fingerprint("reference.m4a")
        print(f"Fingerprint created successfully!")
        print(f"Embedding dimension: {len(my_fingerprint)}")
        print(f"First 10 values: {my_fingerprint[:10]}")
    except FileNotFoundError:
        print("Error: Audio file 'my_voice_password.wav' not found.")
        print("Please ensure the file exists in the current directory.")
    except Exception as e:
        print(f"Error: {e}")