from fastapi import APIRouter
from pydantic import BaseModel
import random

router = APIRouter(prefix="/api/v1/fan", tags=["fan"])

class FanPredictRequest(BaseModel):
    driver: str
    action: str
    predict_laps: int

@router.get("/status")
async def fan_status():
    """Returns basic session status for unauthenticated fan views."""
    return {"mode": "fan", "active_session": True}

@router.post("/predict")
async def fan_predict(request: FanPredictRequest):
    """Provides a public, mocked simulation prediction for Fan Mode."""
    actions = {
        "PIT": f"If {request.driver} pits now, they will lose approximately 21 seconds but emerge with fresh rubber, allowing them to push for the next {request.predict_laps} laps. They will likely re-enter the track in P{random.randint(1, 10)}.",
        "STAY_OUT": f"If {request.driver} stays out, they maintain track position but their tyre degradation will become critical within {max(1, request.predict_laps - 2)} laps, making them highly vulnerable to undercuts."
    }
    narrative = actions.get(request.action, f"Prediction for {request.driver}: {request.action} over {request.predict_laps} laps.")
    return {"narrative": narrative}
