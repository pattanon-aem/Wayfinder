from fastapi import FastAPI, HTTPException
from threading import Thread
from datetime import datetime, timezone

from store import CarparkStore
from ingestion import ingestion_loop
from predict import predict_for_all, predict_for_carpark

# create global store (was carpark_store in your code)
store = CarparkStore()

# start background ingestion thread immediately
Thread(target=ingestion_loop, args=(store,), daemon=True).start()

app = FastAPI(
    title="Carpark Prediction API",
    version="1.0.0",
    description="Predicts available lots for carparks in Singapore for +15, +30, +45, +60 minutes."
)

@app.get("/carparks/predictions")
def get_all_predictions():
    result = predict_for_all(store)
    if len(result["carparks"]) == 0:
        raise HTTPException(
            status_code=503,
            detail={"error": "not_ready", "message": "No carpark data ingested yet"}
        )
    return result

@app.get("/carparks/{carparkId}/prediction")
def get_single_prediction(carparkId: str):
    result = predict_for_carpark(store, carparkId)
    if result is None:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "carpark_not_found",
                "message": f"No data found for carparkId={carparkId}"
            },
        )
    return result

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "Carpark Prediction API",
        "carparksTracked": len(store.list_all_ids_snapshot())
    }
