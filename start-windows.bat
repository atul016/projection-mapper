@echo off
rem Double-click on Windows. Serves this folder at http://localhost:8765 and opens it in your browser.
rem Opening index.html directly works too, except for YouTube zones: YouTube refuses pages opened as files.
cd /d "%~dp0"
set PORT=8765

where py >nul 2>nul && set PY=py
if not defined PY where python >nul 2>nul && set PY=python
if not defined PY (
  echo Needs Python 3 to run a local server. Install it from https://www.python.org, or just open index.html.
  pause
  exit /b 1
)

rem open the browser after a short wait, so the server is up first
start "" cmd /c "timeout /t 2 >nul & start http://localhost:%PORT%/"
echo Projection Mapper is running at http://localhost:%PORT%/ - close this window to stop it.
%PY% -m http.server %PORT% --bind 127.0.0.1
