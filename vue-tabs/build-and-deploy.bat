@echo off
echo ========================================
echo Building Vue Application for Zayit
echo ========================================
echo.

echo [1/3] Building production bundle...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Build complete!
echo.

echo [2/3] Copying to C# project...
set "DEST=..\ZayitLib\Zayit\Html\index.html"
copy /Y dist\index.html "%DEST%"
if errorlevel 1 (
    echo ERROR: Copy failed! Check if destination path exists.
    pause
    exit /b 1
)
echo Copy complete!
echo.

echo [3/3] Verifying deployment...
if exist "%DEST%" (
    echo SUCCESS: File deployed to %DEST%
) else (
    echo ERROR: File not found at destination!
    pause
    exit /b 1
)
echo.

echo ========================================
echo Build and Deploy Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Rebuild the C# project in Visual Studio
echo 2. Run the application to test changes
echo.
pause
