@echo off
title AI Student Hub

echo Starting AI Student Hub...

:: Start backend
start "Backend" cmd /k "cd /d D:\Software\ai-student-hub\backend && python -m uvicorn app.main:app --reload --port 8000"

:: Wait a moment then launch Tauri desktop app
timeout /t 3 /nobreak >nul
start "" "D:\Software\ai-student-hub\src-tauri\target\debug\ai-student-hub.exe"

echo.
echo AI Student Hub started!
echo   Backend:  http://localhost:8000
echo   Desktop:  AI Student Hub (native window)
echo.
echo Press any key to close this window...
pause >nul
