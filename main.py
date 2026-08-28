import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import (
    init_db,
    get_all_activities,
    add_activity,
    delete_activity,
    get_goals,
    update_goals,
    add_water_log,
    get_daily_summary,
    get_weekly_summary
)
from backend.models import ActivityCreate, GoalsUpdate, WaterLogCreate

app = FastAPI(
    title="Fitness Tracker API",
    description="Backend REST API for logging daily fitness activities, steps, calories, water, and tracking weekly progress.",
    version="1.0.0"
)

# Enable CORS for frontend flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()

# --- API Endpoints ---

@app.get("/api/activities", summary="Get all activities")
def read_activities(date: str = Query(None, description="Filter by date (YYYY-MM-DD)")):
    return get_all_activities(date_str=date)

@app.post("/api/activities", status_code=210, summary="Log new activity")
def create_activity(activity: ActivityCreate):
    new_act = add_activity(activity.dict())
    return new_act

@app.delete("/api/activities/{activity_id}", summary="Delete an activity")
def remove_activity(activity_id: int):
    success = delete_activity(activity_id)
    if not success:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": f"Activity {activity_id} deleted successfully"}

@app.get("/api/goals", summary="Get daily targets")
def read_goals():
    return get_goals()

@app.put("/api/goals", summary="Update daily targets")
def edit_goals(goals: GoalsUpdate):
    return update_goals(goals.dict())

@app.post("/api/water", summary="Log water intake")
def log_water(water: WaterLogCreate):
    new_total = add_water_log(water.amount_ml, water.date)
    return {"total_water_ml": new_total, "added_ml": water.amount_ml, "date": water.date}

@app.get("/api/summary/daily", summary="Get daily stats summary")
def read_daily_summary(date: str = Query(None, description="Date YYYY-MM-DD (defaults to today)")):
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")
    return get_daily_summary(date)

@app.get("/api/summary/weekly", summary="Get weekly trend stats")
def read_weekly_summary():
    return get_weekly_summary()

# --- Static Frontend Serving ---
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

    @app.get("/")
    def serve_frontend_root():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    @app.get("/{full_path:path}")
    def serve_frontend_files(full_path: str):
        target_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.exists(target_path) and os.path.isfile(target_path):
            return FileResponse(target_path)
        # Fallback to index.html
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
