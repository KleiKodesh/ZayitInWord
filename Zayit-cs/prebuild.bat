@echo off
REM Force Pre-Build Script
REM Always rebuilds Vue (no smart checking)

set "VUE_DIR=%~dp0..\zayit-vue"

echo Force rebuilding Vue...
cd "%VUE_DIR%"
call build-and-deploy.bat
exit /b %ERRORLEVEL%
