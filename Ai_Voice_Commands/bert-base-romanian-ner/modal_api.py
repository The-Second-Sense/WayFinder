import modal
from pydantic import BaseModel
from transformers import pipeline
from typing import Optional


app = modal.App("banking-ner-intent-agent")

class NERRequest(BaseModel):
    text: str
    labels: Optional[list[str]] = None

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("fastapi[standard]", "transformers", "torch")
    .add_local_dir("./banking-ner-model", remote_path="/model")
)

@app.cls(
    image=image,
    gpu="T4",
    scaledown_window=300
)
class IntentAgent:
    @modal.enter()
    def load_model(self):
        print("Loading NER model...")
        self.pipeline = pipeline(
            "token-classification",
            model="/model",  # Load the model from the mounted directory
            aggregation_strategy="simple",
            device="cuda:0"
        )

    @modal.fastapi_endpoint(method="POST")
    def extract_entities(self, item: NERRequest):
        entities = self.pipeline(item.text)

        extracted_data = {}
        for entity in entities:
            tag = entity['entity_group']
            word = entity['word']
            if tag not in extracted_data:
                extracted_data[tag] = word
            extracted_data[tag] += f" {word}"

        intent_label = "ALTELE" # Default intent

        if "FACTURA" in extracted_data:
            intent_label = "PLATA_FACTURI"

        elif "SUMA" in extracted_data and "VALUTA" in extracted_data and "BENEFICIAR" in extracted_data:
            intent_label = "TRANSFER"

        elif "BENEFICIAR" in extracted_data and "SUMA" not in extracted_data:
            intent_label = "ADAUGA_BENEFICIAR"

        elif "SOLD" in extracted_data:
            intent_label = "SOLD"

        elif "TRANZACTII" in extracted_data:
            intent_label = "TRANZACTII"

        elif "SUMA" in extracted_data and "BENEFICIAR" in extracted_data:
            intent_label = "TRANSFER"


        return {
            "intent": intent_label,
            "entities": extracted_data
        }