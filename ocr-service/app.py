"""
Flask Tester — OCR Microservice
Run this locally to test the OCR service before forwarding to production.

Usage:
    pip install flask requests
    python flask_tester.py
    Open http://localhost:5001
"""

import json
import os

import requests
from flask import Flask, jsonify, redirect, render_template_string, request, url_for

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB

OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", "http://localhost:8000")

# ─────────────────────────────────────────────
# HTML Template (single-file, no separate templates dir needed)
# ─────────────────────────────────────────────
HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>OCR Service Tester</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: system-ui, -apple-system, sans-serif;
    background: #0f1117;
    color: #e2e8f0;
    min-height: 100vh;
    padding: 2rem;
  }

  h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: .25rem; }
  h2 { font-size: 1rem; font-weight: 600; margin-bottom: .75rem; color: #94a3b8; }
  .subtitle { color: #64748b; font-size: .875rem; margin-bottom: 2rem; }

  .layout { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; }
  @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

  .card {
    background: #1e2330;
    border: 1px solid #2d3348;
    border-radius: 12px;
    padding: 1.5rem;
  }

  label { display: block; font-size: .8rem; font-weight: 600; color: #94a3b8;
          text-transform: uppercase; letter-spacing: .05em; margin-bottom: .4rem; }

  .field { margin-bottom: 1.25rem; }

  input[type="text"], select {
    width: 100%; padding: .6rem .85rem;
    background: #0f1117; border: 1px solid #2d3348; border-radius: 8px;
    color: #e2e8f0; font-size: .9rem; outline: none;
    transition: border-color .2s;
  }
  input[type="text"]:focus, select:focus { border-color: #6366f1; }

  .drop-zone {
    border: 2px dashed #2d3348; border-radius: 10px;
    padding: 2.5rem 1rem; text-align: center; cursor: pointer;
    transition: border-color .2s, background .2s;
    position: relative;
  }
  .drop-zone:hover, .drop-zone.dragover { border-color: #6366f1; background: #1a1f2e; }
  .drop-zone input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .drop-zone .icon { font-size: 2rem; margin-bottom: .5rem; }
  .drop-zone p { color: #64748b; font-size: .875rem; }
  .drop-zone .filename { color: #6366f1; font-weight: 600; margin-top: .4rem; }

  #preview-wrap { margin-top: 1rem; display: none; }
  #preview-wrap img { max-width: 100%; border-radius: 8px; border: 1px solid #2d3348; }

  .checkbox-row { display: flex; align-items: center; gap: .5rem; margin-bottom: 1.25rem; }
  .checkbox-row input { width: 16px; height: 16px; accent-color: #6366f1; }
  .checkbox-row label { margin: 0; font-size: .875rem; text-transform: none; letter-spacing: 0; }

  .btn {
    width: 100%; padding: .75rem;
    background: #6366f1; color: #fff; font-weight: 700;
    font-size: .95rem; border: none; border-radius: 8px; cursor: pointer;
    transition: background .2s;
  }
  .btn:hover { background: #4f46e5; }
  .btn:disabled { background: #374151; color: #6b7280; cursor: not-allowed; }

  .status-bar {
    margin-top: 1rem; padding: .6rem 1rem; border-radius: 8px;
    font-size: .875rem; display: none;
  }
  .status-bar.loading  { background: #1e3a5f; color: #93c5fd; display: block; }
  .status-bar.success  { background: #14432a; color: #6ee7b7; display: block; }
  .status-bar.error    { background: #4c1d1d; color: #fca5a5; display: block; }

  /* Result panel */
  .result-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 100%; min-height: 300px; color: #4b5563;
  }
  .result-empty .big-icon { font-size: 3rem; margin-bottom: .75rem; }

  .result-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }
  @media (max-width: 600px) { .result-grid { grid-template-columns: 1fr; } }

  .result-field { background: #0f1117; border-radius: 8px; padding: .75rem 1rem; }
  .result-field .key { font-size: .7rem; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .2rem; }
  .result-field .val { font-size: .95rem; color: #e2e8f0; word-break: break-all; }
  .result-field .val.empty { color: #4b5563; font-style: italic; }

  .badge { display: inline-block; padding: .2rem .55rem; border-radius: 999px; font-size: .75rem; font-weight: 700; }
  .badge-green  { background: #14432a; color: #6ee7b7; }
  .badge-yellow { background: #422006; color: #fcd34d; }
  .badge-blue   { background: #1e3a5f; color: #93c5fd; }

  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; }
  .items-table th { background: #0f1117; color: #64748b; font-size: .75rem;
                    text-transform: uppercase; letter-spacing: .05em; padding: .5rem .75rem; text-align: left; }
  .items-table td { padding: .5rem .75rem; font-size: .875rem; border-bottom: 1px solid #1e2330; }
  .items-table tr:last-child td { border-bottom: none; }
  .items-table .amt { text-align: right; font-variant-numeric: tabular-nums; }

  .conversion-box {
    background: #1a1f2e; border: 1px solid #6366f1; border-radius: 10px; padding: 1rem;
    margin-bottom: 1.25rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  }
  .conversion-box .arrow { font-size: 1.5rem; }
  .currency-pill { background: #0f1117; border-radius: 8px; padding: .5rem 1rem; text-align: center; }
  .currency-pill .code { font-size: .75rem; color: #94a3b8; text-transform: uppercase; }
  .currency-pill .amount { font-size: 1.2rem; font-weight: 700; color: #e2e8f0; }
  .rate-tag { margin-left: auto; color: #64748b; font-size: .8rem; }

  .raw-text-block {
    background: #0f1117; border: 1px solid #2d3348; border-radius: 8px;
    padding: 1rem; font-family: monospace; font-size: .75rem;
    white-space: pre-wrap; color: #94a3b8; max-height: 200px; overflow-y: auto;
    margin-bottom: 1rem;
  }

  .section-title { font-size: .8rem; font-weight: 700; color: #6366f1;
                   text-transform: uppercase; letter-spacing: .06em; margin-bottom: .75rem; }

  .health-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: .4rem; }
  .dot-green  { background: #22c55e; }
  .dot-red    { background: #ef4444; }
  .dot-grey   { background: #6b7280; }

  hr { border: none; border-top: 1px solid #2d3348; margin: 1.25rem 0; }
</style>
</head>
<body>

<h1>🧾 OCR Service Tester</h1>
<p class="subtitle">
  Service: <strong>{{ service_url }}</strong>
  &nbsp;|&nbsp;
  Health: <span id="health-status"><span class="health-dot dot-grey"></span>Checking…</span>
</p>

<div class="layout">

  <!-- ── LEFT: Upload Form ── -->
  <div>
    <div class="card">
      <h2>Upload Receipt</h2>

      <div class="field">
        <label>Organisation Currency</label>
        <select id="org_currency" name="org_currency">
          {% for code in currencies %}
          <option value="{{ code }}" {% if code == 'INR' %}selected{% endif %}>{{ code }}</option>
          {% endfor %}
        </select>
      </div>

      <div class="field">
        <label>Receipt Currency (Optional)</label>
        <select id="receipt_currency" name="receipt_currency">
          <option value="">Auto-detect from receipt</option>
          {% for code in currencies %}
          <option value="{{ code }}">{{ code }}</option>
          {% endfor %}
        </select>
        <div style="font-size: .75rem; color: #64748b; margin-top: .25rem;">
          Leave empty to auto-detect currency from the receipt image
        </div>
      </div>

      <div class="field">
        <label>Receipt Image</label>
        <div class="drop-zone" id="drop-zone">
          <input type="file" id="file-input" accept="image/jpeg,image/png,image/webp,image/tiff,image/bmp">
          <div class="icon">📂</div>
          <p>Drag & drop or click to browse</p>
          <p>JPEG · PNG · WEBP · TIFF · BMP · max 10 MB</p>
          <div class="filename" id="filename-label"></div>
        </div>
        <div id="preview-wrap">
          <img id="preview-img" src="" alt="Preview">
        </div>
      </div>

      <div class="checkbox-row">
        <input type="checkbox" id="include_raw_text">
        <label for="include_raw_text">Include raw OCR text in response</label>
      </div>

      <button class="btn" id="submit-btn" onclick="submitForm()">Extract Receipt Data</button>
      <div class="status-bar" id="status-bar"></div>
    </div>
  </div>

  <!-- ── RIGHT: Result Panel ── -->
  <div class="card" id="result-panel">
    <div class="result-empty" id="empty-state">
      <div class="big-icon">🔍</div>
      <p>Upload a receipt to see extracted data</p>
    </div>
    <div id="result-content" style="display:none"></div>
  </div>

</div>

<script>
const SERVICE = "{{ service_url }}";

// ── Health check ──────────────────────────────────────────
async function checkHealth() {
  const el = document.getElementById("health-status");
  try {
    const res = await fetch(`${SERVICE}/health`);
    const data = await res.json();
    const ok = data.status === "ok";
    el.innerHTML = `<span class="health-dot ${ok ? 'dot-green' : 'dot-red'}"></span>${ok ? 'Online' : 'Degraded'} ${data.model_loaded ? '· Model ready' : '· Model loading…'}`;
  } catch {
    el.innerHTML = `<span class="health-dot dot-red"></span>Unreachable`;
  }
}
checkHealth();
setInterval(checkHealth, 15000);

// ── File picker / drag-drop ───────────────────────────────
const fileInput = document.getElementById("file-input");
const dropZone  = document.getElementById("drop-zone");
const filenameLabel = document.getElementById("filename-label");

fileInput.addEventListener("change", () => handleFile(fileInput.files[0]));
dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) { fileInput.files = e.dataTransfer.files; handleFile(file); }
});

function handleFile(file) {
  if (!file) return;
  filenameLabel.textContent = `${file.name}  (${(file.size/1024).toFixed(1)} KB)`;
  const reader = new FileReader();
  reader.onload = e => {
    const wrap = document.getElementById("preview-wrap");
    document.getElementById("preview-img").src = e.target.result;
    wrap.style.display = "block";
  };
  reader.readAsDataURL(file);
}

// ── Submit ────────────────────────────────────────────────
async function submitForm() {
  const file = fileInput.files[0];
  if (!file) { showStatus("error", "Please select a receipt image first."); return; }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("org_currency", document.getElementById("org_currency").value);
  const receiptCurrency = document.getElementById("receipt_currency").value;
  if (receiptCurrency) {
    formData.append("receipt_currency", receiptCurrency);
  }
  formData.append("include_raw_text", document.getElementById("include_raw_text").checked ? "true" : "false");

  const btn = document.getElementById("submit-btn");
  btn.disabled = true;
  showStatus("loading", "⏳  Sending to OCR service…");

  try {
    const res = await fetch(`${SERVICE}/ocr/extract`, { method: "POST", body: formData });
    const data = await res.json();

    if (data.success) {
      showStatus("success", "✅  Extraction successful.");
      renderResult(data);
    } else {
      showStatus("error", `❌  Error: ${data.error}`);
      document.getElementById("empty-state").style.display = "flex";
      document.getElementById("result-content").style.display = "none";
    }
  } catch (err) {
    showStatus("error", `❌  Could not reach OCR service: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
}

function showStatus(type, msg) {
  const el = document.getElementById("status-bar");
  el.className = `status-bar ${type}`;
  el.textContent = msg;
}

// ── Render result ─────────────────────────────────────────
function renderResult(resp) {
  const d = resp.data;
  document.getElementById("empty-state").style.display = "none";
  const content = document.getElementById("result-content");
  content.style.display = "block";

  const val = (v) => v != null ? String(v) : null;
  const disp = (v) => v != null ? `<span class="val">${escHtml(String(v))}</span>` : `<span class="val empty">—</span>`;

  const fields = [
    ["Vendor",          val(d.vendor)],
    ["Invoice #",       val(d.invoice_number)],
    ["Date",            val(d.date)],
    ["Time",            val(d.time)],
    ["Payment Method",  val(d.payment_method)],
    ["Category",        val(d.category)],
    ["Detected Currency", `<span class="badge badge-blue">${escHtml(d.currency)}</span>`],
    ["Org Currency",    `<span class="badge badge-yellow">${escHtml(d.org_currency)}</span>`],
    ["Subtotal",        val(d.subtotal)],
    ["Tax",             val(d.tax)],
    ["Total",           val(d.total) ? `<strong>${escHtml(String(d.total))}</strong>` : null],
  ];

  const gridHTML = fields.map(([k, v]) => `
    <div class="result-field">
      <div class="key">${k}</div>
      <div class="val">${v != null ? v : '<span class="val empty">—</span>'}</div>
    </div>`).join("");

  let itemsHTML = "";
  if (d.items && d.items.length > 0) {
    const rows = d.items.map(i =>
      `<tr><td>${escHtml(i.name)}</td><td class="amt">${i.amount.toFixed(2)}</td></tr>`
    ).join("");
    itemsHTML = `
      <div class="section-title">Line Items</div>
      <table class="items-table">
        <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  let convHTML = "";
  if (d.conversion) {
    const c = d.conversion;
    convHTML = `
      <div class="section-title">Currency Conversion</div>
      <div class="conversion-box">
        <div class="currency-pill">
          <div class="code">${escHtml(c.from_currency)}</div>
          <div class="amount">${c.original_amount.toFixed(2)}</div>
        </div>
        <span class="arrow">→</span>
        <div class="currency-pill">
          <div class="code">${escHtml(c.to_currency)}</div>
          <div class="amount">${c.converted_amount.toFixed(2)}</div>
        </div>
        <span class="rate-tag">Rate: 1 ${escHtml(c.from_currency)} = ${c.rate} ${escHtml(c.to_currency)}</span>
      </div>`;
  }

  let rawHTML = "";
  if (resp.raw_text) {
    rawHTML = `
      <hr>
      <div class="section-title">Raw OCR Text</div>
      <div class="raw-text-block">${escHtml(resp.raw_text)}</div>`;
  }

  content.innerHTML = `
    <div class="result-grid">${gridHTML}</div>
    ${itemsHTML}
    ${convHTML}
    ${rawHTML}
    <hr>
    <div class="section-title">Full JSON Response</div>
    <div class="raw-text-block">${escHtml(JSON.stringify(resp, null, 2))}</div>`;
}

function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
</script>
</body>
</html>
"""

# ─────────────────────────────────────────────
# Flask Routes
# ─────────────────────────────────────────────
CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CNY", "SGD", "AED"]


@app.route("/")
def index():
    return render_template_string(HTML, service_url=OCR_SERVICE_URL, currencies=CURRENCIES)


@app.route("/proxy/extract", methods=["POST"])
def proxy_extract():
    """
    Optional server-side proxy — useful if the OCR service is on a private network
    not reachable directly from the browser. The browser calls this endpoint instead
    of the OCR service directly.

    To use this, change the JS fetch URL from `SERVICE + '/ocr/extract'`
    to `'/proxy/extract'`.
    """
    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file provided"}), 400

    file = request.files["file"]
    org_currency = request.form.get("org_currency", "INR")
    include_raw = request.form.get("include_raw_text", "false")

    try:
        resp = requests.post(
            f"{OCR_SERVICE_URL}/ocr/extract",
            files={"file": (file.filename, file.stream, file.content_type)},
            data={"org_currency": org_currency, "include_raw_text": include_raw},
            timeout=60,
        )
        return jsonify(resp.json()), resp.status_code
    except requests.exceptions.ConnectionError:
        return jsonify({"success": False, "error": f"Cannot connect to OCR service at {OCR_SERVICE_URL}"}), 502
    except Exception as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@app.route("/proxy/health")
def proxy_health():
    """Proxy the health check — useful for same-origin checks from the browser."""
    try:
        resp = requests.get(f"{OCR_SERVICE_URL}/health", timeout=5)
        return jsonify(resp.json()), resp.status_code
    except Exception as exc:
        return jsonify({"status": "unreachable", "error": str(exc)}), 502


# ─────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5001))
    print(f"\n🧾  OCR Tester running at  http://localhost:{port}")
    print(f"🔗  Pointing at OCR service: {OCR_SERVICE_URL}\n")
    app.run(debug=True, port=port)