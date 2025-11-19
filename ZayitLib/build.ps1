#!/usr/bin/env pwsh
# ZayitLib Build Script
# Usage: .\build.ps1 [command]
# Available commands: build, rebuild, clean, release, restore

param(
    [Parameter(Position=0)]
    [ValidateSet('build', 'rebuild', 'clean', 'release', 'restore', 'run')]
    [string]$Command = 'build'
)

$MSBuildPath = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe"
$SolutionPath = "ZayitLib.sln"
$ExePath = "Zayit\bin\Debug\Zayit.exe"
$ExePathRelease = "Zayit\bin\Release\Zayit.exe"

function Show-Help {
    Write-Host ""
    Write-Host "ZayitLib Build Script" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\build.ps1 [command]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available commands:" -ForegroundColor Green
    Write-Host "  build    - Build the solution in Debug mode (default)" -ForegroundColor White
    Write-Host "  rebuild  - Clean and rebuild in Debug mode" -ForegroundColor White
    Write-Host "  release  - Build the solution in Release mode" -ForegroundColor White
    Write-Host "  clean    - Clean build artifacts" -ForegroundColor White
    Write-Host "  restore  - Restore NuGet packages" -ForegroundColor White
    Write-Host "  run      - Build and run the application" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Green
    Write-Host "  .\build.ps1" -ForegroundColor Gray
    Write-Host "  .\build.ps1 build" -ForegroundColor Gray
    Write-Host "  .\build.ps1 release" -ForegroundColor Gray
    Write-Host "  .\build.ps1 run" -ForegroundColor Gray
    Write-Host ""
}

function Test-MSBuild {
    if (-not (Test-Path $MSBuildPath)) {
        Write-Host "Error: MSBuild not found at $MSBuildPath" -ForegroundColor Red
        Write-Host "Please update the MSBuildPath variable in this script." -ForegroundColor Yellow
        exit 1
    }
}

function Invoke-Build {
    param([string]$Configuration = "Debug")
    
    Write-Host ""
    Write-Host "Building ZayitLib ($Configuration)..." -ForegroundColor Cyan
    Write-Host ""
    
    & $MSBuildPath $SolutionPath /p:Configuration=$Configuration /v:minimal
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Build succeeded!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Build failed!" -ForegroundColor Red
        Write-Host ""
        exit $LASTEXITCODE
    }
}

function Invoke-Rebuild {
    Write-Host ""
    Write-Host "Rebuilding ZayitLib..." -ForegroundColor Cyan
    Write-Host ""
    
    & $MSBuildPath $SolutionPath /t:Rebuild /p:Configuration=Debug /v:minimal
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Rebuild succeeded!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Rebuild failed!" -ForegroundColor Red
        Write-Host ""
        exit $LASTEXITCODE
    }
}

function Invoke-Clean {
    Write-Host ""
    Write-Host "Cleaning ZayitLib..." -ForegroundColor Cyan
    Write-Host ""
    
    & $MSBuildPath $SolutionPath /t:Clean /v:minimal
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Clean succeeded!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Clean failed!" -ForegroundColor Red
        Write-Host ""
        exit $LASTEXITCODE
    }
}

function Invoke-Restore {
    Write-Host ""
    Write-Host "Restoring NuGet packages..." -ForegroundColor Cyan
    Write-Host ""
    
    & $MSBuildPath $SolutionPath /t:Restore /v:minimal
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Restore succeeded!" -ForegroundColor Green
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "Restore failed!" -ForegroundColor Red
        Write-Host ""
        exit $LASTEXITCODE
    }
}

function Invoke-Run {
    Invoke-Build -Configuration "Debug"
    
    if (Test-Path $ExePath) {
        Write-Host "Running Zayit..." -ForegroundColor Cyan
        Write-Host ""
        & $ExePath
    } else {
        Write-Host "Error: Executable not found at $ExePath" -ForegroundColor Red
        exit 1
    }
}

# Main script execution
Test-MSBuild

switch ($Command) {
    'build' {
        Invoke-Build -Configuration "Debug"
    }
    'rebuild' {
        Invoke-Rebuild
    }
    'clean' {
        Invoke-Clean
    }
    'release' {
        Invoke-Build -Configuration "Release"
    }
    'restore' {
        Invoke-Restore
    }
    'run' {
        Invoke-Run
    }
    default {
        Show-Help
    }
}
