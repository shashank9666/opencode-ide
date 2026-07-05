@echo off
cd /d "%~dp0"

echo Starting OpenCode IDE...

echo [0/3] Clearing ports...
powershell -NoProfile -Command "foreach ($p in @(4098, 4444)) { Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | ForEach-Object { try { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } catch {} } }"

echo [1/3] Starting backend (port 4098)...
start "opencode-ide-backend" bun run ./packages/opencode/src/index.ts serve --port 4098

echo [2/3] Starting frontend (port 4444)...
start "opencode-ide-frontend" bun --cwd packages\app dev -- --port 4444

echo [3/3] Opening browser...
timeout /t 5 /nobreak >nul
start http://localhost:4444

echo Done.
