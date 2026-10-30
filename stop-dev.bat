@echo off
:: Nexus AI — Stop All Dev Services
:: Kills the Vite frontend (port 5173) and FastAPI backend (port 8000).

echo.
echo  Stopping Nexus AI services...

:: Kill process on port 8000 (FastAPI/uvicorn)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    echo  Stopping backend (PID %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

:: Kill process on port 5173 (Vite)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    echo  Stopping frontend (PID %%a)...
    taskkill /PID %%a /F >nul 2>&1
)

echo  Done. Both services stopped.
echo.
pause

