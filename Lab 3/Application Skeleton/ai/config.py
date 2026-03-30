LTA_URL = "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2"
LTA_HEADERS = {
    "AccountKey": "FcSje8ULSDiA1wQICihU2Q==",  # hardcoded now since requesting for datamall API takes time
    "accept": "application/json",
}

POLL_INTERVAL_SECS = 60
FORECAST_HORIZONS = [15, 30, 45, 60]
MAX_HISTORY_POINTS = 120