const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

// Define supported file types
const supportedFileTypes = [
  "mp4",
  "webm",
  "mkv",
  "avi",
  "mov",
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "flac",
];

// Set application as default handler for supported file types
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("winmed");
  }
} else {
  app.setAsDefaultProtocolClient("winmed");
}

// Check if we're launching with a protocol handler or file association
// We need to handle this case separately from normal launches
const isFileAssociationLaunch =
  process.argv.length > 1 &&
  !process.argv[1].startsWith("--") &&
  !process.argv[1].startsWith("-") &&
  process.argv[1] !== "." &&
  process.platform === "win32";

// Register file type associations on Windows
if (process.platform === "win32") {
  app.setUserTasks([
    {
      program: process.execPath,
      arguments: "",
      iconPath: process.execPath,
      iconIndex: 0,
      title: "New WinMed Player",
      description: "Open WinMed Media Player",
    },
  ]);
}

// Log all command line arguments at startup for debugging
console.log("Application starting with arguments:", process.argv);

// Handle file open events (Windows)
if (isFileAssociationLaunch) {
  // Check if a file path was passed as an argument (from file association click)
  const filePath = process.argv[1];
  console.log("Checking command line argument path:", filePath);

  // Check if path exists AND is a file (not a directory) AND has valid extension
  if (fs.existsSync(filePath)) {
    console.log("Path exists, checking if it is a file...");
    const stats = fs.statSync(filePath);
    if (stats.isFile()) {
      console.log("Path is a file, checking extension...");
      const ext = path.extname(filePath).toLowerCase().substring(1); // Remove dot
      if (supportedFileTypes.includes(ext)) {
        // Store absolute path normalized for better cross-platform compatibility
        global.startupFile = path.resolve(filePath);
        console.log("Startup file detected:", global.startupFile);
      } else {
        console.log("File has unsupported extension:", filePath);
      }
    } else {
      console.log(
        "Path exists but is not a file:",
        filePath,
        "isDirectory:",
        stats.isDirectory()
      );
    }
  } else {
    console.log("Path does not exist:", filePath);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "../assets/icons/icon.png"),
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundMaterial: "acrylic",
  });

  mainWindow.loadFile(path.join(__dirname, "../app/index.html"));

  // Force acrylic effect to render on startup
  setTimeout(() => {
    // Get current bounds
    const bounds = mainWindow.getBounds();

    // Trigger a small resize to force the effect
    mainWindow.setBounds({
      ...bounds,
      width: bounds.width + 1,
    });

    // Restore original size
    setTimeout(() => {
      mainWindow.setBounds(bounds);
    }, 10);
  }, 100);

  // Handle window control events from renderer
  ipcMain.on("window-minimize", () => {
    mainWindow.minimize();
  });

  ipcMain.on("window-maximize", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  // Add window state change listeners
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window-state-changed", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window-state-changed", false);
  });

  // Send initial window state
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send(
      "window-state-changed",
      mainWindow.isMaximized()
    );
  });

  ipcMain.on("window-close", () => {
    mainWindow.close();
  });

  // Return the window instance
  return mainWindow;
}

let mainWindow;

app.whenReady().then(() => {
  mainWindow = createWindow();

  // Send a message to initialize cursor and controls behavior
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("app-ready");

    // Also send window state
    mainWindow.webContents.send(
      "window-state-changed",
      mainWindow.isMaximized()
    );

    // Send startup file if it exists
    if (global.startupFile) {
      console.log("Sending startup file to renderer:", global.startupFile);
      mainWindow.webContents.send("open-file", global.startupFile);
    }
  });

  // Handle file open events from protocol (winmed://)
  app.on("open-url", (event, url) => {
    event.preventDefault();
    console.log("Protocol handler received URL:", url);

    const filePath = url.replace("winmed://", "");
    console.log("Protocol handler extracted file path:", filePath);

    // Check if path exists AND is a file (not a directory) AND has valid extension
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase().substring(1); // Remove dot
        if (supportedFileTypes.includes(ext)) {
          const resolvedPath = path.resolve(filePath);
          console.log("Protocol handler opening file:", resolvedPath);
          mainWindow.webContents.send("open-file", resolvedPath);
        } else {
          console.log(
            "Protocol handler: File has unsupported extension:",
            filePath
          );
        }
      } else {
        console.log(
          "Protocol handler: Path exists but is not a file:",
          filePath
        );
      }
    } else {
      console.log("Protocol handler: Path does not exist:", filePath);
    }
  });

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });
});

// Handle opening files from file explorer
app.on("second-instance", (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    console.log("Second instance with command line:", commandLine);

    // Check if file path is provided in command line args
    if (commandLine.length > 1) {
      // Use the first non-flag argument as potential file path
      const filePath = commandLine.find(
        (arg) =>
          !arg.startsWith("-") &&
          !arg.startsWith("--") &&
          arg !== process.execPath
      );

      if (filePath) {
        console.log("Second instance checking file path:", filePath);

        // Check if path exists AND is a file (not a directory) AND has valid extension
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            const ext = path.extname(filePath).toLowerCase().substring(1); // Remove dot
            if (supportedFileTypes.includes(ext)) {
              const resolvedPath = path.resolve(filePath);
              console.log("Second instance file path:", resolvedPath);
              mainWindow.webContents.send("open-file", resolvedPath);
            } else {
              console.log(
                "Second instance: File has unsupported extension:",
                filePath
              );
            }
          } else {
            console.log(
              "Second instance: Path exists but is not a file:",
              filePath
            );
          }
        } else {
          console.log("Second instance: Path does not exist:", filePath);
        }
      }
    }
  }
});

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// Handle file selection dialog
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile", "multiSelections"],
    filters: [
      {
        name: "Media Files",
        extensions: supportedFileTypes,
      },
    ],
  });
  return result.filePaths;
});

// Add handler for getting temp directory
ipcMain.handle("get-temp-path", () => {
  return app.getPath("temp");
});

// Add handler for opening files from file associations
ipcMain.handle("get-startup-file", () => {
  return global.startupFile || null;
});
