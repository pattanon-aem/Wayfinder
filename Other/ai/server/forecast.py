from typing import Optional, List
from datetime import datetime, timezone
from config import FORECAST_HORIZONS, MAX_HISTORY_POINTS

class HoltState:
    def __init__(self, alpha: float = 0.3, beta: float = 0.1):
        self.alpha = alpha
        self.beta = beta
        self.level: Optional[float] = None
        self.trend: Optional[float] = None

    def update(self, y: float):
        if self.level is None or self.trend is None:
            self.level = y
            self.trend = 0.0
            return
        prev_level = self.level
        prev_trend = self.trend
        new_level = self.alpha * y + (1 - self.alpha) * (prev_level + prev_trend)
        new_trend = self.beta * (new_level - prev_level) + (1 - self.beta) * prev_trend
        self.level, self.trend = new_level, new_trend

    def forecast_h(self, h: int) -> Optional[float]:
        if self.level is None or self.trend is None:
            return None
        return self.level + h * self.trend


class CarparkHistory:
    def __init__(self, carpark_id: str):
        self.carpark_id = carpark_id
        self.history: List[int] = []
        self.holt = HoltState(alpha=0.3, beta=0.1)
        self.last_updated_sgt: Optional[str] = None

    def add_observation(self, available_lots: int, observed_ts_sgt: str):
        from config import MAX_HISTORY_POINTS  # avoid circular import at module load
        self.history.append(available_lots)
        if len(self.history) > MAX_HISTORY_POINTS:
            self.history = self.history[-MAX_HISTORY_POINTS:]
        self.holt.update(float(available_lots))
        self.last_updated_sgt = observed_ts_sgt

    def forecast_future(self, horizons_min: List[int] = None) -> List[int]:
        if horizons_min is None:
            horizons_min = FORECAST_HORIZONS

        preds = []
        for h in horizons_min:
            raw = self.holt.forecast_h(h)
            if raw is None:
                raw = float(self.history[-1]) if self.history else 0.0
            preds.append(max(0, round(raw)))
        return preds
