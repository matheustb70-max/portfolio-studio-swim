@echo off
chcp 65001 >nul
cd /d "%~dp0"
if "%~1"=="" (
  node --use-system-ca scripts\publicar.mjs --open
) else (
  node --use-system-ca scripts\publicar.mjs --source "%~1" --open
)
pause
