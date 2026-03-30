import os
from typing import Optional, List, Dict, Any
from datetime import datetime, date

import numpy as np
import pandas as pd
import joblib

from forecast import CarparkHistory
from config import POLL_INTERVAL_SECS, FEATURE_COLS, MODEL_15_PATH, MODEL_30_PATH, MODEL_45_PATH, MODEL_60_PATH, HDB_CAPACITY_PATH, HOLIDAYS_PATH


class MLForecaster:
    """
    Hybrid ML forecaster:

    - Only used for carparks that appear in hdb_carparks.csv.
    - Uses four separate models (15, 30, 45, 60 minutes).
    - Feature set: available_lots, lag_1/2/3, delta_1/2,
      hour, dow, is_weekend, is_public_holiday, is_holiday_eve, total_lots.

    If anything is missing (no model, not HDB, not enough history...),
    this returns None so the caller can fall back to Holt.
    """

    def __init__(self):
        self.model_15 = self._load_model(MODEL_15_PATH, "15")
        self.model_30 = self._load_model(MODEL_30_PATH, "30")
        self.model_45 = self._load_model(MODEL_45_PATH, "45")
        self.model_60 = self._load_model(MODEL_60_PATH, "60")

        self.hdb_total_lots: Dict[str, int] = self._load_hdb_capacities()
        self.holiday_flags: Dict[str, Dict[str, int]] = self._load_holiday_flags()

    def _load_model(self, path: str, label: str):
        if not os.path.exists(path):
            print(f"[MLForecaster] model_{label} not found at {path}.")
            return None
        try:
            m = joblib.load(path)
            print(f"[MLForecaster] Loaded model_{label} from {path}")
            return m
        except Exception as e:
            print(f"[MLForecaster] Error loading model_{label}:", e)
            return None

    def _load_hdb_capacities(self) -> Dict[str, int]:
        if not os.path.exists(HDB_CAPACITY_PATH):
            print(f"[MLForecaster] HDB capacity file not found at {HDB_CAPACITY_PATH}.")
            return {}
        try:
            df = pd.read_csv(HDB_CAPACITY_PATH)
            df["carpark_id"] = df["carpark_id"].astype(str)
            df["total_lots"] = df["total_lots"].fillna(0).astype(int)
            d = dict(zip(df["carpark_id"], df["total_lots"]))
            print(f"[MLForecaster] Loaded {len(d)} HDB capacities from {HDB_CAPACITY_PATH}")
            return d
        except Exception as e:
            print("[MLForecaster] Error loading HDB capacity file:", e)
            return {}

    def _load_holiday_flags(self) -> Dict[str, Dict[str, int]]:
        if not os.path.exists(HOLIDAYS_PATH):
            print(f"[MLForecaster] Holidays file not found at {HOLIDAYS_PATH}.")
            return {}
        try:
            df = pd.read_csv(HOLIDAYS_PATH)
            df["date"] = df["date"].astype(str)
            df["is_public_holiday"] = df["is_public_holiday"].fillna(0).astype(int)
            df["is_holiday_eve"] = df["is_holiday_eve"].fillna(0).astype(int)

            flags: Dict[str, Dict[str, int]] = {}
            for _, row in df.iterrows():
                d = row["date"]
                flags[d] = {
                    "is_public_holiday": int(row["is_public_holiday"]),
                    "is_holiday_eve": int(row["is_holiday_eve"]),
                }

            print(f"[MLForecaster] Loaded holiday flags for {len(flags)} dates from {HOLIDAYS_PATH}")
            return flags
        except Exception as e:
            print("[MLForecaster] Error loading holidays file:", e)
            return {}
        
    def can_use_ml(self) -> bool:
        return (
            self.model_15 is not None
            and len(self.hdb_total_lots) > 0
        )

    def is_hdb_carpark(self, carpark_id: str) -> bool:
        return carpark_id in self.hdb_total_lots


    def _parse_timestamp(self, ts_str: Optional[str]) -> datetime:
        """
        Parse hist.last_updated_sgt like '2025-10-27T09:20:00+08:00'.
        Fallback to now UTC if parsing fails.
        """
        if not ts_str:
            return datetime.utcnow()
        try:
            return datetime.fromisoformat(ts_str)
        except Exception:
            try:
                return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            except Exception:
                return datetime.utcnow()

    def _get_holiday_flags(self, dt: datetime) -> Dict[str, int]:
        d_str = dt.date().isoformat()
        flags = self.holiday_flags.get(d_str, None)
        if flags is None:
            return {"is_public_holiday": 0, "is_holiday_eve": 0}
        return {
            "is_public_holiday": int(flags.get("is_public_holiday", 0)),
            "is_holiday_eve": int(flags.get("is_holiday_eve", 0)),
        }

    def _compute_lags(self, hist_values: List[int]) -> Dict[str, float]:
        """
        Compute available_lots, lag_1/2/3, delta_1/2 from 1-min history,
        approximating 15-min steps.
        """
        n = len(hist_values)
        if n == 0:
            return {
                "available_lots": 0.0,
                "lag_1": 0.0,
                "lag_2": 0.0,
                "lag_3": 0.0,
                "delta_1": 0.0,
                "delta_2": 0.0,
            }

        current_val = float(hist_values[-1])

        #1 sample/min, step = 15 min
        obs_per_step = max(1, int(round(15 * 60.0 / POLL_INTERVAL_SECS)))

        def get_step_lag(step_idx: int) -> float:
            idx = n - 1 - step_idx * obs_per_step
            if idx < 0:
                idx = 0
            return float(hist_values[idx])

        lag_1 = get_step_lag(1)
        lag_2 = get_step_lag(2)
        lag_3 = get_step_lag(3)

        delta_1 = current_val - lag_1
        delta_2 = lag_1 - lag_2

        return {
            "available_lots": current_val,
            "lag_1": lag_1,
            "lag_2": lag_2,
            "lag_3": lag_3,
            "delta_1": delta_1,
            "delta_2": delta_2,
        }

    def _build_feature_row(self, carpark_id: str, hist: CarparkHistory) -> Optional[pd.DataFrame]:
        if not hist.history:
            return None

        dt = self._parse_timestamp(hist.last_updated_sgt)
        hour = dt.hour
        dow = dt.weekday()
        is_weekend = int(dow in (5, 6))

        holiday = self._get_holiday_flags(dt)
        is_public_holiday = holiday["is_public_holiday"]
        is_holiday_eve = holiday["is_holiday_eve"]

        lag_dict = self._compute_lags(hist.history)

        total_lots = int(self.hdb_total_lots.get(carpark_id, 0))

        feat: Dict[str, Any] = {
            "available_lots": lag_dict["available_lots"],
            "lag_1": lag_dict["lag_1"],
            "lag_2": lag_dict["lag_2"],
            "lag_3": lag_dict["lag_3"],
            "delta_1": lag_dict["delta_1"],
            "delta_2": lag_dict["delta_2"],
            "hour": hour,
            "dow": dow,
            "is_weekend": is_weekend,
            "is_public_holiday": is_public_holiday,
            "is_holiday_eve": is_holiday_eve,
            "total_lots": total_lots,
        }

        row = {col: feat.get(col, 0) for col in FEATURE_COLS}
        X = pd.DataFrame([row], columns=FEATURE_COLS)
        return X

    def predict_for_carpark(
        self,
        carpark_id: str,
        hist: CarparkHistory,
    ) -> Optional[List[int]]:
        """
        Returns [y15, y30, y45, y60] as ints
        or None if ML should not be used.
        """
        if not self.can_use_ml():
            return None
        if not self.is_hdb_carpark(carpark_id):
            return None
        if not hist.history:
            return None

        X = self._build_feature_row(carpark_id, hist)
        if X is None:
            return None

        preds: List[int] = []

        def safe_predict(model, label: str) -> Optional[int]:
            if model is None:
                return None
            try:
                y = model.predict(X)
                return max(0, int(round(float(y[0]))))
            except Exception as e:
                print(f"[MLForecaster] Error in model_{label} for {carpark_id}:", e)
                return None

        p15 = safe_predict(self.model_15, "15")
        p30 = safe_predict(self.model_30, "30")
        p45 = safe_predict(self.model_45, "45")
        p60 = safe_predict(self.model_60, "60")

        if any(p is None for p in [p15, p30, p45, p60]):
            return None

        return [p15, p30, p45, p60]
