# AI Server
## Folder Structure Overview

```
carpark_api/
├── app.py             # FastAPI routes and API definitions
├── config.py          # Configuration constants (LTA API, intervals, etc.)
├── forecasting.py     # Time series model and carpark-level forecasting logic
├── store.py           # In-memory data store
├── ingestion.py       # LTA data polling + snapshot updater
├── predict.py         # Helper functions for producing API responses
└── requirements.txt   # Python dependencies
```

## AI server Installation & Setup

1. **Clone the repo**

2. **Create and activate a virtual environment**

   ```bash
   python -m venv venv
   source venv/bin/activate       # for macOS / Linux
   venv\Scripts\activate        # for Windows
   ```

3. **Install dependencies**

   ```bash
   cd ai/server
   pip install -r requirements.txt
   ```

4. **Run the API**

   ```bash
   uvicorn main:app --reload --port 8080
   ```

   You should see:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8080
   INFO:     Started reloader process
   ```

---

## API Usage

### 1. **Get Predictions for All Carparks**
```bash
GET http://localhost:8080/carparks/predictions
```
Response:
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

### 2. **Get Prediction for a Specific Carpark**
```bash
GET http://localhost:8080/carparks/A10/prediction
```
Response:
```json
{
  "timestampGenerated": "2025-10-28T14:30:00Z",
  "carparkId": "A10",
  "availableLots": [15, 14, 14, 13]
}
```
