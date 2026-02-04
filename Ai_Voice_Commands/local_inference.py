import requests
import os
from dotenv import load_dotenv

load_dotenv()
URL = os.getenv('URL')

data = {
    "text": "Am nevoie de o programare la dentist pentru o carie.",
    "labels": ["sănătate", "finanțe", "călătorii", "mâncare"]
}
response = requests.post(URL , json=data)
print(response.json())