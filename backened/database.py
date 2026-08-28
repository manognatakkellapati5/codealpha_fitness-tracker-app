import sqlite3
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "fitness_tracker.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create activities table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            activity_type TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 0,
            calories INTEGER NOT NULL DEFAULT 0,
            steps INTEGER NOT NULL DEFAULT 0,
            distance_km REAL NOT NULL DEFAULT 0.0,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create goals table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY DEFAULT 1,
            step_goal INTEGER NOT NULL DEFAULT 10000,
            calorie_goal INTEGER NOT NULL DEFAULT 600,
            active_minutes_goal INTEGER NOT NULL DEFAULT 45,
            water_goal_ml INTEGER NOT NULL DEFAULT 2500
        )
    """)

    # Create water logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS water_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount_ml INTEGER NOT NULL,
            date TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Seed default goals if empty
    cursor.execute("SELECT COUNT(*) FROM goals")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO goals (id, step_goal, calorie_goal, active_minutes_goal, water_goal_ml)
            VALUES (1, 10000, 600, 45, 2500)
        """)

    # Seed sample activities if empty
    cursor.execute("SELECT COUNT(*) FROM activities")
    if cursor.fetchone()[0] == 0:
        seed_sample_data(cursor)

    conn.commit()
    conn.close()

def seed_sample_data(cursor):
    today = datetime.now()
    sample_activities = [
        ("Morning Run", 35, 380, 4500, 4.2, (today - timedelta(days=0)).strftime("%Y-%m-%d"), "07:30", "Refreshing morning jog in the park"),
        ("Brisk Walk", 25, 120, 2800, 2.1, (today - timedelta(days=0)).strftime("%Y-%m-%d"), "12:15", "Lunch walk"),
        ("Cycling", 45, 420, 0, 12.5, (today - timedelta(days=1)).strftime("%Y-%m-%d"), "18:00", "Evening outdoor bike ride"),
        ("Evening Walk", 30, 150, 3200, 2.4, (today - timedelta(days=1)).strftime("%Y-%m-%d"), "20:00", "Post-dinner stroll"),
        ("Gym / Weightlifting", 50, 350, 1200, 0.0, (today - timedelta(days=2)).strftime("%Y-%m-%d"), "17:30", "Upper body strength workout"),
        ("Morning Jog", 40, 410, 5200, 4.8, (today - timedelta(days=3)).strftime("%Y-%m-%d"), "07:00", "Paced run around neighborhood"),
        ("Yoga Session", 45, 160, 500, 0.0, (today - timedelta(days=4)).strftime("%Y-%m-%d"), "08:00", "Flexibility and core mindfulness"),
        ("HIIT Training", 30, 340, 1800, 0.0, (today - timedelta(days=5)).strftime("%Y-%m-%d"), "18:30", "High intensity interval workout"),
        ("Long Walk", 60, 280, 7100, 5.5, (today - timedelta(days=6)).strftime("%Y-%m-%d"), "10:00", "Weekend nature trail walk")
    ]
    cursor.executemany("""
        INSERT INTO activities (activity_type, duration_minutes, calories, steps, distance_km, date, time, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, sample_activities)

    # Seed sample water logs for today
    today_str = today.strftime("%Y-%m-%d")
    sample_water = [(250, today_str), (500, today_str), (250, today_str), (500, today_str)]
    cursor.executemany("""
        INSERT INTO water_logs (amount_ml, date) VALUES (?, ?)
    """, sample_water)

# --- CRUD Operations for Activities ---

def get_all_activities(date_str: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if date_str:
        cursor.execute("SELECT * FROM activities WHERE date = ? ORDER BY date DESC, time DESC", (date_str,))
    else:
        cursor.execute("SELECT * FROM activities ORDER BY date DESC, time DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def add_activity(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO activities (activity_type, duration_minutes, calories, steps, distance_km, date, time, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data['activity_type'],
        data.get('duration_minutes', 0),
        data.get('calories', 0),
        data.get('steps', 0),
        data.get('distance_km', 0.0),
        data['date'],
        data.get('time', '12:00'),
        data.get('notes', '')
    ))
    activity_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM activities WHERE id = ?", (activity_id,))
    new_row = dict(cursor.fetchone())
    conn.close()
    return new_row

def delete_activity(activity_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM activities WHERE id = ?", (activity_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# --- Goals Operations ---

def get_goals() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM goals WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return {"step_goal": 10000, "calorie_goal": 600, "active_minutes_goal": 45, "water_goal_ml": 2500}

def update_goals(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE goals
        SET step_goal = ?, calorie_goal = ?, active_minutes_goal = ?, water_goal_ml = ?
        WHERE id = 1
    """, (
        data.get('step_goal', 10000),
        data.get('calorie_goal', 600),
        data.get('active_minutes_goal', 45),
        data.get('water_goal_ml', 2500)
    ))
    conn.commit()
    conn.close()
    return get_goals()

# --- Water Logging Operations ---

def get_today_water(date_str: str) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT SUM(amount_ml) FROM water_logs WHERE date = ?", (date_str,))
    result = cursor.fetchone()[0]
    conn.close()
    return result if result else 0

def add_water_log(amount_ml: int, date_str: str) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO water_logs (amount_ml, date) VALUES (?, ?)", (amount_ml, date_str))
    conn.commit()
    conn.close()
    return get_today_water(date_str)

# --- Summary & Analytics ---

def get_daily_summary(date_str: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            COALESCE(SUM(steps), 0) as total_steps,
            COALESCE(SUM(calories), 0) as total_calories,
            COALESCE(SUM(duration_minutes), 0) as total_active_minutes,
            COALESCE(SUM(distance_km), 0.0) as total_distance_km,
            COUNT(*) as total_workouts
        FROM activities
        WHERE date = ?
    """, (date_str,))
    summary = dict(cursor.fetchone())
    conn.close()

    goals = get_goals()
    water = get_today_water(date_str)

    summary['water_intake_ml'] = water
    summary['goals'] = goals
    return summary

def get_weekly_summary() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    today = datetime.now().date()
    start_date = today - timedelta(days=6)

    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]

    cursor.execute("""
        SELECT date, 
               COALESCE(SUM(steps), 0) as steps,
               COALESCE(SUM(calories), 0) as calories,
               COALESCE(SUM(duration_minutes), 0) as minutes
        FROM activities
        WHERE date >= ?
        GROUP BY date
    """, (start_date.strftime("%Y-%m-%d"),))

    db_results = {row['date']: dict(row) for row in cursor.fetchall()}

    daily_trends = []
    for d in dates:
        dt_obj = datetime.strptime(d, "%Y-%m-%d")
        day_label = dt_obj.strftime("%a") # e.g. Mon, Tue
        if d in db_results:
            daily_trends.append({
                "date": d,
                "day": day_label,
                "steps": db_results[d]['steps'],
                "calories": db_results[d]['calories'],
                "minutes": db_results[d]['minutes']
            })
        else:
            daily_trends.append({
                "date": d,
                "day": day_label,
                "steps": 0,
                "calories": 0,
                "minutes": 0
            })

    # Activity types breakdown
    cursor.execute("""
        SELECT activity_type, COUNT(*) as count, SUM(calories) as calories, SUM(duration_minutes) as minutes
        FROM activities
        GROUP BY activity_type
    """)
    type_breakdown = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return {
        "weekly_trends": daily_trends,
        "type_breakdown": type_breakdown
    }
