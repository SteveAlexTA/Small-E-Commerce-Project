@echo off
setlocal
echo ==========================================
echo   NEXUS TECH - Backend Server (Flask)
echo ==========================================
cd /d "%~dp0"

:: Check if venv exists
if not exist "api\.venv\Scripts\python.exe" (
    echo [ERROR] Virtual environment not found. Please create it first.
    pause
    exit /b
)

echo Starting Flask server on http://127.0.0.1:5000
api\.venv\Scripts\python.exe api\server.py
pause
