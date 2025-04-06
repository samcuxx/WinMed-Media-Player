const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

// Define supported media file types
const MEDIA_FILE_EXTENSIONS = [
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

  ipcMain.on("window-close", () => {
    mainWindow.close();
  });

  // Return the window instance
  return mainWindow;
}

let mainWindow;

// Handle file opened with app (Windows file association)
function handleFileOpen(filePath) {
  if (mainWindow) {
    mainWindow.webContents.send("file-opened", filePath);
  }
}

app.whenReady().then(() => {
  mainWindow = createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });

  // Register as default handler for supported file types
  if (process.platform === "win32") {
    app.setUserTasks([
      {
        program: process.execPath,
        arguments: "",
        iconPath: process.execPath,
        iconIndex: 0,
        title: "Open WinMed Media Player",
        description: "Launch WinMed Media Player",
      },
    ]);

    app.setAsDefaultProtocolClient("winmed");
    MEDIA_FILE_EXTENSIONS.forEach((ext) => {
      app.setAsDefaultProtocolClient(`winmed-${ext}`);
    });
  }
});

// Handle file open from file explorer when app is already running
app.on("second-instance", (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();

    // Check if file path is in the command line arguments
    const filePath = commandLine.find((arg) => {
      const ext = path.extname(arg).toLowerCase().substring(1);
      return MEDIA_FILE_EXTENSIONS.includes(ext);
    });

    if (filePath) {
      handleFileOpen(filePath);
    }
  }
});

// Handle file open from file explorer when app is not already running
app.on("open-file", (event, filePath) => {
  event.preventDefault();
  handleFileOpen(filePath);
});

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
        extensions: MEDIA_FILE_EXTENSIONS,
      },
    ],
  });
  return result.filePaths;
});

// Add handler for getting temp directory
ipcMain.handle("get-temp-path", () => {
  return app.getPath("temp");
});
