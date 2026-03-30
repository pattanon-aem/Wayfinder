import threading
import pandas as pd
from typing import Dict, Optional, List
from forecast import CarparkHistory

class CarparkStore:
    def __init__(self):
        self._lock = threading.Lock()
        self._carparks: Dict[str, CarparkHistory] = {}

    def _get_or_create_unlocked(self, carpark_id: str) -> CarparkHistory:
        if carpark_id not in self._carparks:
            self._carparks[carpark_id] = CarparkHistory(carpark_id)
        return self._carparks[carpark_id]

    def update_from_lta_snapshot(self, snapshot_df: pd.DataFrame):
        # Extract updates outside the lock (kept from your optimized version)
        updates = [
            (row["carparkId"], int(row["lotsAvailable"]), row["updateTime"])
            for _, row in snapshot_df.iterrows()
        ]
        # Apply updates quickly under lock
        with self._lock:
            for cp_id, lots_available, update_time in updates:
                hist = self._get_or_create_unlocked(cp_id)
                hist.add_observation(lots_available, update_time)

    def list_all_ids_snapshot(self) -> List[str]:
        with self._lock:
            return list(self._carparks.keys())

    def get_history_snapshot(self, carpark_id: str) -> Optional[CarparkHistory]:
        with self._lock:
            return self._carparks.get(carpark_id)
