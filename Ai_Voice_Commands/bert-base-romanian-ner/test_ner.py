from transformers import pipeline

# 1. Load your brand new custom brain!
print("Loading custom NER model...")
ner_pipe = pipeline(
    "token-classification",
    model="./banking-ner-model",  # Point it to your saved folder
    aggregation_strategy="simple"  # Automatically glues sub-words back together
)

# 2. Give it a sentence it has NEVER seen before
test_sentence = "fa o plata catre 0754616641 de 100 de ron"

# 3. Ask the model to extract the entities
print(f"\nAnalyzing: '{test_sentence}'\n")
results = ner_pipe(test_sentence)

# 4. Print the results nicely
for entity in results:
    word = entity['word']
    tag = entity['entity_group']
    confidence = entity['score'] * 100

    print(f"Extracted: {word:<15} | Tag: {tag:<15} | Confidence: {confidence:.2f}%")