import json
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    DataCollatorForTokenClassification,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
)

with open("banking_data_10k_final.json") as f:
    raw_data = json.load(f)

my_dataset = Dataset.from_dict(raw_data)

tokenizer = AutoTokenizer.from_pretrained("dumitrescustefan/bert-base-romanian-ner")

id2label = {
    0:  "O",
    1:  "B-SUMA",
    2:  "I-SUMA",
    3:  "B-VALUTA",
    4:  "B-BENEFICIAR",
    5:  "I-BENEFICIAR",
    6:  "B-FACTURA",
    7:  "I-FACTURA",
    8:  "B-SOLD",
    9:  "I-SOLD",
    10: "B-TRANZACTII",
    11: "I-TRANZACTII",
    12: "B-TRANSFER",
    13: "I-TRANSFER",
    14: "B-DATA",        # ← new
    15: "I-DATA",        # ← new
}
label2id = {v: k for k, v in id2label.items()}

B_TO_I_MAP = {1: 2, 4: 5, 6: 7, 8: 9, 10: 11, 12: 13, 14: 15}


def tokenize_and_align_labels(examples):
    tokenized_inputs = tokenizer(
        examples["tokens"], truncation=True, is_split_into_words=True
    )
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
                original_label = label[word_idx]
                label_ids.append(
                    B_TO_I_MAP.get(original_label, original_label)
                )
            previous_word_idx = word_idx
        labels.append(label_ids)
    tokenized_inputs["labels"] = labels
    return tokenized_inputs


tokenized_dataset = my_dataset.map(tokenize_and_align_labels, batched=True)
print("Dataset loaded and tokenized successfully!")

data_collator = DataCollatorForTokenClassification(tokenizer=tokenizer)

model = AutoModelForTokenClassification.from_pretrained(
    "dumitrescustefan/bert-base-romanian-ner",
    num_labels=16,          # was 14, now 16
    id2label=id2label,
    label2id=label2id,
    ignore_mismatched_sizes=True,
)
print("Model and Collator loaded successfully!")

training_args = TrainingArguments(
    output_dir="./ner_training_logs",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    num_train_epochs=3,
    weight_decay=0.01,
    logging_steps=100,
    save_strategy="no",
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    processing_class=tokenizer,
    data_collator=data_collator,
)

print("Starting training...")
trainer.train()

print("Training complete! Saving the model...")
trainer.save_model("banking-ner-model")
print("Done — model saved to ./banking-ner-model")