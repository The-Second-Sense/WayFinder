import requests
import base64
from create_fingerprint import get_fingerprint

import json
import os

from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()

AGENT_URL = os.getenv("RECOGNITION_AGENT_URL")
DEBERTA_URL = os.getenv("INTENT_AGENT_URL")

REFERENCE_FILENAME = "reference.m4a"
COMMAND_FILENAME = "command.m4a"

def main():
    # 1. Check files
    if not os.path.exists(REFERENCE_FILENAME) or not os.path.exists(COMMAND_FILENAME):
        print(f"Error: Please ensure '{REFERENCE_FILENAME}' and '{COMMAND_FILENAME}' exist.")
        return

    # 2. Generate Fingerprint (Simulating Database Retrieval)
    try:
        fingerprint_list = get_fingerprint(REFERENCE_FILENAME)
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