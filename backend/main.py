from fastapi import FastAPI, HTTPException, Depends, status, Security
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
import uvicorn
from backend.auth import get_current_user, call_supabase_edge_function

app = FastAPI(title="Carbon Footprint & Sub-Application API", version="1.0.0")

class SubAppPurchase(BaseModel):
    pid: str
    pin: str

class PinVerification(BaseModel):
    pid: str
    pin: str

class CarbonLogCreate(BaseModel):
    category: str
    value: float
    details: Dict[str, Any] = {}

# In-memory mock database for active sessions / metadata
carbon_logs_db = []

@app.post("/api/v1/subapps/purchase")
async def purchase_subapp(purchase: SubAppPurchase, user: dict = Depends(get_current_user)):
    # Simulates recording a purchase inside Supabase DB
    user_id = user.get("id")
    return {
        "message": f"Successfully purchased sub-application {purchase.pid} for user {user_id}."
    }

@app.post("/api/v1/subapps/verify")
async def verify_subapp(verification: PinVerification, token_data: Any = Depends(get_current_user)):
    # Delegates verification to the Supabase Edge Function
    user_id = token_data.get("id")
    # For simulation, we verify mock credentials or invoke Edge Function wrapper
    return {
        "status": "authorized",
        "user_id": user_id,
        "pid": verification.pid,
        "sub_app_token": f"session_token_for_{verification.pid}"
    }

@app.post("/api/v1/carbon/logs")
async def add_carbon_log(log: CarbonLogCreate, user: dict = Depends(get_current_user)):
    user_id = user.get("id")
    new_log = {
        "user_id": user_id,
        "category": log.category,
        "value": log.value,
        "details": log.details
    }
    carbon_logs_db.append(new_log)
    return {"message": "Carbon log added successfully", "log": new_log}

@app.get("/api/v1/carbon/logs")
async def get_carbon_logs(user: dict = Depends(get_current_user)):
    user_id = user.get("id")
    user_logs = [log for log in carbon_logs_db if log["user_id"] == user_id]
    return user_logs

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

