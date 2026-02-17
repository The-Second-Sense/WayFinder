import json
from datasets import Dataset
from transformers import AutoTokenizer, DataCollatorForTokenClassification, AutoModelForTokenClassification
from transformers import TrainingArguments, Trainer
with open("banking_data_10k.json") as f:
    raw_data = json.load(f)

my_dataset = Dataset.from_dict(raw_data)

tokenizer = AutoTokenizer.from_pretrained("dumitrescustefan/bert-base-romanian-ner")

def tokenize_and_allign_labels(examples):
    tokenized_inputs = tokenizer(examples["tokens"], truncation=True, is_split_into_words=True)

    labels = []
    for i, label in enumerate(examples["ner_tags"]):
        word_ids = tokenized_inputs.word_ids(batch_index=i)
        previous_word_idx = None
        label_ids = []
        for word_idx in word_ids:
            if word_idx is None:
                label_ids.append(-100)
            elif word_idx != previous_word_idx:
                label_ids.append(label[word_idx])
            else:
                label_ids.append(-100)
            previous_word_idx = word_idx
        labels.append(label_ids)

    tokenized_inputs["labels"] = labels
    return tokenized_inputs

tokenized_dataset = my_dataset.map(tokenize_and_allign_labels, batched=True)
print("Dataset loaded and tokenized successfully!")

data_collator = DataCollatorForTokenClassification(tokenizer=tokenizer)

id2label = {
    0: "O",
    1: "B-SUMA",
    2: "I-SUMA",
    3: "B-VALUTA",
    4: "B-BENEFICIAR",
    5: "I-BENEFICIAR",
    6: "B-FACTURA",
    7: "I-FACTURA",
    8: "B-SOLD",
    9: "I-SOLD",
    10: "B-TRANZACTII",
    11: "I-TRANZACTII",
}

label2id = {v: k for k, v in id2label.items()}

model = AutoModelForTokenClassification.from_pretrained(
    "dumitrescustefan/bert-base-romanian-ner",
    num_labels=12,
    id2label=id2label,
    label2id=label2id,
    ignore_mismatched_sizes=True
)
print("Model and Collator loaded successfully!")

training_args = TrainingArguments(
    output_dir="./ner_training_logs", # Where to save temporary backup files
    learning_rate=2e-5,               # How fast the model learns (2e-5 is standard for BERT)
    per_device_train_batch_size=16,    # How many sentences to look at once
    num_train_epochs=3,              # Show the 50 sentences to the model 15 times
    weight_decay=0.01,                # Prevents the model from just memorizing the data
    logging_steps=500,                  # Print an update every 2 steps
    save_strategy="no"                # Don't save intermediate steps to save hard drive space
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    processing_class=tokenizer,
    data_collator=data_collator,
)

print("Starting the training process. This might take a minute...")
trainer.train()

print("Training complete! Saving the model...")
trainer.save_model("banking-ner-model")
