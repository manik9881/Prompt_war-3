from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import List, Dict, Any
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Carbon Footprint Tracking API", version="1.0.0")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CarbonLogCreate(BaseModel):
    category: str
    value: float
    details: Dict[str, Any] = {}

class CarbonLog(BaseModel):
    category: str
    value: float
    details: Dict[str, Any] = {}
    date: str

# In-memory mock database for carbon logs
carbon_logs_db = [
    {"category": "Transportation", "value": 12.4, "details": {"type": "car"}, "date": "2026-06-08"},
    {"category": "Energy", "value": 8.2, "details": {"source": "electricity"}, "date": "2026-06-07"},
]

@app.post("/api/v1/carbon/logs", response_model=Dict[str, Any])
async def add_carbon_log(log: CarbonLogCreate):
    from datetime import datetime
    new_log = {
        "category": log.category,
        "value": log.value,
        "details": log.details,
        "date": datetime.now().strftime("%Y-%m-%d")
    }
    carbon_logs_db.insert(0, new_log)
    return {"message": "Carbon log added successfully", "log": new_log}

@app.get("/api/v1/carbon/logs", response_model=List[Dict[str, Any]])
async def get_carbon_logs():
    return carbon_logs_db

@app.get("/api/v1/carbon/insights", response_model=Dict[str, Any])
async def get_carbon_insights():
    # Dynamic insight generation based on log statistics
    total = sum(log["value"] for log in carbon_logs_db)
    
    categories = {}
    for log in carbon_logs_db:
        cat = log["category"]
        categories[cat] = categories.get(cat, 0.0) + log["value"]

    insights = []
    
    # 1. Transportation insight
    transit_val = categories.get("Transportation", 0.0)
    if transit_val > 10.0:
        insights.append({
            "type": "transit",
            "title": "Transit Suggestion",
            "severity": "info",
            "content": f"Transportation accounts for {transit_val:.1f} kg CO2e. Switching 15km of driving to public transit would save around 4.2kg CO2e.",
            "value": 4.2
        })
    else:
        insights.append({
            "type": "transit",
            "title": "Transit Info",
            "severity": "success",
            "content": "Your transportation footprint is low! Consider walking or cycling to maintain this excellent baseline.",
            "value": 0.0
        })

    # 2. Energy insight
    energy_val = categories.get("Energy", 0.0)
    if energy_val > 5.0:
        insights.append({
            "type": "energy",
            "title": "Energy Efficiency",
            "severity": "warning",
            "content": f"Energy usage has reached {energy_val:.1f} kg CO2e. Enabling power-saver cycles can reduce total usage by up to 8% today.",
            "value": 1.5
        })
    else:
        insights.append({
            "type": "energy",
            "title": "Energy Info",
            "severity": "success",
            "content": "Excellent energy management. Turn off unused electronics to save even more power.",
            "value": 0.0
        })

    # 3. Dietary target
    food_val = categories.get("Food", 0.0)
    if food_val > 3.0:
        insights.append({
            "type": "food",
            "title": "Dietary Action",
            "severity": "info",
            "content": "Opting for 2 meat-free days weekly will lower your dietary emissions trace by approximately 18% monthly.",
            "value": 2.1
        })
    else:
        insights.append({
            "type": "food",
            "title": "Dietary Info",
            "severity": "success",
            "content": "Keep up the eco-friendly food habits! Buying local organic produce further minimizes footprint.",
            "value": 0.0
        })

    return {
        "insights": insights,
        "total_emissions": total
    }

from fastapi.staticfiles import StaticFiles
import os

# Serve frontend static files if they exist
frontend_dist_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist_path):
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="frontend")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
