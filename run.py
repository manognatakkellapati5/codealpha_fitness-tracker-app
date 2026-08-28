#!/usr/bin/env python3
"""
FitPulse Fitness Tracker Launcher
Starts the FastAPI Python backend server and opens the web app dashboard in your browser.
"""

import sys
import subprocess
import webbrowser
import time
import os

def install_dependencies():
    print("Checking and installing backend dependencies (fastapi, uvicorn, pydantic)...")
    req_file = os.path.join(os.path.dirname(__file__), "backend", "requirements.txt")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])

def main():
    # Change current working directory to project root
    project_root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(project_root)
    sys.path.insert(0, project_root)

    print("\n=======================================================")
    print("      🚀 Starting FitPulse Fitness Tracker App         ")
    print("=======================================================\n")

    # Install requirements
    try:
        import fastapi
        import uvicorn
    except ImportError:
        install_dependencies()
        import uvicorn

    url = "http://127.0.0.1:8000"
    print(f"Backend API & App Dashboard: {url}")
    print(f"Interactive API Documentation: {url}/docs")
    print("\nOpening web app in default browser...")

    # Open browser slightly after server startup
    def open_browser():
        time.sleep(1.5)
        webbrowser.open(url)

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    # Run Uvicorn server
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()
