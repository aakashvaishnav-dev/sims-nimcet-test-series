@echo off
setlocal
cd /d "%~dp0"
if not exist .env.local (
  echo.
  echo ERROR: .env.local file is missing.
  echo Copy .env.example to .env.local and add your Supabase keys first.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies for the first time...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
start "SIMS NIMCET Server" cmd /k "npm run dev"
timeout /t 4 /nobreak >nul
start "" http://localhost:3000
echo SIMS NIMCET Test Series is starting in your browser.
endlocal
