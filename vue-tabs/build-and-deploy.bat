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
set "DEST_HTML=..\ZayitLib\Zayit\Html\index.html"
set "DEST_ASSETS=..\ZayitLib\Zayit\Html\assets"
copy /Y dist\index.html "%DEST_HTML%"
if errorlevel 1 (
    echo ERROR: HTML copy failed! Check if destination path exists.
    pause
    exit /b 1
)
xcopy /Y /E /I dist\assets "%DEST_ASSETS%"
if errorlevel 1 (
    echo ERROR: Assets copy failed! Check if destination path exists.
    pause
    exit /b 1
)
echo Copy complete!
echo.

echo [3/3] Verifying deployment...
if exist "%DEST_HTML%" (
    echo SUCCESS: HTML deployed to %DEST_HTML%
) else (
    echo ERROR: HTML file not found at destination!
    pause
    exit /b 1
)
if exist "%DEST_ASSETS%" (
    echo SUCCESS: Assets deployed to %DEST_ASSETS%
) else (
    echo ERROR: Assets folder not found at destination!
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
