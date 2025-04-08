; installer.iss
; -- Inno Setup script for WinMed Player --

#define MyAppName "WinMed"
#define MyAppVersion "1.5.0" 
#define MyAppPublisher "Samuel" 
#define MyAppExeName "winmed.exe"
#define MyAppSourcePath "release-builds\\winmed-win32-x64"
#define MySetupIconFile "assets\\icons\\icon.ico"
#define MyOutputBaseFilename "WinMed-Setup"
#define MyAppURLName "{#MyAppName}.url"
#define MyAppURL "https://github.com/samcuxx/WinMed-Media-Player"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in other installers.
AppId={{AUTO_APPID}} ; Or replace with a specific GUID
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
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
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode
Name: "associatemp4"; Description: "Associate .mp4 files"; GroupDescription: "File associations:"
Name: "associatewebm"; Description: "Associate .webm files"; GroupDescription: "File associations:"
Name: "associatemkv"; Description: "Associate .mkv files"; GroupDescription: "File associations:"
Name: "associateavi"; Description: "Associate .avi files"; GroupDescription: "File associations:"
Name: "associatemov"; Description: "Associate .mov files"; GroupDescription: "File associations:"
Name: "associatemp3"; Description: "Associate .mp3 files"; GroupDescription: "File associations:"
Name: "associatewav"; Description: "Associate .wav files"; GroupDescription: "File associations:"
Name: "associateogg"; Description: "Associate .ogg files"; GroupDescription: "File associations:"
Name: "associatem4a"; Description: "Associate .m4a files"; GroupDescription: "File associations:"
Name: "associateflac"; Description: "Associate .flac files"; GroupDescription: "File associations:"

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
; Create 'winmed' protocol handler
Root: HKCR; Subkey: "winmed"; ValueType: string; ValueName: ""; ValueData: "URL:WinMed Protocol"; Flags: uninsdeletekey
Root: HKCR; Subkey: "winmed"; ValueType: string; ValueName: "URL Protocol"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "winmed\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Flags: uninsdeletevalue

; Register MIME types and file associations
; Video file extensions
Root: HKCR; Subkey: ".mp4\OpenWithProgids"; ValueType: string; ValueName: "WinMed"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: ".webm\OpenWithProgids"; ValueType: string; ValueName: "WinMed"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: ".mkv\OpenWithProgids"; ValueType: string; ValueName: "WinMed"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: ".avi\OpenWithProgids"; ValueType: string; ValueName: "WinMed"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: ".mov\OpenWithProgids"; ValueType: string; ValueName: "WinMed"; ValueData: ""; Flags: uninsdeletevalue

; Audio file extensions
Root: HKCR; Subkey: ".mp3\OpenWithProgids"; ValueType: string; ValueName: "WinMed"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: ".wav\OpenWithProgids"; ValueType: string; ValueName: "WinMed"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: ".ogg\OpenWithProgids"; ValueType: string; ValueName: "WinMed"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: ".m4a\OpenWithProgids"; ValueType: string; ValueName: "WinMed"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: ".flac\OpenWithProgids"; ValueType: string; ValueName: "WinMed"; ValueData: ""; Flags: uninsdeletevalue

; Add application to "Open with" menu
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".mp4"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".webm"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".mkv"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".avi"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".mov"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".mp3"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".wav"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".ogg"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".m4a"; ValueData: ""; Flags: uninsdeletevalue
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\SupportedTypes"; ValueType: string; ValueName: ".flac"; ValueData: ""; Flags: uninsdeletevalue

; Create application registration for "Default Programs" in Windows
Root: HKCR; Subkey: "Applications\{#MyAppExeName}"; ValueType: string; ValueName: ""; ValueData: "WinMed Media Player"; Flags: uninsdeletevalue
Root: HKCR; Subkey: "Applications\{#MyAppExeName}\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#MyAppExeName}"" ""%1"""; Flags: uninsdeletevalue

; Register capability with Windows (Windows 10/11)
Root: HKLM; Subkey: "SOFTWARE\RegisteredApplications"; ValueType: string; ValueName: "WinMed"; ValueData: "Software\WinMed\Capabilities"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities"; ValueType: string; ValueName: "ApplicationName"; ValueData: "WinMed Media Player"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities"; ValueType: string; ValueName: "ApplicationDescription"; ValueData: "Professional Media Player"; Flags: uninsdeletevalue

; Register file associations with Windows capabilities
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".mp4"; ValueData: "WinMed"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".webm"; ValueData: "WinMed"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".mkv"; ValueData: "WinMed"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".avi"; ValueData: "WinMed"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".mov"; ValueData: "WinMed"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".mp3"; ValueData: "WinMed"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".wav"; ValueData: "WinMed"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".ogg"; ValueData: "WinMed"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".m4a"; ValueData: "WinMed"; Flags: uninsdeletevalue
Root: HKLM; Subkey: "SOFTWARE\WinMed\Capabilities\FileAssociations"; ValueType: string; ValueName: ".flac"; ValueData: "WinMed"; Flags: uninsdeletevalue 