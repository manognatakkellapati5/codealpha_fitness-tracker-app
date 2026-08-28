# 🏋️‍♂️ FitPulse - Personal Fitness Tracker App

A full-stack fitness tracking application designed to help users log, monitor, and visualize daily physical activities, steps, calorie burn, active workout time, and hydration goals.

Built with a responsive, modern HTML/CSS/JS frontend featuring **Chart.js** data visualizations and animated SVG progress rings, backed by a **Python FastAPI** server with **SQLite** persistent storage.

---

## 🌟 Key Features

- **Daily Activity Logging**: Manually record workouts, exercise type (Running, Walking, Cycling, Gym, Yoga, Swimming, HIIT, Sports), duration, calories burned, step counts, distance (km), date/time, and custom notes.
- **Interactive KPI Cards & SVG Progress Rings**: Real-time percentage progress indicators for Steps, Calories burned, Active workout minutes, and Water intake.
- **Visual Trends & Analytics**:
  - **7-Day Trend Chart**: Dual-axis bar and line chart displaying weekly step count and calorie expenditure trends.
  - **Activity Type Breakdown**: Doughnut chart visualizing workout category distribution.
- **Customizable Daily Goals**: Set daily targets for Steps, Calories, Active Minutes, and Water intake with real-time feedback.
- **Quick Action Logging**: One-click logging for instant steps, walk/run presets, and water hydration (+250ml / +500ml).
- **Activity History & Filtering**: Filter logged activities by type or search through notes with real-time keyword matching. Delete unwanted logs with full database sync.
- **Dual Storage Architecture**: Automatic SQLite database persistence via Python FastAPI REST API with seamless client-side `localStorage` fallback.
- **Dark & Light Themes**: Built-in toggle for high-contrast glassmorphism dark theme or clean light theme with state persistence.

---

## 📁 Project Structure

```
fitness_tracker_app/
│
├── backend/
│   ├── __init__.py
│   ├── database.py       # SQLite database connection, tables, CRUD helpers & seed data
│   ├── main.py           # FastAPI application entry point, REST endpoints & static server
│   ├── models.py         # Pydantic schemas for activities, goals, and water records
│   └── requirements.txt  # Python backend dependencies (fastapi, uvicorn, pydantic)
│
├── frontend/
│   ├── index.html        # Main dashboard UI structure & modal dialogues
│   ├── css/
│   │   └── styles.css    # Modern CSS styles, variables, progress rings & responsiveness
│   └── js/
│       ├── api.js        # API abstraction module (FastAPI connection + LocalStorage fallback)
│       ├── charts.js     # Chart.js initialization & dynamic updates
│       └── app.js        # Main UI event controller & state manager
│
├── run.py                # One-click launcher script (starts server & opens browser)
└── README.md             # Project documentation & setup guide
```

---

## 🚀 Getting Started

### Recommended Workspace
> [!TIP]
> Set your workspace to the project directory:
> `C:\Users\Manogna\.gemini\antigravity\scratch\fitness_tracker_app`

### Prerequisites
- Python 3.8+ (Available via `py` or `python` command)
- Modern Web Browser (Chrome, Edge, Firefox, Safari)

### Quick Start (One-Click Launch)
Run the launcher script from your terminal:

```bash
py run.py
```

This command will:
1. Automatically install any missing dependencies (`fastapi`, `uvicorn`, `pydantic`).
2. Initialize the SQLite database `fitness_tracker.db` with sample data.
3. Start the FastAPI backend server on `http://127.0.0.1:8000`.
4. Open the application directly in your default web browser.

---

## 📡 API Documentation

When the backend server is running, interactive Swagger API documentation is available at:
👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

### Key REST Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/activities` | Fetch logged activities (optional `?date=YYYY-MM-DD` filter) |
| `POST` | `/api/activities` | Log a new exercise activity |
| `DELETE` | `/api/activities/{id}` | Delete an activity log by ID |
| `GET` | `/api/goals` | Get current daily fitness targets |
| `PUT` | `/api/goals` | Update daily step, calorie, minute, and water goals |
| `POST` | `/api/water` | Log water intake amount |
| `GET` | `/api/summary/daily` | Get today's aggregated stats & goal percentages |
| `GET` | `/api/summary/weekly` | Get 7-day trend metrics for charts |

---

## 🎨 Technology Stack

- **Frontend**: HTML5, CSS3 (CSS Variables, Flexbox/Grid, SVG Animations), Vanilla JavaScript (ES6+ Modules), FontAwesome 6, Chart.js.
- **Backend**: Python 3.13, FastAPI, Uvicorn ASGI server.
- **Database**: SQLite3 (Embedded local relational database).
