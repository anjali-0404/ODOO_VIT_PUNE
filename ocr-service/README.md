# OCR Service

FastAPI-based OCR microservice for extracting structured receipt and invoice data.

It combines:
- Tesseract OCR for text extraction
- Rule-based parsing for fields and totals
- Zero-shot classification (BART MNLI) for category and currency fallback
- Optional currency conversion using ExchangeRate API

## What It Extracts

- Vendor name
- Invoice or receipt number
- Date and time
- Payment method
- Line items
- Subtotal, tax, total
- Expense category
- Receipt currency and conversion to organization currency

## Repository Layout

```text
ocr-service/
  main.py           FastAPI OCR service
  app.py            Flask-based local tester UI
  requirements.txt  Python dependencies
  README.md
```

## Prerequisites

- Python 3.10+
- Tesseract OCR installed and available on PATH

Install Tesseract:

- Ubuntu

```bash
sudo apt install tesseract-ocr
```

- macOS

```bash
brew install tesseract
```

- Windows
  - Install from the official project releases.
  - Ensure the install directory (for example, C:\Program Files\Tesseract-OCR) is added to PATH.
  - Verify with:

```bash
tesseract --version
```

## Setup

From the ocr-service directory:

```bash
pip install -r requirements.txt
```

## Run the Service

Option 1 (matches current code entrypoint):

```bash
python main.py
```

Option 2 (explicit uvicorn):

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Service URL:
- http://localhost:8000

Important note:
- The first startup can be slower because the zero-shot model is loaded during app lifespan initialization.

## Run Local Tester UI (Optional)

```bash
python app.py
```

Tester URL:
- http://localhost:5001

## API

### POST /ocr/extract

Consumes multipart/form-data.

Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| file | file | Yes | Receipt image |
| org_currency | string | Yes | Organization/base currency code, for example INR |
| receipt_currency | string | No | Override detected receipt currency |
| include_raw_text | bool | No | Include OCR text in response |

Accepted file types:
- image/jpeg
- image/png
- image/webp
- image/tiff
- image/bmp

Max file size:
- 10 MB

Rate limit:
- 30 requests per minute per client IP

Example request:

```bash
curl -X POST http://localhost:8000/ocr/extract \
  -F "file=@receipt.jpg" \
  -F "org_currency=INR" \
  -F "include_raw_text=true"
```

Example success response:

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
    "items": [
      {"name": "Item A", "amount": 50.0}
    ],
    "subtotal": 50.0,
    "tax": 2.5,
    "total": 52.5,
    "currency": "INR",
    "org_currency": "USD",
    "conversion": {
      "from_currency": "INR",
      "to_currency": "USD",
      "original_amount": 52.5,
      "converted_amount": 0.63,
      "rate": 0.012
    }
  },
  "raw_text": "..."
}
```

Common status codes:

| Code | Meaning |
| --- | --- |
| 200 | Success |
| 413 | File too large |
| 415 | Unsupported file type |
| 429 | Rate limit exceeded |
| 500 | Internal error |

### GET /health

Returns service health and model readiness.

Example:

```json
{
  "status": "ok",
  "model_loaded": true
}
```

## Supported Labels

Categories:
- Food & Dining
- Travel & Transport
- Utilities
- Healthcare
- Shopping
- Entertainment
- Office Supplies
- Fuel
- Others

Currencies:
- USD
- INR
- EUR
- GBP
- JPY
- AUD
- CAD
- CNY

## Environment Variables

Used by the local Flask tester:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| OCR_SERVICE_URL | No | http://localhost:8000 | Target OCR service URL |
| FLASK_PORT | No | 5001 | Tester UI port |

## Minimal Python Client Example

```python
import requests

with open("receipt.jpg", "rb") as f:
    response = requests.post(
        "http://localhost:8000/ocr/extract",
        files={"file": f},
        data={"org_currency": "INR", "include_raw_text": "false"},
        timeout=30,
    )

print(response.status_code)
print(response.json())
```

## Known Limitations

- Handwritten receipts are less reliable with Tesseract.
- OCR quality depends strongly on image quality and layout.
- Rule-based parsing may miss unusual invoice formats.
- Currency conversion depends on external exchange-rate API availability.

## Troubleshooting

- Error: tesseract is not installed or not in PATH
  - Install Tesseract and verify tesseract --version works in the same terminal.

- Slow first request
  - Expected behavior. The classification model loads on startup.

- Conversion is null in response
  - Check internet connectivity and target currency support from exchange-rate provider.
