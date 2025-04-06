# WinMed v1.3.0 Release Notes

## What's New in v1.3.0

### Improved Windows Integration

- **Automatic File Associations**: WinMed now automatically registers file associations during installation
- **Better Windows Integration**: Enhanced installer with comprehensive Windows registry entries
- **Clean Installation**: No need for manual file association scripts
- **Improved Protocol Handler**: Better handling of media file protocols

### Technical Improvements

- **Enhanced Registry Management**: Better handling of Windows registry entries
- **Improved Installer**: More robust installation process
- **Better File Association Handling**: More reliable file type associations
- **Clean Testing Support**: New unregister script for testing file associations

### Bug Fixes

- Fixed issues with file associations in Windows
- Resolved installer file association registration problems
- Improved handling of Windows capabilities registration

## Installation

1. Download the latest installer from the [Releases](https://github.com/samcuxx/WinMed-Media-Player/releases) page
2. Run the installer
3. File associations will be automatically set up during installation

## Breaking Changes

- The manual `register-file-types.bat` script is no longer needed
- File associations are now handled automatically by the installer

## Known Issues

- None reported

## System Requirements

- Windows 10 or later
- No additional scripts or manual configuration needed

## Support

If you encounter any issues, please report them on the [GitHub Issues](https://github.com/samcuxx/WinMed-Media-Player/issues) page.

## Credits

- Built with [Electron](https://www.electronjs.org/)
- Icons by [Font Awesome](https://fontawesome.com/)
