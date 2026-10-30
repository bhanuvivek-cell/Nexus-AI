# =============================================================================
#  Nexus AI - One-Command Development Startup
#  Usage:  powershell -ExecutionPolicy Bypass -File scripts\run_dev.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

# ---- Paths ------------------------------------------------------------------
$rootDir     = Split-Path -Parent $PSScriptRoot
$backendDir  = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"
$pythonExe   = Join-Path $backendDir ".venv\Scripts\python.exe"

$BACKEND_PORT  = 8000
$FRONTEND_PORT = 5173

# ---- Banner -----------------------------------------------------------------
Clear-Host
Write-Host ""
Write-Host "  ====================================================" -ForegroundColor Cyan
Write-Host "      NEXUS AI  --  Career Intelligence Platform" -ForegroundColor Yellow
Write-Host "           Where Skills Meet Opportunity" -ForegroundColor White
Write-Host "  ====================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Helper: check if a TCP port is already listening -----------------------
function Test-PortInUse([int]$port) {
    $result = netstat -ano 2>$null | Select-String "LISTENING" | Select-String ":$port "
    return ($null -ne $result)
}

# ---- Step 1: Pre-flight checks ----------------------------------------------
Write-Host "  [1/4] Running pre-flight checks..." -ForegroundColor Yellow

if (-not (Test-Path $pythonExe)) {
    Write-Host "  ERROR: Python virtual environment not found at:" -ForegroundColor Red
    Write-Host "         $pythonExe" -ForegroundColor Red
    Write-Host "  FIX  : From the project root, run:" -ForegroundColor Yellow
    Write-Host "         cd backend" -ForegroundColor White
    Write-Host "         python -m venv .venv" -ForegroundColor White
    Write-Host "         .venv\Scripts\pip install -r requirements.txt" -ForegroundColor White
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "  node_modules not found -- installing frontend packages..." -ForegroundColor Yellow
    Push-Location $frontendDir
    npm install
    Pop-Location
}

Write-Host "  OK: Python venv and node_modules are present." -ForegroundColor Green

# ---- Step 2: Port conflict detection ----------------------------------------
Write-Host "  [2/4] Checking ports $BACKEND_PORT and $FRONTEND_PORT..." -ForegroundColor Yellow

$backendRunning  = Test-PortInUse $BACKEND_PORT
$frontendRunning = Test-PortInUse $FRONTEND_PORT

if ($backendRunning) {
    Write-Host "  WARN: Port $BACKEND_PORT already in use -- backend may already be running." -ForegroundColor Yellow
    Write-Host "        Skipping backend launch." -ForegroundColor Gray
}
if ($frontendRunning) {
    Write-Host "  WARN: Port $FRONTEND_PORT already in use -- frontend may already be running." -ForegroundColor Yellow
    Write-Host "        Skipping frontend launch." -ForegroundColor Gray
}

# ---- Step 3: Start services -------------------------------------------------
Write-Host "  [3/4] Starting services..." -ForegroundColor Yellow

if (-not $backendRunning) {
    Write-Host "  -> Launching FastAPI backend on http://127.0.0.1:$BACKEND_PORT ..." -ForegroundColor Green
    Start-Process `
        -FilePath "cmd.exe" `
        -ArgumentList "/k", "title Nexus-AI Backend && `"$pythonExe`" -m uvicorn app.main:app --host 127.0.0.1 --port $BACKEND_PORT --reload" `
        -WorkingDirectory $backendDir
}

# Brief pause so the backend socket binds before Vite starts
Start-Sleep -Milliseconds 1800

if (-not $frontendRunning) {
    Write-Host "  -> Launching Vite frontend on http://localhost:$FRONTEND_PORT ..." -ForegroundColor Green
    Start-Process `
        -FilePath "cmd.exe" `
        -ArgumentList "/k", "title Nexus-AI Frontend && npm run dev" `
        -WorkingDirectory $frontendDir
}

# ---- Step 4: Health probes --------------------------------------------------
Write-Host "  [4/4] Waiting for services to become ready (up to 30s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$backendOK = $false
for ($i = 1; $i -le 8; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$BACKEND_PORT/api/v1/health" `
                                  -UseBasicParsing -TimeoutSec 3
        if ($resp.StatusCode -eq 200) { $backendOK = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}

$frontendOK = $false
for ($i = 1; $i -le 8; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:$FRONTEND_PORT" `
                                  -UseBasicParsing -TimeoutSec 3
        if ($resp.StatusCode -eq 200) { $frontendOK = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}

# ---- Summary ----------------------------------------------------------------
Write-Host ""
Write-Host "  ====================================================" -ForegroundColor Cyan

if ($frontendOK) {
    Write-Host "  Frontend  :  http://localhost:$FRONTEND_PORT       [OK]" -ForegroundColor Green
} else {
    Write-Host "  Frontend  :  http://localhost:$FRONTEND_PORT       [!] not ready yet" -ForegroundColor Yellow
}

if ($backendOK) {
    Write-Host "  Backend   :  http://127.0.0.1:$BACKEND_PORT      [OK]" -ForegroundColor Green
} else {
    Write-Host "  Backend   :  http://127.0.0.1:$BACKEND_PORT      [!] not ready yet" -ForegroundColor Yellow
}

Write-Host "  API Docs  :  http://127.0.0.1:$BACKEND_PORT/docs" -ForegroundColor White
Write-Host "  AI Chat   :  http://localhost:$FRONTEND_PORT/assistant" -ForegroundColor White
Write-Host "  ====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Two CMD windows are running (Nexus-AI Backend / Nexus-AI Frontend)." -ForegroundColor Gray
Write-Host "  Close those windows or run stop-dev.bat to stop the services." -ForegroundColor Gray
Write-Host ""

if (-not $frontendOK) {
    Write-Host "  [!] Frontend did not respond in time." -ForegroundColor Yellow
    Write-Host "      Open the Nexus-AI Frontend CMD window to see errors." -ForegroundColor Yellow
}
if (-not $backendOK) {
    Write-Host "  [!] Backend did not respond in time." -ForegroundColor Yellow
    Write-Host "      Open the Nexus-AI Backend CMD window to see errors." -ForegroundColor Yellow
}
