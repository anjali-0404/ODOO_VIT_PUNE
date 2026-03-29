"""
OCR Microservice — FastAPI
Extracts structured data from receipt/invoice images.
"""

import io
import re
import logging
from contextlib import asynccontextmanager
from typing import Optional

import httpx
import pytesseract
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from transformers import pipeline

# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
log = logging.getLogger("ocr_service")

# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────
SUPPORTED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/tiff", "image/bmp"}
MAX_FILE_SIZE_MB = 10
CURRENCY_LABELS = ["USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD", "CNY"]
CATEGORY_LABELS = [
    "Food & Dining", "Travel & Transport", "Utilities", "Healthcare",
    "Shopping", "Entertainment", "Office Supplies", "Fuel", "Others",
]
EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/{}"

# ─────────────────────────────────────────────
# App Lifecycle — lazy-load heavy models once
# ─────────────────────────────────────────────
_classifier: dict = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Loading zero-shot classification model…")
    _classifier["model"] = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
    )
    log.info("Model loaded.")
    yield
    _classifier.clear()
    log.info("Model unloaded.")


# ─────────────────────────────────────────────
# Rate Limiter
# ─────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ─────────────────────────────────────────────
# App
# ─────────────────────────────────────────────
app = FastAPI(
    title="AI-Enhanced OCR Service",
    description="Extracts structured data from receipt/invoice images with AI-powered currency & category detection.",
    version="2.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Pydantic Schemas
# ─────────────────────────────────────────────
class LineItem(BaseModel):
    name: str
    amount: float


class ConversionResult(BaseModel):
    from_currency: str
    to_currency: str
    original_amount: float
    converted_amount: float
    rate: float


class ExtractedReceipt(BaseModel):
    vendor: Optional[str]
    invoice_number: Optional[str]
    date: Optional[str]
    time: Optional[str]
    payment_method: Optional[str]
    category: str
    items: list[LineItem]
    subtotal: Optional[float]
    tax: Optional[float]
    total: Optional[float]
    currency: str
    org_currency: str
    conversion: Optional[ConversionResult]


class OCRResponse(BaseModel):
    success: bool
    data: Optional[ExtractedReceipt] = None
    raw_text: Optional[str] = Field(None, description="Raw OCR output — omit in prod if sensitive")
    error: Optional[str] = None


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────
def _preprocess_image(raw_bytes: bytes) -> Image.Image:
    """Open, convert to greyscale, upscale small images without distorting aspect ratio."""
    img = Image.open(io.BytesIO(raw_bytes)).convert("L")  # greyscale improves OCR
    max_side = 2048
    w, h = img.size
    if max(w, h) < max_side:
        scale = max_side / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    return img


def _run_ocr(img: Image.Image) -> str:
    """Run Tesseract with a config tuned for receipts."""
    config = "--oem 3 --psm 6"   # LSTM engine + assume uniform block of text
    return pytesseract.image_to_string(img, config=config)


def _classify(text: str, labels: list[str]) -> str:
    """Zero-shot classify text against a label list; returns top label."""
    try:
        result = _classifier["model"](text[:512], candidate_labels=labels)
        return result["labels"][0]
    except Exception as exc:
        log.warning("Classifier failed: %s", exc)
        return labels[-1]  # fallback to last label (e.g. "Others" / "USD")


def _normalise_amount(raw: str) -> Optional[float]:
    """Turn '1,234.56' or '1.234,56' into a Python float."""
    s = raw.strip()
    # European format: 1.234,56
    if re.search(r'\d{1,3}(\.\d{3})+(,\d{2})$', s):
        s = s.replace(".", "").replace(",", ".")
    else:
        s = s.replace(",", "")  # strip thousand separators only
    try:
        return float(s)
    except ValueError:
        return None


def _extract_structured(text: str) -> dict:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    data: dict = {
        "vendor": None, "invoice_number": None, "date": None,
        "time": None, "payment_method": None, "category": "Others",
        "items": [], "subtotal": None, "tax": None, "total": None,
    }

    # Vendor: first line that is long enough and looks like a name
    for line in lines:
        if len(line) > 3 and not re.match(r'^[\d\W]+$', line):
            data["vendor"] = line
            break

    # Invoice / receipt number
    m = re.search(r'(?:invoice|bill|receipt|order)[#:\s]*([A-Za-z0-9\-/]+)', text, re.I)
    if m:
        data["invoice_number"] = m.group(1)

    # Date: handles DD/MM/YYYY, YYYY-MM-DD, DD-Mon-YYYY
    m = re.search(
        r'(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2}'
        r'|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',
        text, re.I,
    )
    if m:
        data["date"] = m.group(1)

    # Time
    m = re.search(r'\b(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[APap][Mm])?)\b', text)
    if m:
        data["time"] = m.group(1)

    # Payment method
    pm_map = {
        "upi": "UPI", "gpay": "UPI", "phonepe": "UPI", "paytm": "UPI",
        "credit card": "Credit Card", "debit card": "Debit Card",
        "card": "Card", "cash": "Cash", "neft": "NEFT", "netbanking": "Net Banking",
    }
    for keyword, label in pm_map.items():
        if keyword in text.lower():
            data["payment_method"] = label
            break

    # Line items — name followed by an amount on the same line
    item_re = re.compile(
        r'^(?P<name>[A-Za-z0-9&\-\'\"(). ]{3,40})\s{2,}(?P<amount>[\d,]+\.\d{2})\s*$'
    )
    skip_keywords = {"subtotal", "sub total", "total", "tax", "gst", "vat", "discount", "change", "balance"}
    for line in lines:
        if any(kw in line.lower() for kw in skip_keywords):
            continue
        m = item_re.match(line)
        if m:
            amt = _normalise_amount(m.group("amount"))
            if amt is not None:
                data["items"].append({"name": m.group("name").strip(), "amount": amt})

    # Tax
    m = re.search(r'(?:tax|gst|vat|cgst|sgst)[^\d]*([\d,]+\.\d{2})', text, re.I)
    if m:
        data["tax"] = _normalise_amount(m.group(1))

    # Total — look for 'grand total' first, then 'total'
    for pattern in [
        r'grand\s+total[^\d]*([\d,]+\.\d{2})',
        r'(?<!\w)total[^\d]*([\d,]+\.\d{2})',
    ]:
        m = re.search(pattern, text, re.I)
        if m:
            data["total"] = _normalise_amount(m.group(1))
            break

    # Subtotal
    m = re.search(r'sub\s*total[^\d]*([\d,]+\.\d{2})', text, re.I)
    if m:
        data["subtotal"] = _normalise_amount(m.group(1))
    elif data["items"]:
        data["subtotal"] = round(sum(i["amount"] for i in data["items"]), 2)

    return data


async def _convert_currency(amount: float, from_cur: str, to_cur: str) -> Optional[ConversionResult]:
    if from_cur == to_cur:
        return ConversionResult(
            from_currency=from_cur, to_currency=to_cur,
            original_amount=amount, converted_amount=amount, rate=1.0,
        )
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(EXCHANGE_API_URL.format(from_cur))
            res.raise_for_status()
            rate = res.json()["rates"].get(to_cur)
            if rate:
                return ConversionResult(
                    from_currency=from_cur, to_currency=to_cur,
                    original_amount=amount,
                    converted_amount=round(amount * rate, 2),
                    rate=rate,
                )
    except Exception as exc:
        log.warning("Currency conversion failed: %s", exc)
    return None


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────
@app.post(
    "/ocr/extract",
    response_model=OCRResponse,
    summary="Extract structured data from a receipt image",
)
@limiter.limit("30/minute")
async def extract_receipt(
    request: Request,
    file: UploadFile = File(..., description="Receipt image (JPEG, PNG, WEBP, TIFF, BMP)"),
    org_currency: str = Form(..., description="Organisation base currency code, e.g. INR"),
    receipt_currency: Optional[str] = Form(None, description="Currency detected on the receipt (optional, if not provided will be auto-detected)"),
    include_raw_text: bool = Form(False, description="Return raw OCR text in response"),
):
    # ── Validate MIME type ──────────────────────
    if file.content_type not in SUPPORTED_MIME_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Accepted: {', '.join(SUPPORTED_MIME_TYPES)}",
        )

    # ── Validate file size ──────────────────────
    raw_bytes = await file.read()
    size_mb = len(raw_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=413, detail=f"File too large ({size_mb:.1f} MB). Max {MAX_FILE_SIZE_MB} MB.")

    # ── Normalise currency code ─────────────────
    org_currency = org_currency.upper().strip()

    try:
        # ── OCR ────────────────────────────────
        img = _preprocess_image(raw_bytes)
        raw_text = _run_ocr(img)
        log.info("OCR complete — %d characters extracted", len(raw_text))

        # ── Structured extraction ───────────────
        extracted = _extract_structured(raw_text)

        # ── Currency detection ──────────────────
        # Use provided currency if available, otherwise fall back to AI detection
        if receipt_currency and receipt_currency.upper().strip() in CURRENCY_LABELS:
            detected_currency = receipt_currency.upper().strip()
            log.info("Using provided currency: %s", detected_currency)
        else:
            detected_currency = _classify(raw_text, CURRENCY_LABELS)
            log.info("Auto-detected currency: %s", detected_currency)
        
        # ── AI: category ───────────────────────
        detected_category = _classify(raw_text, CATEGORY_LABELS)
        extracted["currency"] = detected_currency
        extracted["category"] = detected_category
        log.info("Currency=%s  category=%s", detected_currency, detected_category)

        # ── Currency conversion ─────────────────
        amount_for_conversion = extracted.get("total") or extracted.get("subtotal")
        conversion = None
        if amount_for_conversion:
            conversion = await _convert_currency(amount_for_conversion, detected_currency, org_currency)

        receipt = ExtractedReceipt(
            **{k: v for k, v in extracted.items() if k != "items"},
            items=[LineItem(**i) for i in extracted["items"]],
            org_currency=org_currency,
            conversion=conversion,
        )

        return OCRResponse(
            success=True,
            data=receipt,
            raw_text=raw_text if include_raw_text else None,
        )

    except HTTPException:
        raise
    except Exception as exc:
        log.exception("Unhandled error during OCR extraction")
        return OCRResponse(success=False, error=str(exc))


@app.get("/health", summary="Health check")
def health():
    model_ready = "model" in _classifier
    return {"status": "ok", "model_loaded": model_ready}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", port=8000, reload=True)