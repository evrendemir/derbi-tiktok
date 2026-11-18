@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "KULLANICI=%~1"
if "%KULLANICI%"=="" set /p KULLANICI=TikTok kullanici adin (@ ile):
python bridge.py %KULLANICI%
pause
