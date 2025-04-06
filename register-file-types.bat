@echo off
echo Registering WinMed Media Player file associations...

:: Get the full path to the WinMed executable
set WinMedPath=%~dp0release-builds\winmed-win32-x64\winmed.exe

if not exist "%WinMedPath%" (
    echo ERROR: WinMed executable not found at %WinMedPath%
    echo Please run 'npm run package:win' first to create the application package.
    exit /b 1
)

:: Create 'winmed' protocol handler
reg add "HKCU\Software\Classes\winmed" /ve /t REG_SZ /d "URL:WinMed Protocol" /f
reg add "HKCU\Software\Classes\winmed" /v "URL Protocol" /t REG_SZ /d "" /f
reg add "HKCU\Software\Classes\winmed\shell\open\command" /ve /t REG_SZ /d "\"%WinMedPath%\" \"%%1\"" /f

:: Register MIME types and file associations
setlocal enabledelayedexpansion

:: Video file extensions
set videoExts=mp4 webm mkv avi mov
for %%i in (%videoExts%) do (
    echo Registering .%%i association...
    
    :: Create file type association
    reg add "HKCU\Software\Classes\.%%i\OpenWithProgids" /v "WinMed" /t REG_SZ /d "" /f
    
    :: Add application to "Open with" menu
    reg add "HKCU\Software\Classes\Applications\winmed.exe\SupportedTypes" /v ".%%i" /t REG_SZ /d "" /f
)

:: Audio file extensions
set audioExts=mp3 wav ogg m4a flac
for %%i in (%audioExts%) do (
    echo Registering .%%i association...
    
    :: Create file type association
    reg add "HKCU\Software\Classes\.%%i\OpenWithProgids" /v "WinMed" /t REG_SZ /d "" /f
    
    :: Add application to "Open with" menu
    reg add "HKCU\Software\Classes\Applications\winmed.exe\SupportedTypes" /v ".%%i" /t REG_SZ /d "" /f
)

:: Create application registration for "Default Programs" in Windows
reg add "HKCU\Software\Classes\Applications\winmed.exe" /ve /t REG_SZ /d "WinMed Media Player" /f
reg add "HKCU\Software\Classes\Applications\winmed.exe\shell\open\command" /ve /t REG_SZ /d "\"%WinMedPath%\" \"%%1\"" /f

:: Register capability with Windows (Windows 10/11)
reg add "HKCU\Software\RegisteredApplications" /v "WinMed" /t REG_SZ /d "Software\WinMed\Capabilities" /f
reg add "HKCU\Software\WinMed\Capabilities" /v "ApplicationName" /t REG_SZ /d "WinMed Media Player" /f
reg add "HKCU\Software\WinMed\Capabilities" /v "ApplicationDescription" /t REG_SZ /d "Professional Media Player" /f

:: Register file associations with Windows capabilities
for %%i in (%videoExts% %audioExts%) do (
    reg add "HKCU\Software\WinMed\Capabilities\FileAssociations" /v ".%%i" /t REG_SZ /d "WinMed" /f
)

echo File associations registered successfully!
echo To set WinMed as default player for media files:
echo 1. Open Windows Settings
echo 2. Go to Apps ^> Default Apps
echo 3. Scroll down and select "Choose defaults by file type"
echo 4. Find each file type and set WinMed as the default app
echo.
pause 