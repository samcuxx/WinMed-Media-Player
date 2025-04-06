const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

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

app.whenReady().then(() => {
  mainWindow = createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });
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
        extensions: [
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
        ],
      },
    ],
  });
  return result.filePaths;
});

// Add handler for getting temp directory
ipcMain.handle("get-temp-path", () => {
  return app.getPath("temp");
});
