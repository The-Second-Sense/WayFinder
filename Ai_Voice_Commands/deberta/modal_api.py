import modal
from pydantic import BaseModel

#
# NEXT PHASE : IMPLEMENT dumitrescustefan/bert-base-romanian-ner
#

# 1. Setup App and Cache Volume
app = modal.App("deberta-romanian-api")
cache_volume = modal.Volume.from_name("hf-hub-cache", create_if_missing=True)


# 2. Define the Request Structure (Data validation)
class ClassificationRequest(BaseModel):
    text: str
    labels: list[str]


# 3. Define the Image (Environment)
image = (
    modal.Image.debian_slim()
    .pip_install("fastapi[standard]","transformers", "torch", "accelerate", "sentencepiece")
    .env({"HF_HOME": "/cache"})  # Point Hugging Face to our cache volume
)


# 4. The Model Class
@app.cls(
    image=image,
    volumes={"/cache": cache_volume},
    gpu="T4",
    container_idle_timeout=300,  # Keep container alive for 5 mins after last request
)
class ZeroShotModel:
    @modal.enter()
    def load_model(self):
        """Loads the model once when the container starts."""
        from transformers import pipeline
        import time

        print("Loading model from cache...")
        start = time.time()
        self.classifier = pipeline(
            "zero-shot-classification",
            model="",
            device=0 #gpu
        )
        print(f"Model loaded in {time.time() - start:.2f}s")

    @modal.web_endpoint(method="POST")
    def classify(self, item: ClassificationRequest):
        """This function will be exposed as a URL."""

        # Run inference using the Romanian template
        result = self.classifier(
            item.text,
            item.labels,
            multi_label=False,
            hypothesis_template="Acest exemplu este {}."
        )

        # Return a clean JSON response
        return {
            "winner": result['labels'][0],
            "score": result['scores'][0],
            "all_scores": dict(zip(result['labels'], result['scores']))
        }
