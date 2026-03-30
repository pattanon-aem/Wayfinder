# Carpark Availability & AI Explanation API

A FastAPI-based REST service that predicts **Singapore carpark availability** and generates short **AI-powered transport explanations** using a Hugging Face–hosted Qwen model.

---

## Overview

- Fetches **live carpark data** from the LTA DataMall API every minute
- Maintains a **2-hour rolling cache** in memory
- Uses **Holt’s Exponential Smoothing** and optional ML model for prediction
- Offers simple REST endpoints for JSON responses
- Includes `/explain` endpoint backed by **Qwen** via Hugging Face

---

## Structure

```
.
Other/ai/server/
├── main.py                  # FastAPI entry point (carpark predictions + /explain endpoint)
├── llm.py                   # LLM helper (Hugging Face Qwen via Inference/Router fallbacks)
├── ingestion.py             # Background ingestion loop to keep carpark store updated
├── forecast.py              # Forecasting logic (e.g., horizons +15/+30/+45/+60)
├── predict.py               # Prediction utilities used by API handlers
├── store.py                 # In-memory store for carpark snapshots and time series
├── ml_model.py              # Model utilities (load/apply models, helpers)
├── config.py                # Service configuration/env handling (tokens, model ids)
├── requirements.txt         # Python dependencies for the server
├── data/                    # Static/reference data
└── models/                  # Pre-trained model artifacts (per forecast horizon)
```

---

## 🧰 Setup

1. **Create environment**

   ```bash
   cd /Other/ai/server
   python -m venv venv
   source venv/bin/activate       # macOS/Linux
   venv\Scripts\activate        # Windows
   pip install -r requirements.txt
   ```

2. **Set environment variables**

   ```bash
   LTA_ACCOUNT_KEY="your_lta_key_here"
   HUGGINGFACEHUB_API_TOKEN="your_hf_token_here"
   QWEN_MODEL="Qwen/Qwen2.5-7B-Instruct"
   ```

3. **Run**
   ```bash
   uvicorn main:app --reload --port 8080
   ```

---

## 🚀 API Endpoints

### 🔹 All Carpark Predictions

**GET `/carparks/predictions`**

```json
{
  "timestampGenerated": "2025-10-28T14:30:00Z",
  "carparks": [
    { "carparkId": "A12", "availableLots": [85, 80, 75, 70] },
    { "carparkId": "B15", "availableLots": [300, 285, 270, 260] }
  ]
}
```

---

### 🔹 Specific Carpark Prediction

**GET `/carparks/{carparkId}/prediction`**

```json
{
  "timestampGenerated": "2025-10-28T14:30:00Z",
  "carparkId": "HE12",
  "availableLots": [90, 85, 82, 80]
}
```

---

### 🔹 LLM Explanation

**POST `/explain`**

```json
{
  "mode": "bus",
  "context": {
    "busServices": [123, 45],
    "etaMinutes": [4, 7],
    "incident": "AYE near Exit 3"
  }
}
```

Response:

```json
{
  "response": "Bus 123 arrives in 4 minutes and is the fastest option. Avoid AYE near Exit 3 due to a minor incident."
}
```

---

## 💡 Notes

- Predictions update **every 60s** using latest LTA data.
- Cached history per carpark = **120 points (~2 hours)**.
- For HDB carparks (model-trained IDs), the system will later use the **ML model**; otherwise, it falls back to Holt trend forecasting.
- `/explain` requires a valid Hugging Face token and model access.
