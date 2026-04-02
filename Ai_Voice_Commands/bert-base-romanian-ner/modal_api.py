import modal
from pydantic import BaseModel
from transformers import pipeline
from typing import Optional
from datetime import date, timedelta
import re

app = modal.App("banking-ner-intent-agent")


class NERRequest(BaseModel):
    text: str
    labels: Optional[list[str]] = None


image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("fastapi[standard]", "transformers", "torch")
    .add_local_dir("./banking-ner-model", remote_path="/model")
)

MONTH_MAP = {
    "ianuarie": 1,  "ian": 1,
    "februarie": 2, "feb": 2,
    "martie": 3,    "mar": 3,
    "aprilie": 4,   "apr": 4,
    "mai": 5,
    "iunie": 6,     "iun": 6,
    "iulie": 7,     "iul": 7,
    "august": 8,    "aug": 8,
    "septembrie": 9,"sep": 9,  "sept": 9,
    "octombrie": 10,"oct": 10,
    "noiembrie": 11,"nov": 11,
    "decembrie": 12,"dec": 12,
}


def _fmt(d: date) -> str:
    return d.isoformat()


def _week_range(d: date):
    monday = d - timedelta(days=d.weekday())
    return _fmt(monday), _fmt(monday + timedelta(days=6))


def _month_range(year: int, month: int):
    from calendar import monthrange
    first = date(year, month, 1)
    last  = date(year, month, monthrange(year, month)[1])
    return _fmt(first), _fmt(last)


def resolve_date(raw: str, today: date | None = None):
    if today is None:
        today = date.today()
    t = raw.strip().lower()

    if t in ("azi", "astăzi", "astazi"):
        return _fmt(today), _fmt(today)
    if t == "ieri":
        d = today - timedelta(days=1); return _fmt(d), _fmt(d)
    if t in ("alaltăieri", "alaltaieri"):
        d = today - timedelta(days=2); return _fmt(d), _fmt(d)
    if re.fullmatch(r"aceast[aă]\s+s[aă]pt[aă]m[aâ]n[aă]", t):
        return _week_range(today)
    if re.fullmatch(r"s[aă]pt[aă]m[aâ]na\s+trecut[aă]", t):
        return _week_range(today - timedelta(weeks=1))
    if re.fullmatch(r"s[aă]pt[aă]m[aâ]na\s+asta", t):
        return _week_range(today)
    if re.fullmatch(r"ultima\s+s[aă]pt[aă]m[aâ]n[aă]", t):
        return _fmt(today - timedelta(days=6)), _fmt(today)
    if re.fullmatch(r"luna\s+(aceast[aă]|asta)", t):
        return _month_range(today.year, today.month)
    if re.fullmatch(r"luna\s+trecut[aă]", t):
        first = date(today.year, today.month, 1)
        prev  = first - timedelta(days=1)
        return _month_range(prev.year, prev.month)
    if re.fullmatch(r"ultima\s+lun[aă]", t):
        return _fmt(today - timedelta(days=29)), _fmt(today)
    m = re.fullmatch(r"ultimele\s+(\d+)\s+zile", t)
    if m:
        n = int(m.group(1)); return _fmt(today - timedelta(days=n-1)), _fmt(today)
    m = re.fullmatch(r"ultimele\s+(\d+)\s+luni", t)
    if m:
        n = int(m.group(1)); return _fmt(today - timedelta(days=n*30)), _fmt(today)
    m = re.fullmatch(r"acum\s+(\d+)\s+zile", t)
    if m:
        d = today - timedelta(days=int(m.group(1))); return _fmt(d), _fmt(d)
    if re.fullmatch(r"acum\s+o\s+s[aă]pt[aă]m[aâ]n[aă]", t):
        d = today - timedelta(weeks=1); return _fmt(d), _fmt(d)
    if re.fullmatch(r"acum\s+o\s+lun[aă]", t):
        d = today - timedelta(days=30); return _fmt(d), _fmt(d)
    m = re.fullmatch(r"(?:în\s+|in\s+)?luna\s+(\w+)", t)
    if m:
        mn = MONTH_MAP.get(m.group(1))
        if mn:
            yr = today.year if mn <= today.month else today.year - 1
            return _month_range(yr, mn)
    # single date or range DD.MM.YYYY
    dates = re.findall(r"\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b", t)
    if len(dates) == 2:
        try:
            d1 = date(int(dates[0][2]), int(dates[0][1]), int(dates[0][0]))
            d2 = date(int(dates[1][2]), int(dates[1][1]), int(dates[1][0]))
            return _fmt(min(d1,d2)), _fmt(max(d1,d2))
        except ValueError:
            pass
    elif len(dates) == 1:
        try:
            d = date(int(dates[0][2]), int(dates[0][1]), int(dates[0][0]))
            return _fmt(d), _fmt(d)
        except ValueError:
            pass
    m = re.fullmatch(r"ziua\s+de\s+(\d{1,2})", t)
    if m:
        try:
            d = date(today.year, today.month, int(m.group(1)))
            return _fmt(d), _fmt(d)
        except ValueError:
            pass
    if t.startswith("ieri"):
        d = today - timedelta(days=1); return _fmt(d), _fmt(d)
    return None, None


@app.cls(image=image, gpu="T4", scaledown_window=3000)
class IntentAgent:
    @modal.enter()
    def load_model(self):
        print("Loading NER model...")
        self.pipeline = pipeline(
            "token-classification",
            model="/model",
            aggregation_strategy="simple",
            device="cuda:0",
        )

    @modal.fastapi_endpoint(method="POST")
    def extract_entities(self, item: NERRequest):
        entities_raw = self.pipeline(item.text)

        # Collect entities; concatenate multi-token spans
        extracted: dict[str, str] = {}
        for entity in entities_raw:
            tag  = entity["entity_group"]
            word = entity["word"]
            extracted[tag] = (extracted[tag] + " " + word) if tag in extracted else word

        intent_label = "ALTELE"
        if "FACTURA" in extracted:
            intent_label = "PLATA_FACTURI"
        elif "SOLD"     in extracted:
            intent_label = "SOLD"
        elif "TRANZACTII" in extracted or "DATA" in extracted:
            intent_label = "TRANZACTII"
        elif "TRANSFER" in extracted or "SUMA" in extracted or "BENEFICIAR" in extracted:
            intent_label = "TRANSFER"


        date_from, date_to = None, None
        if "DATA" in extracted:
            date_from, date_to = resolve_date(extracted["DATA"])

        response = {
            "intent":    intent_label,
            "entities":  extracted,
        }
        if date_from is not None:
            response["date_from"] = date_from
            response["date_to"]   = date_to

        return response