@echo off
echo Removing WinMed Media Player file associations...

:: Delete 'winmed' protocol handler
reg delete "HKCU\Software\Classes\winmed" /f >nul 2>&1

:: Delete file associations
setlocal enabledelayedexpansion

:: Video file extensions
set videoExts=mp4 webm mkv avi mov
for %%i in (%videoExts%) do (
    echo Removing .%%i association...
    reg delete "HKCU\Software\Classes\.%%i\OpenWithProgids" /v "WinMed" /f >nul 2>&1
)

:: Audio file extensions
set audioExts=mp3 wav ogg m4a flac
for %%i in (%audioExts%) do (
    echo Removing .%%i association...
    reg delete "HKCU\Software\Classes\.%%i\OpenWithProgids" /v "WinMed" /f >nul 2>&1
)

:: Remove application from "Open with" menu
reg delete "HKCU\Software\Classes\Applications\winmed.exe" /f >nul 2>&1

:: Remove Windows capability registrations
reg delete "HKCU\Software\RegisteredApplications" /v "WinMed" /f >nul 2>&1
reg delete "HKCU\Software\WinMed" /f >nul 2>&1

echo File associations removed successfully!
echo You can now test the new installer without the previous registry entries interfering.
echo.
pause 