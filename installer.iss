; installer.iss
; -- Inno Setup script for WinMed Player --

#define MyAppName "WinMed"
#define MyAppVersion "1.0.2" 
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

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "{#MyAppSourcePath}\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"
Name: "{group}\\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent 