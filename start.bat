@echo off
rem BoardTrack launcher for Windows. Double-click this file.
rem It runs the same steps as the README: npm install, create .env, npm start.
setlocal
cd /d "%~dp0"
title BoardTrack

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install it from https://nodejs.org then double-click this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing packages, please wait...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Read the message above, then see docs\troubleshooting.md
    pause
    exit /b 1
  )
)

if not exist .env (
  copy .env.example .env >nul
  echo.
  echo A settings file named .env was just created and will open in Notepad.
  echo Type your PostgreSQL username and password into the DATABASE_URL line, save, close Notepad,
  echo then double-click start.bat again.
  notepad .env
  pause
  exit /b 0
)

echo Starting BoardTrack. The browser opens in a few seconds at http://localhost:3000
echo Close this window to stop the app.
start "" cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:3000"
call npm start
echo.
echo BoardTrack stopped. If you saw an error above, see docs\troubleshooting.md
pause
