import time
import requests
import pandas as pd
from config import LTA_URL, LTA_HEADERS, POLL_INTERVAL_SECS
from store import CarparkStore

def fetch_lta_snapshot() -> pd.DataFrame:
    resp = requests.get(LTA_URL, headers=LTA_HEADERS, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    records = []
    for rec in data.get("value", []):
        if rec.get("LotType") != "C":
            continue
        cp_id = rec.get("CarParkID")
        lots_avail = rec.get("AvailableLots")
        update_ts = rec.get("UpdateDatetime")
        if cp_id is None or lots_avail is None:
            continue
        records.append({
            "carparkId": cp_id,
            "lotsAvailable": int(lots_avail),
            "updateTime": update_ts,
        })

    return pd.DataFrame(records)

def ingestion_loop(store: CarparkStore):
    while True:
        try:
            df_snapshot = fetch_lta_snapshot()
            if not df_snapshot.empty:
                store.update_from_lta_snapshot(df_snapshot)
        except Exception as e:
            print("[ingestion_loop] error:", e)
        time.sleep(POLL_INTERVAL_SECS)
