from fastapi import FastAPI, HTTPException
from fastapi import Body
from threading import Thread
from datetime import datetime, timezone

from store import CarparkStore
from ingestion import ingestion_loop
from predict import predict_for_all, predict_for_carpark
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

store = CarparkStore()

Thread(target=ingestion_loop, args=(store,), daemon=True).start()

app = FastAPI(
    title="Carpark Prediction API",
    version="1.0.0",
    description="Predicts available lots for carparks in Singapore for +15, +30, +45, +60 minutes and provides an LLM-backed explain endpoint."
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



class BusLegIn(BaseModel):
    type: Optional[str] = None
    service: Optional[str] = None
    durationSeconds: Optional[float] = None
    fromStopCode: Optional[str] = None
    toStopCode: Optional[str] = None


class BusItineraryIn(BaseModel):
    id: Optional[str] = None
    etaSeconds: Optional[float] = None
    price: Optional[float] = None
    transfers: Optional[int] = None
    walkSeconds: Optional[float] = None
    legs: Optional[List[BusLegIn]] = None


class TaxiContextIn(BaseModel):
    etaSeconds: Optional[float] = None
    price: Optional[float] = None
    taxisNearby: Optional[int] = None
    peakHour: Optional[bool] = None


class CarContextIn(BaseModel):
    driveEtaSeconds: Optional[float] = None
    price: Optional[float] = None
    predictedLots: Optional[int] = None
    walkSeconds: Optional[float] = None


class ContextExplainBody(BaseModel):
    destinationName: Optional[str] = None
    distances: Optional[Dict[str, float]] = None
    bus: Optional[List[BusItineraryIn]] = None
    taxi: Optional[TaxiContextIn] = None
    car: Optional[CarContextIn] = None
    incidentsCount: Optional[int] = None
    roadworksCount: Optional[int] = None


class SingleModeExplainBody(BaseModel):
    mode: str
    context: Optional[Dict[str, Any]] = None


@app.post("/explain")
def explain(payload: SingleModeExplainBody = Body(...)):
    """Return a single-mode narrative explanation.

    Request body example:
      { "mode": "bus", "context": { ... } }

    Response shape:
      { "response": "short explanation string" }
    """
    try:
        from llm import explain_mode  # type: ignore
    except Exception:
        raise HTTPException(status_code=503, detail={"error": "llm_unavailable", "message": "LLM module not importable"})

    mode = (payload.mode or "").lower()
    ctx = payload.context or {}
    try:
        resp = explain_mode(mode, ctx)
    except Exception as e:
        raise HTTPException(status_code=503, detail={"error": "llm_failed", "message": str(e)})

    return {"response": resp}
