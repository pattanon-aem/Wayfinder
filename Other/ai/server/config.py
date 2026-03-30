import os
from dotenv import load_dotenv

load_dotenv(override=False)

LTA_URL = "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2"
LTA_HEADERS = {
    "AccountKey": os.environ.get("LTA_API", ""),
    "accept": "application/json",
}
POLL_INTERVAL_SECS = 60
FORECAST_HORIZONS = [15, 30, 45, 60]
MAX_HISTORY_POINTS = 120

FEATURE_COLS = [
    "available_lots",
    "lag_1", "lag_2", "lag_3",
    "delta_1", "delta_2",
    "hour", "dow", "is_weekend",
    "is_public_holiday", "is_holiday_eve",
    "total_lots",
]
MODEL_15_PATH = os.getenv("MODEL_15_PATH", "models/model_y_15.pkl")
MODEL_30_PATH = os.getenv("MODEL_30_PATH", "models/model_y_30.pkl")
MODEL_45_PATH = os.getenv("MODEL_45_PATH", "models/model_y_45.pkl")
MODEL_60_PATH = os.getenv("MODEL_60_PATH", "models/model_y_60.pkl")
HDB_CAPACITY_PATH = os.getenv("HDB_CAPACITY_PATH", "data/carpark_info_recommend.csv")
HOLIDAYS_PATH = os.getenv("HOLIDAYS_PATH", "data/holidays.csv")