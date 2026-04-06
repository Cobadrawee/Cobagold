@echo off
setlocal

cd /d "%~dp0"
echo Starting local server...
echo Keep this window open while viewing the site.

REM Prefer PowerShell (no Python needed)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-WINDOWS.ps1"
if %errorlevel%==0 goto :eof

echo PowerShell server failed. Trying Python (if installed)...
py -3 -m http.server 5173 2>nul
if %errorlevel%==0 goto :eof

python -m http.server 5173

echo.
echo Failed to start local server.
pause

