from datetime import datetime, timezone
from typing import Optional, Dict, Any
from config import FORECAST_HORIZONS
from store import CarparkStore

def predict_for_carpark(store: CarparkStore, carpark_id: str) -> Optional[Dict[str, Any]]:
    hist = store.get_history_snapshot(carpark_id)
    if hist is None:
        return None
    preds = hist.forecast_future(FORECAST_HORIZONS)
    return {
        "timestampGenerated": datetime.now(timezone.utc).isoformat(),
        "carparkId": carpark_id,
        "availableLots": preds
    }

def predict_for_all(store: CarparkStore) -> Dict[str, Any]:
    all_ids = store.list_all_ids_snapshot()
    now_iso = datetime.now(timezone.utc).isoformat()
    carparks = []
    for cp_id in all_ids:
        hist = store.get_history_snapshot(cp_id)
        if hist is None:
            continue
        preds = hist.forecast_future(FORECAST_HORIZONS)
        carparks.append({
            "carparkId": cp_id,
            "availableLots": preds
        })
    return {
        "timestampGenerated": now_iso,
        "carparks": carparks
    }
