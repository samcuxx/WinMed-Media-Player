; installer.iss
; -- Inno Setup script for WinMed Player --

#define MyAppName "WinMed"
#define MyAppVersion "1.1.0" 
#define MyAppPublisher "Samuel" 
#define MyAppExeName "winmed.exe"
#define MyAppSourcePath "release-builds\\winmed-win32-x64"
#define MySetupIconFile "assets\\icons\\icon.ico"
#define MyOutputBaseFilename "WinMed-Setup"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in other installers.
AppId={{AUTO_APPID}} ; Or replace with a specific GUID
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=LICENSE
OutputDir=installers ; Output installer to an 'installers' subfolder
OutputBaseFilename={#MyOutputBaseFilename}-{#MyAppVersion}
SetupIconFile={#MySetupIconFile}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ChangesAssociations=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "associatevideofiles"; Description: "Associate WinMed with video files"; GroupDescription: "File associations:"; Flags: unchecked
Name: "associateaudiofiles"; Description: "Associate WinMed with audio files"; GroupDescription: "File associations:"; Flags: unchecked

[Files]
Source: "{#MyAppSourcePath}\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"
Name: "{group}\\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent 

[Registry]
; Video file associations
Root: HKCR; Subkey: ".mp4"; ValueType: string; ValueName: ""; ValueData: "WinMed.VideoFile"; Flags: uninsdeletevalue; Tasks: associatevideofiles
Root: HKCR; Subkey: ".webm"; ValueType: string; ValueName: ""; ValueData: "WinMed.VideoFile"; Flags: uninsdeletevalue; Tasks: associatevideofiles
Root: HKCR; Subkey: ".mkv"; ValueType: string; ValueName: ""; ValueData: "WinMed.VideoFile"; Flags: uninsdeletevalue; Tasks: associatevideofiles
Root: HKCR; Subkey: ".avi"; ValueType: string; ValueName: ""; ValueData: "WinMed.VideoFile"; Flags: uninsdeletevalue; Tasks: associatevideofiles
Root: HKCR; Subkey: ".mov"; ValueType: string; ValueName: ""; ValueData: "WinMed.VideoFile"; Flags: uninsdeletevalue; Tasks: associatevideofiles

; Audio file associations
Root: HKCR; Subkey: ".mp3"; ValueType: string; ValueName: ""; ValueData: "WinMed.AudioFile"; Flags: uninsdeletevalue; Tasks: associateaudiofiles
Root: HKCR; Subkey: ".wav"; ValueType: string; ValueName: ""; ValueData: "WinMed.AudioFile"; Flags: uninsdeletevalue; Tasks: associateaudiofiles
Root: HKCR; Subkey: ".ogg"; ValueType: string; ValueName: ""; ValueData: "WinMed.AudioFile"; Flags: uninsdeletevalue; Tasks: associateaudiofiles
Root: HKCR; Subkey: ".m4a"; ValueType: string; ValueName: ""; ValueData: "WinMed.AudioFile"; Flags: uninsdeletevalue; Tasks: associateaudiofiles
Root: HKCR; Subkey: ".flac"; ValueType: string; ValueName: ""; ValueData: "WinMed.AudioFile"; Flags: uninsdeletevalue; Tasks: associateaudiofiles

; Video file type details
Root: HKCR; Subkey: "WinMed.VideoFile"; ValueType: string; ValueName: ""; ValueData: "WinMed Video File"; Flags: uninsdeletekey; Tasks: associatevideofiles
Root: HKCR; Subkey: "WinMed.VideoFile\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"; Tasks: associatevideofiles
Root: HKCR; Subkey: "WinMed.VideoFile\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Tasks: associatevideofiles

; Audio file type details
Root: HKCR; Subkey: "WinMed.AudioFile"; ValueType: string; ValueName: ""; ValueData: "WinMed Audio File"; Flags: uninsdeletekey; Tasks: associateaudiofiles
Root: HKCR; Subkey: "WinMed.AudioFile\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\{#MyAppExeName},0"; Tasks: associateaudiofiles
Root: HKCR; Subkey: "WinMed.AudioFile\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Tasks: associateaudiofiles

; Add WinMed to "Open with" menu for all files
Root: HKCR; Subkey: "*\shell\WinMed"; ValueType: string; ValueName: ""; ValueData: "Open with WinMed"; Flags: uninsdeletekey
Root: HKCR; Subkey: "*\shell\WinMed\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""

; Add app registration for Default Programs in Windows
Root: HKLM; Subkey: "SOFTWARE\RegisteredApplications"; ValueType: string; ValueName: "WinMed"; ValueData: "SOFTWARE\WinMed\Capabilities"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities"; ValueType: string; ValueName: "ApplicationDescription"; ValueData: "WinMed Media Player"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities"; ValueType: string; ValueName: "ApplicationName"; ValueData: "WinMed"; Flags: uninsdeletekey
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".mp4"; ValueData: "WinMed.VideoFile"; Tasks: associatevideofiles
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".webm"; ValueData: "WinMed.VideoFile"; Tasks: associatevideofiles
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".mkv"; ValueData: "WinMed.VideoFile"; Tasks: associatevideofiles
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".avi"; ValueData: "WinMed.VideoFile"; Tasks: associatevideofiles
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".mov"; ValueData: "WinMed.VideoFile"; Tasks: associatevideofiles
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".mp3"; ValueData: "WinMed.AudioFile"; Tasks: associateaudiofiles
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".wav"; ValueData: "WinMed.AudioFile"; Tasks: associateaudiofiles
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".ogg"; ValueData: "WinMed.AudioFile"; Tasks: associateaudiofiles
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".m4a"; ValueData: "WinMed.AudioFile"; Tasks: associateaudiofiles
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".flac"; ValueData: "WinMed.AudioFile"; Tasks: associateaudiofiles 