@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "SWIM_NODE=node"
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "SWIM_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if "%~1"=="" (
  "%SWIM_NODE%" --use-system-ca scripts\publicar.mjs --open
) else (
  "%SWIM_NODE%" --use-system-ca scripts\publicar.mjs --source "%~1" --open
)
pause
