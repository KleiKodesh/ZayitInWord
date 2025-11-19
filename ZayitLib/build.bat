@echo off
REM ZayitLib Build Script (Batch version)
REM Usage: build.bat [command]

if "%1"=="" goto build
if /i "%1"=="build" goto build
if /i "%1"=="rebuild" goto rebuild
if /i "%1"=="clean" goto clean
if /i "%1"=="release" goto release
if /i "%1"=="restore" goto restore
if /i "%1"=="run" goto run
if /i "%1"=="help" goto help
goto help

:build
echo.
echo Building ZayitLib (Debug)...
echo.
"C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe" ZayitLib.sln /p:Configuration=Debug /v:minimal
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build succeeded!
    echo.
) else (
    echo.
    echo Build failed!
    echo.
    exit /b %ERRORLEVEL%
)
goto end

:rebuild
echo.
echo Rebuilding ZayitLib...
echo.
"C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe" ZayitLib.sln /t:Rebuild /p:Configuration=Debug /v:minimal
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Rebuild succeeded!
    echo.
) else (
    echo.
    echo Rebuild failed!
    echo.
    exit /b %ERRORLEVEL%
)
goto end

:clean
echo.
echo Cleaning ZayitLib...
echo.
"C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe" ZayitLib.sln /t:Clean /v:minimal
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Clean succeeded!
    echo.
) else (
    echo.
    echo Clean failed!
    echo.
    exit /b %ERRORLEVEL%
)
goto end

:release
echo.
echo Building ZayitLib (Release)...
echo.
"C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe" ZayitLib.sln /p:Configuration=Release /v:minimal
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Build succeeded!
    echo.
) else (
    echo.
    echo Build failed!
    echo.
    exit /b %ERRORLEVEL%
)
goto end

:restore
echo.
echo Restoring NuGet packages...
echo.
"C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe" ZayitLib.sln /t:Restore /v:minimal
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Restore succeeded!
    echo.
) else (
    echo.
    echo Restore failed!
    echo.
    exit /b %ERRORLEVEL%
)
goto end

:run
call :build
if %ERRORLEVEL% EQU 0 (
    echo.
    echo Running Zayit...
    echo.
    "Zayit\bin\Debug\Zayit.exe"
)
goto end

:help
echo.
echo ZayitLib Build Script
echo =====================
echo.
echo Usage: build.bat [command]
echo.
echo Available commands:
echo   build    - Build the solution in Debug mode (default)
echo   rebuild  - Clean and rebuild in Debug mode
echo   release  - Build the solution in Release mode
echo   clean    - Clean build artifacts
echo   restore  - Restore NuGet packages
echo   run      - Build and run the application
echo   help     - Show this help message
echo.
echo Examples:
echo   build.bat
echo   build.bat build
echo   build.bat release
echo   build.bat run
echo.
goto end

:end
