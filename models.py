from pydantic import BaseModel, Field
from typing import Optional, List

class ActivityCreate(BaseModel):
    activity_type: str = Field(..., example="Running")
    duration_minutes: int = Field(0, ge=0, example=30)
    calories: int = Field(0, ge=0, example=250)
    steps: int = Field(0, ge=0, example=3500)
    distance_km: float = Field(0.0, ge=0.0, example=3.5)
    date: str = Field(..., example="2026-08-28")
    time: Optional[str] = Field("12:00", example="08:30")
    notes: Optional[str] = Field("", example="Morning run in the park")

class ActivityResponse(ActivityCreate):
    id: int
    created_at: str

class GoalsUpdate(BaseModel):
    step_goal: int = Field(10000, ge=1000)
    calorie_goal: int = Field(600, ge=100)
    active_minutes_goal: int = Field(45, ge=10)
    water_goal_ml: int = Field(2500, ge=500)

class GoalsResponse(GoalsUpdate):
    id: int = 1

class WaterLogCreate(BaseModel):
    amount_ml: int = Field(250, ge=50)
    date: str = Field(..., example="2026-08-28")
