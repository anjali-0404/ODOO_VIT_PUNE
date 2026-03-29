# 🧾 OCR Microservice

An AI-powered receipt and invoice extraction service built with **FastAPI**, **Tesseract OCR**, and **HuggingFace Transformers**. Upload a receipt image and get back structured JSON — vendor, line items, totals, tax, payment method, category, currency detection, and live currency conversion.

No external LLM APIs. Fully self-hosted.

---

## Architecture

```
Client (Flask Tester / Odoo / Any HTTP client)
        │
        │  POST /ocr/extract  (multipart/form-data)
        ▼
┌─────────────────────────────┐
│     FastAPI OCR Service     │
│                             │
│  1. Validate image          │
│  2. Preprocess (resize, B/W)│
│  3. Tesseract OCR  ───────► │
│  4. Regex parsing           │
│  5. AI classification ────► │──► HuggingFace (BART MNLI)
│  6. Currency conversion ──► │──► ExchangeRate API
│  7. Return OCRResponse      │
└─────────────────────────────┘
```

---

## Features

* **Fully self-hosted** — no paid APIs required

* Extracts:

  * vendor, invoice number, date, time
  * payment method
  * line items
  * subtotal, tax, total

* **AI-powered classification**

  * Expense category detection
  * Currency detection fallback

* **Smart currency handling**

  * Auto-detect receipt currency
  * Convert to organization currency

* **Robust OCR pipeline**

  * Grayscale conversion
  * Image upscaling for better accuracy
  * Tesseract tuned for receipts (`--oem 3 --psm 6`)

* Supports:

  * JPEG, PNG, WEBP, TIFF, BMP (max 10 MB)

* Production-ready:

  * Rate limiting (30 req/min)
  * CORS enabled
  * Pydantic schemas
  * Structured logging

* Includes a **Flask tester UI** for local testing

---

## Project Structure

```
ocr-service/
├── main.py           # FastAPI OCR service
├── app.py            # Flask tester UI
├── requirements.txt  # Python dependencies
└── README.md
```

---

## Quickstart (Local)

### 1. Prerequisites

* Python 3.10+
* Tesseract OCR installed

---

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

---

### 3. Install Tesseract

#### Ubuntu:

```bash
sudo apt install tesseract-ocr
```

#### Mac:

```bash
brew install tesseract
```

#### Windows:

Download from:
[https://github.com/tesseract-ocr/tesseract](https://github.com/tesseract-ocr/tesseract)

---

### 4. Run OCR Service

```bash
python main.py
```

Runs at:

```
http://localhost:8000
```

---

### 5. Run Flask Tester (optional)

```bash
python app.py
```

Open:

```
http://localhost:5001
```

---

## API Reference

### `POST /ocr/extract`

Extract structured data from a receipt image.

### Request — `multipart/form-data`

| Field              | Type   | Required | Description                |
| ------------------ | ------ | -------- | -------------------------- |
| `file`             | file   | ✅        | Receipt image              |
| `org_currency`     | string | ✅        | Target currency (e.g. INR) |
| `receipt_currency` | string | ❌        | Override detected currency |
| `include_raw_text` | bool   | ❌        | Include OCR text           |

---

### Response

```json
{
  "success": true,
  "data": {
    "vendor": "ABC Store",
    "invoice_number": "INV123",
    "date": "12/02/2025",
    "time": "14:32",
    "payment_method": "UPI",
    "category": "Food & Dining",
    "currency": "INR",
    "items": [
      { "name": "Item A", "amount": 50.00 }
    ],
    "subtotal": 50.00,
    "tax": 2.50,
    "total": 52.50,
    "org_currency": "USD",
    "conversion": {
      "from_currency": "INR",
      "to_currency": "USD",
      "original_amount": 52.50,
      "converted_amount": 0.63,
      "rate": 0.012
    }
  }
}
```

---

### Error Response

```json
{
  "success": false,
  "error": "Unsupported file type"
}
```

---

### Status Codes

| Code | Meaning             |
| ---- | ------------------- |
| 200  | Success             |
| 413  | File too large      |
| 415  | Unsupported format  |
| 429  | Rate limit exceeded |
| 500  | Internal error      |

---

### `GET /health`

```json
{
  "status": "ok",
  "model_loaded": true
}
```

---

## Flask Tester

Local UI for testing:

```
http://localhost:5001
```

### Features

* Drag & drop upload
* Image preview
* Currency selection
* Raw OCR toggle
* Line items + structured view
* Full JSON response
* Health check indicator

---

## Environment Variables

| Variable          | Required | Default                                        | Description |
| ----------------- | -------- | ---------------------------------------------- | ----------- |
| `OCR_SERVICE_URL` | ❌        | [http://localhost:8000](http://localhost:8000) | Backend URL |
| `FLASK_PORT`      | ❌        | 5001                                           | Tester port |

---

## Calling from Python

```python
import requests

with open("receipt.jpg", "rb") as f:
    res = requests.post(
        "http://localhost:8000/ocr/extract",
        files={"file": f},
        data={"org_currency": "INR"},
    )

print(res.json())
```

---

## Supported Categories

Food & Dining · Travel & Transport · Utilities · Healthcare · Shopping · Entertainment · Office Supplies · Fuel · Others

---

## Supported Currencies

INR · USD · EUR · GBP · JPY · AUD · CAD · CNY

---

## Known Limitations

* **Handwritten receipts** → poor accuracy (Tesseract limitation)
* **Low-quality images** → reduced extraction accuracy
* **Regex-based parsing** → may fail on complex invoice layouts
* **Currency conversion** depends on external API availability

---

## Future Improvements

* LLM-based structured extraction
* Better layout-aware parsing
* Batch processing
* Docker + cloud deployment
* Authentication & API keys

---
