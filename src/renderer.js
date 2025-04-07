const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const srtToVtt = require("srt-to-vtt");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;

// DOM Elements
const videoPlayer = document.getElementById("videoPlayer");
const playlist = document.getElementById("playlist");
const addFileBtn = document.getElementById("addFile");
const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const volumeSlider = document.getElementById("volume");
const progressBar = document.getElementById("progress");
const progressContainer = document.getElementById("progressContainer");
const currentTimeDisplay = document.getElementById("currentTime");
const durationDisplay = document.getElementById("duration");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const muteBtn = document.getElementById("muteBtn");
const pipBtn = document.getElementById("pipBtn");
const togglePlaylistBtn = document.getElementById("togglePlaylist");
const container = document.querySelector(".container");
const welcomeScreen = document.querySelector(".welcome-screen");
const selectFileBtn = document.getElementById("selectFileBtn");
const mediaContainer = document.querySelector(".media-container");
const subtitleBtn = document.getElementById("subtitleBtn");
const subtitleMenu = document.getElementById("subtitleMenu");
const subtitleList = document.getElementById("subtitleList");
const subtitleContainer = document.getElementById("subtitleContainer");
const subtitleUploadBtn = document.getElementById("subtitleUploadBtn");
const subtitleUploadInput = document.getElementById("subtitleUploadInput");
const mediaTitleElement = document.querySelector(".media-title");

// OSD Elements
const osdContainer = document.getElementById("osdContainer");
const osdIcon = document.getElementById("osdIcon");
const osdText = document.getElementById("osdText");

// OSD Functions
let osdTimeout = null;

function showOSD(iconPath, text) {
  // Clear any existing timeout
  if (osdTimeout) {
    clearTimeout(osdTimeout);
  }

  // Set icon and text
  osdIcon.src = iconPath;
  osdIcon.alt = text;
  osdText.textContent = text;

  // Show the OSD
  osdContainer.classList.add("show");

  // Hide after 1.5 seconds
  osdTimeout = setTimeout(() => {
    osdContainer.classList.remove("show");
  }, 1500);
}

// State
let playlistItems = [];
let currentIndex = -1;
let isShuffleMode = false;
let repeatMode = "none"; // none, one, all
let isDraggingProgress = false;
let nextPreloadedMedia = null;
let seekTimeout = null;
let subtitleTracks = []; // Array to store available subtitle tracks
let currentSubtitleTrack = -1; // Index of current subtitle track (-1 means disabled)
let subtitlesVisible = true; // Toggle state for subtitle visibility
let cueMap = new Map(); // Map to store VTTCues for rendering
let subtitleProcessing = false; // Flag to avoid multiple concurrent subtitle processing

// Set ffmpeg and ffprobe paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Helper function to check if a file is a valid media file
function isValidMediaFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error("File does not exist:", filePath);
    return false;
  }

  // Check if it's a file, not a directory
  if (!fs.statSync(filePath).isFile()) {
    console.error("Path is not a file:", filePath);
    return false;
  }

  // Check if it has a supported file extension
  const ext = path.extname(filePath).toLowerCase().substring(1); // Remove the dot
  const supportedExts = [
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

  if (!supportedExts.includes(ext)) {
    console.error("Unsupported file extension:", ext);
    return false;
  }

  return true;
}

// Handle files opened directly from file explorer or file associations
ipcRenderer.on("open-file", (event, filePath) => {
  console.log("Received file to open:", filePath);

  // Normalize the file path
  let normalizedPath = filePath;

  // Handle file:// protocol if present
  if (normalizedPath.startsWith("file://")) {
    normalizedPath = decodeURI(normalizedPath.replace(/^file:\/\/\/?/, ""));
  }

  // Fix Windows path format if needed
  if (process.platform === "win32" && !normalizedPath.match(/^[A-Za-z]:/)) {
    // If missing drive letter, assume C: drive
    normalizedPath = "C:" + normalizedPath;
  }

  // Validate file exists and is a valid media file
  if (isValidMediaFile(normalizedPath)) {
    console.log("Opening file:", normalizedPath);
    addToPlaylist(normalizedPath);
    toggleWelcomeScreen(false);
    // Play the file immediately
    const index = playlistItems.length - 1;
    playFile(index);
  } else {
    console.error("Not a valid media file:", normalizedPath);
  }
});

// Check for any startup files when the app loads
document.addEventListener("DOMContentLoaded", async () => {
  const startupFile = await ipcRenderer.invoke("get-startup-file");
  if (startupFile) {
    addToPlaylist(startupFile);
    toggleWelcomeScreen(false);
    playFile(0);
  }
});

// Keyboard shortcuts for WinMed
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return; // Ignore if typing in an input

  switch (e.code) {
    case "Space":
      e.preventDefault();
      togglePlayPause();
      break;
    case "ArrowLeft":
      e.preventDefault();
      videoPlayer.currentTime -= 5; // Rewind 5 seconds
      showOSD("../assets/icons/svg/rewind.svg", "Rewind 5s");
      break;
    case "ArrowRight":
      e.preventDefault();
      videoPlayer.currentTime += 5; // Forward 5 seconds
      showOSD("../assets/icons/svg/forward.svg", "Forward 5s");
      break;
    case "ArrowUp":
      e.preventDefault();
      videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
      volumeSlider.value = videoPlayer.volume * 100;
      showOSD(
        "../assets/icons/svg/volume.svg",
        `Volume: ${Math.round(videoPlayer.volume * 100)}%`
      );
      break;
    case "ArrowDown":
      e.preventDefault();
      videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
      volumeSlider.value = videoPlayer.volume * 100;
      showOSD(
        "../assets/icons/svg/volume.svg",
        `Volume: ${Math.round(videoPlayer.volume * 100)}%`
      );
      break;
    case "KeyF":
      toggleFullscreen();
      break;
    case "KeyM":
      toggleMute();
      break;
    case "KeyP":
      if (e.altKey) {
        // Alt + P for Picture-in-Picture
        togglePictureInPicture();
      } else {
        // P for Previous track
        playPrevious();
        showOSD("../assets/icons/svg/previous.svg", "Previous Track");
      }
      break;
    case "KeyN":
      // N for Next track
      playNext();
      showOSD("../assets/icons/svg/next.svg", "Next Track");
      break;
    case "KeyC":
      // Added C key for toggling subtitles
      toggleSubtitles();
      break;
  }
});

// Event Listeners
addFileBtn.addEventListener("click", async () => {
  const filePaths = await ipcRenderer.invoke("select-file");
  if (filePaths && filePaths.length > 0) {
    // Filter out invalid files
    const validFiles = filePaths.filter((path) => isValidMediaFile(path));

    validFiles.forEach((path) => {
      addToPlaylist(path);
    });

    if (validFiles.length > 0) {
      toggleWelcomeScreen(false);
    }
  }
});

playPauseBtn.addEventListener("click", () => {
  if (videoPlayer.paused) {
    videoPlayer.play();
    playPauseBtn.classList.add("playing");
    showOSD("../assets/icons/svg/play.svg", "Play");
  } else {
    videoPlayer.pause();
    playPauseBtn.classList.remove("playing");
    showOSD("../assets/icons/svg/pause.svg", "Pause");
  }
});

prevBtn.addEventListener("click", playPrevious);
nextBtn.addEventListener("click", playNext);
volumeSlider.addEventListener("input", handleVolumeChange);
progressContainer.addEventListener("mousedown", (e) => {
  isDraggingProgress = true;
  handleProgressChange(e);
});
document.addEventListener("mousemove", (e) => {
  if (isDraggingProgress) {
    // Clear any pending seek operation
    if (seekTimeout) {
      clearTimeout(seekTimeout);
    }
    handleProgressChange(e);
  }
});
document.addEventListener("mouseup", (e) => {
  if (isDraggingProgress) {
    isDraggingProgress = false;
    // Perform the final seek immediately
    const rect = progressContainer.getBoundingClientRect();
    const pos = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
    videoPlayer.currentTime = pos * videoPlayer.duration;
  }
});
fullscreenBtn.addEventListener("click", toggleFullscreen);
shuffleBtn.addEventListener("click", toggleShuffle);
repeatBtn.addEventListener("click", toggleRepeat);
muteBtn.addEventListener("click", () => {
  if (videoPlayer.muted) {
    videoPlayer.muted = false;
    muteBtn.classList.remove("muted");
    volumeSlider.value = videoPlayer.volume * 100;
    showOSD("../assets/icons/svg/volume.svg", "Unmuted");
  } else {
    videoPlayer.muted = true;
    muteBtn.classList.add("muted");
    volumeSlider.value = 0;
    showOSD("../assets/icons/svg/mute.svg", "Muted");
  }
});
togglePlaylistBtn.addEventListener("click", () => {
  container.classList.toggle("hide-playlist");
});
pipBtn.addEventListener("click", togglePictureInPicture);

videoPlayer.addEventListener("timeupdate", updateProgress);
videoPlayer.addEventListener("loadedmetadata", updateDuration);
videoPlayer.addEventListener("ended", playNext);

// Update play/pause button state when video state changes
videoPlayer.addEventListener("play", () => {
  playPauseBtn.classList.add("playing");
});

videoPlayer.addEventListener("pause", () => {
  playPauseBtn.classList.remove("playing");
});

// Update mute button state when volume changes
videoPlayer.addEventListener("volumechange", () => {
  if (videoPlayer.muted || videoPlayer.volume === 0) {
    muteBtn.classList.add("muted");
  } else {
    muteBtn.classList.remove("muted");
  }
});

// Functions
function addToPlaylist(filePath) {
  console.log("Adding to playlist:", filePath);

  // Verify file is a valid media file
  if (!isValidMediaFile(filePath)) {
    return;
  }

  const fileName = filePath.split(/[/\\]/).pop();
  const index = playlistItems.length;
  playlistItems.push(filePath);

  const playlistItem = document.createElement("div");
  playlistItem.className = "playlist-item";
  playlistItem.textContent = fileName;
  playlistItem.dataset.index = index;

  // Use event delegation for better performance
  playlistItem.dataset.action = "play";

  playlist.appendChild(playlistItem);

  if (currentIndex === -1) {
    playFile(0);
  } else {
    // Preload the new file if it's the next in sequence
    if (index === currentIndex + 1) {
      preloadNextMedia();
    }
  }
}

function playFile(index) {
  if (index >= 0 && index < playlistItems.length) {
    try {
      currentIndex = index;
      const filePath = playlistItems[index];
      const fileName = filePath.split(/[/\\]/).pop();

      // Update title bar with current media
      mediaTitleElement.textContent = fileName;

      // Create a proper file URL that handles spaces and special characters
      // Use URL constructor for proper encoding
      let fileUrl;
      try {
        // For Windows paths, ensure they start with /
        if (process.platform === "win32") {
          const formattedPath = filePath.replace(/\\/g, "/");
          fileUrl = new URL(`file:///${formattedPath}`).href;
        } else {
          fileUrl = new URL(`file://${filePath}`).href;
        }
      } catch (error) {
        // Fallback for compatibility
        console.warn("URL constructor failed, using manual encoding");
        fileUrl =
          "file://" +
          (filePath.startsWith("/") ? "" : "/") +
          filePath.replace(/ /g, "%20");
      }

      console.log("Playing file:", fileUrl);

      // If we're playing the next file and it's preloaded, use it
      if (nextPreloadedMedia && nextPreloadedMedia.src === fileUrl) {
        videoPlayer.src = nextPreloadedMedia.src;
        nextPreloadedMedia.remove();
        nextPreloadedMedia = null;
      } else {
        videoPlayer.src = fileUrl;
      }

      // Set playback settings before playing
      videoPlayer.preload = "auto";
      videoPlayer.volume = volumeSlider.value / 100;

      // Play immediately and preload next
      const playPromise = videoPlayer.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            preloadNextMedia();
            // Scan for subtitles after loading the video
            scanAndLoadSubtitles(filePath);
          })
          .catch((error) => {
            console.log("Playback failed:", error);
          });
      }

      updatePlaylistUI();
    } catch (error) {
      console.error("Error playing file:", error);
    }
  }
}

function togglePlayPause() {
  if (videoPlayer.paused) {
    videoPlayer.play();
    playPauseBtn.classList.add("playing");
    showOSD("../assets/icons/svg/play.svg", "Play");
  } else {
    videoPlayer.pause();
    playPauseBtn.classList.remove("playing");
    showOSD("../assets/icons/svg/pause.svg", "Pause");
  }
}

function playPrevious() {
  if (currentIndex > 0) {
    playFile(currentIndex - 1);
  }
}

function playNext() {
  if (repeatMode === "one") {
    videoPlayer.currentTime = 0;
    videoPlayer.play();
    return;
  }

  let nextIndex;
  if (isShuffleMode) {
    nextIndex = Math.floor(Math.random() * playlistItems.length);
  } else {
    nextIndex = currentIndex + 1;
    if (nextIndex >= playlistItems.length) {
      if (repeatMode === "all") {
        nextIndex = 0;
      } else {
        return;
      }
    }
  }
  playFile(nextIndex);
}

function handleVolumeChange() {
  videoPlayer.volume = volumeSlider.value / 100;
}

function handleProgressChange(e) {
  const rect = progressContainer.getBoundingClientRect();
  const pos = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);

  // Update visual progress immediately
  progressBar.style.width = `${pos * 100}%`;
  currentTimeDisplay.textContent = formatTime(pos * videoPlayer.duration);

  // If not dragging, seek immediately
  if (!isDraggingProgress) {
    if (seekTimeout) {
      clearTimeout(seekTimeout);
    }
    seekTimeout = setTimeout(() => {
      videoPlayer.currentTime = pos * videoPlayer.duration;
    }, 0);
  }
}

function updateProgress() {
  if (!isDraggingProgress) {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentTimeDisplay.textContent = formatTime(videoPlayer.currentTime);
  }
}

function updateDuration() {
  durationDisplay.textContent = formatTime(videoPlayer.duration);
}

function updatePlaylistUI() {
  const items = playlist.getElementsByClassName("playlist-item");
  for (let i = 0; i < items.length; i++) {
    items[i].classList.toggle("active", i === currentIndex);
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
    container.classList.add("fullscreen");
    showOSD("../assets/icons/svg/fullscreen.svg", "Fullscreen");
  } else {
    document.exitFullscreen();
    container.classList.remove("fullscreen");
    showOSD("../assets/icons/svg/fullscreen-exit.svg", "Exit Fullscreen");
  }
}

// Variables for controls auto-hide
let controlsTimeout = null;
let isMouseMoving = false;
let lastMouseMoveTime = Date.now();
let cursorHideTimeout = null;
let inactivityTracking = false;

function startControlsAutoHide() {
  // Show controls initially
  container.classList.remove("hide-controls", "hide-cursor");

  // Set up mouse move listener if not already tracking
  if (!inactivityTracking) {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mousedown", handleUserActivity);
    document.addEventListener("keydown", handleUserActivity);
    inactivityTracking = true;
  }

  // Start the auto-hide timer
  resetControlsTimeout();
}

function stopControlsAutoHide() {
  // Remove the mouse move listener
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mousedown", handleUserActivity);
  document.removeEventListener("keydown", handleUserActivity);
  inactivityTracking = false;

  // Clear any existing timeout
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
    controlsTimeout = null;
  }

  if (cursorHideTimeout) {
    clearTimeout(cursorHideTimeout);
    cursorHideTimeout = null;
  }

  // Ensure cursor and controls are visible
  container.classList.remove("hide-controls", "hide-cursor");
}

function handleUserActivity() {
  lastMouseMoveTime = Date.now();

  // Show controls and cursor if they were hidden
  if (
    container.classList.contains("hide-controls") ||
    container.classList.contains("hide-cursor")
  ) {
    container.classList.remove("hide-controls", "hide-cursor");
  }

  // Reset the auto-hide timer
  resetControlsTimeout();
}

function handleMouseMove() {
  handleUserActivity();
}

function resetControlsTimeout() {
  // Clear any existing timeout
  if (controlsTimeout) {
    clearTimeout(controlsTimeout);
  }

  if (cursorHideTimeout) {
    clearTimeout(cursorHideTimeout);
  }

  // Set new timeout to hide controls after 3 seconds of no mouse movement
  controlsTimeout = setTimeout(() => {
    if (!videoPlayer.paused) {
      container.classList.add("hide-controls");

      // Set timeout to hide cursor 1 second after controls are hidden
      cursorHideTimeout = setTimeout(() => {
        if (!videoPlayer.paused) {
          container.classList.add("hide-cursor");
        }
      }, 1000);
    }
  }, 3000);
}

// Add fullscreen change event listener
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) {
    container.classList.remove("fullscreen");
    // Don't stop auto-hide, we still want it in regular mode
  } else {
    container.classList.add("fullscreen");
  }
});

// Start inactivity tracking when video plays (regardless of fullscreen state)
videoPlayer.addEventListener("play", () => {
  startControlsAutoHide();
});

// Prevent controls and cursor from hiding while video is paused
videoPlayer.addEventListener("pause", () => {
  container.classList.remove("hide-controls", "hide-cursor");
});

// Initialize cursor and controls behavior when document is loaded
document.addEventListener("DOMContentLoaded", () => {
  if (!videoPlayer.paused) {
    startControlsAutoHide();
  }
});

// Start auto-hide when player is ready with actual content
videoPlayer.addEventListener("loadeddata", () => {
  if (!videoPlayer.paused) {
    startControlsAutoHide();
  }
});

function toggleMute() {
  videoPlayer.muted = !videoPlayer.muted;
  muteBtn.classList.toggle("muted", videoPlayer.muted);
  showOSD(
    videoPlayer.muted
      ? "../assets/icons/svg/mute.svg"
      : "../assets/icons/svg/volume.svg",
    videoPlayer.muted ? "Muted" : "Unmuted"
  );
}

function toggleShuffle() {
  isShuffleMode = !isShuffleMode;
  shuffleBtn.classList.toggle("active", isShuffleMode);
}

function toggleRepeat() {
  switch (repeatMode) {
    case "none":
      repeatMode = "one";
      break;
    case "one":
      repeatMode = "all";
      break;
    case "all":
      repeatMode = "none";
      break;
  }
  updateRepeatButtonUI();
}

function updateRepeatButtonUI() {
  const btn = document.getElementById("repeatBtn");
  btn.classList.remove("none", "one", "all");
  btn.classList.add(repeatMode);
  btn.title = "Repeat: " + repeatMode;
}

// Context menu for playlist items
playlist.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const playlistItem = e.target.closest(".playlist-item");
  if (!playlistItem) return;

  const index = Array.from(playlist.children).indexOf(playlistItem);
  showContextMenu(e.clientX, e.clientY, index);
});

function showContextMenu(x, y, index) {
  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.innerHTML = `
        <div class="menu-item" onclick="removeFromPlaylist(${index})">Remove</div>
        <div class="menu-item" onclick="playFile(${index})">Play</div>
    `;

  document.body.appendChild(menu);
  menu.style.left = x + "px";
  menu.style.top = y + "px";

  setTimeout(() => {
    document.addEventListener("click", function hideMenu() {
      menu.remove();
      document.removeEventListener("click", hideMenu);
    });
  });
}

function removeFromPlaylist(index) {
  playlistItems.splice(index, 1);
  playlist.children[index].remove();

  if (currentIndex === index) {
    if (playlistItems.length > 0) {
      playFile(Math.min(index, playlistItems.length - 1));
    } else {
      currentIndex = -1;
      videoPlayer.src = "";
      mediaTitleElement.textContent = "WinMed Player";
    }
  } else if (currentIndex > index) {
    currentIndex--;
  }
  updatePlaylistUI();
}

// Preload the next media file
function preloadNextMedia() {
  if (playlistItems.length <= 1) return;

  try {
    let nextIndex;
    if (isShuffleMode) {
      do {
        nextIndex = Math.floor(Math.random() * playlistItems.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = (currentIndex + 1) % playlistItems.length;
    }

    if (nextPreloadedMedia) {
      nextPreloadedMedia.remove();
    }

    const filePath = playlistItems[nextIndex];

    // Create a proper file URL that handles spaces and special characters
    let fileUrl;
    try {
      // For Windows paths, ensure they start with /
      if (process.platform === "win32") {
        const formattedPath = filePath.replace(/\\/g, "/");
        fileUrl = new URL(`file:///${formattedPath}`).href;
      } else {
        fileUrl = new URL(`file://${filePath}`).href;
      }
    } catch (error) {
      // Fallback for compatibility
      console.warn("URL constructor failed, using manual encoding");
      fileUrl =
        "file://" +
        (filePath.startsWith("/") ? "" : "/") +
        filePath.replace(/ /g, "%20");
    }

    nextPreloadedMedia = document.createElement("video");
    nextPreloadedMedia.preload = "auto";
    nextPreloadedMedia.src = fileUrl;
    nextPreloadedMedia.load();
  } catch (error) {
    console.error("Error preloading next file:", error);
  }
}

// Use event delegation for playlist clicks
playlist.addEventListener("click", (e) => {
  const item = e.target.closest(".playlist-item");
  if (item && item.dataset.action === "play") {
    playFile(parseInt(item.dataset.index));
  }
});

// Add media loading error handling
videoPlayer.addEventListener("error", (e) => {
  console.error("Media loading error:", videoPlayer.error);
  // If error occurs, try to play next file
  if (currentIndex < playlistItems.length - 1) {
    playNext();
  }
});

// Optimize playback
videoPlayer.addEventListener("loadedmetadata", () => {
  // Set video buffer size
  if (videoPlayer.duration > 3600) {
    // If longer than 1 hour
    videoPlayer.preload = "auto";
  } else {
    videoPlayer.preload = "metadata";
  }
});

// Add PiP change event listener
videoPlayer.addEventListener("enterpictureinpicture", () => {
  pipBtn.classList.add("active");
});

videoPlayer.addEventListener("leavepictureinpicture", () => {
  pipBtn.classList.remove("active");
});

async function togglePictureInPicture() {
  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
    showOSD("../assets/icons/svg/pip.svg", "Exit Picture-in-Picture");
  } else if (document.pictureInPictureEnabled) {
    await videoPlayer.requestPictureInPicture();
    showOSD("../assets/icons/svg/pip.svg", "Picture-in-Picture");
  }
}

// Window Controls
document.getElementById("minimizeBtn").addEventListener("click", () => {
  ipcRenderer.send("window-minimize");
});

document.getElementById("maximizeBtn").addEventListener("click", () => {
  ipcRenderer.send("window-maximize");
});

document.getElementById("closeBtn").addEventListener("click", () => {
  ipcRenderer.send("window-close");
});

// Update maximize/restore button icon
const maximizeBtn = document.getElementById("maximizeBtn");

// Listen for window state changes from main process
ipcRenderer.on("window-state-changed", (event, isMaximized) => {
  const imgElement = maximizeBtn.querySelector("img");
  if (isMaximized) {
    imgElement.src = "../assets/icons/svg/title/restore.svg";
    imgElement.alt = "Restore";
    maximizeBtn.title = "Restore";
  } else {
    imgElement.src = "../assets/icons/svg/title/maximize.svg";
    imgElement.alt = "Maximize";
    maximizeBtn.title = "Maximize";
  }
});

// Function to toggle welcome screen
function toggleWelcomeScreen(show) {
  if (show) {
    welcomeScreen.classList.remove("hidden");
    videoPlayer.classList.remove("active");
  } else {
    welcomeScreen.classList.add("hidden");
    videoPlayer.classList.add("active");
  }
}

// Show welcome screen initially
toggleWelcomeScreen(true);

// Handle file selection button click
selectFileBtn.addEventListener("click", async () => {
  const result = await ipcRenderer.invoke("select-file");
  if (result && result.length > 0) {
    // Filter out invalid files
    const validFiles = result.filter((path) => isValidMediaFile(path));

    validFiles.forEach((path) => {
      addToPlaylist(path);
    });

    if (validFiles.length > 0) {
      toggleWelcomeScreen(false);
    }
  }
});

// Handle drag and drop
mediaContainer.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
  mediaContainer.classList.add("drag-over");
});

mediaContainer.addEventListener("dragleave", (e) => {
  e.preventDefault();
  e.stopPropagation();
  mediaContainer.classList.remove("drag-over");
});

mediaContainer.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  mediaContainer.classList.remove("drag-over");

  const files = Array.from(e.dataTransfer.files);
  const mediaFiles = files.filter((file) => {
    // First check MIME type as a quick filter
    const isMediaType =
      file.type.startsWith("video/") || file.type.startsWith("audio/");
    // Also verify it's a valid media file with our helper function
    return isMediaType && isValidMediaFile(file.path);
  });

  if (mediaFiles.length > 0) {
    console.log(`Processing ${mediaFiles.length} dropped media files`);

    // Add all files to the playlist
    mediaFiles.forEach((file) => {
      console.log("Adding dropped file:", file.path);
      addToPlaylist(file.path);
      toggleWelcomeScreen(false);
    });

    // If a file is currently playing, play the first dropped file immediately
    const newIndex = playlistItems.length - mediaFiles.length;
    if (newIndex >= 0 && newIndex < playlistItems.length) {
      playFile(newIndex);
    }
  } else {
    console.log("No valid media files were dropped");
  }
});

// Subtitle Functions
function toggleSubtitles() {
  subtitlesVisible = !subtitlesVisible;
  subtitleContainer.style.display = subtitlesVisible ? "block" : "none";
  showOSD(
    "../assets/icons/svg/subtitles.svg",
    subtitlesVisible ? "Subtitles On" : "Subtitles Off"
  );

  // Update native text tracks based on fullscreen state
  if (currentSubtitleTrack >= 0 && videoPlayer.textTracks.length > 0) {
    // Find the appropriate text track
    let activeTrackIndex = -1;
    for (let i = 0; i < videoPlayer.textTracks.length; i++) {
      if (
        videoPlayer.textTracks[i].label ===
        subtitleTracks[currentSubtitleTrack].language
      ) {
        activeTrackIndex = i;
        break;
      }
    }

    if (activeTrackIndex >= 0) {
      // If in fullscreen, update the native track
      if (document.fullscreenElement) {
        videoPlayer.textTracks[activeTrackIndex].mode = subtitlesVisible
          ? "showing"
          : "disabled";
      } else {
        // Otherwise just update our custom display
        videoPlayer.textTracks[activeTrackIndex].mode = "hidden";
      }
    }
  }

  // Update UI state
  subtitleBtn.classList.toggle(
    "active",
    subtitlesVisible && currentSubtitleTrack >= 0
  );
  updateSubtitleDisplay();

  // Store preference in localStorage
  localStorage.setItem("subtitlesVisible", subtitlesVisible);
}

function updateSubtitleDisplay() {
  const hasSubtitles =
    subtitlesVisible && currentSubtitleTrack >= 0 && subtitleTracks.length > 0;

  // Update container display property directly rather than using CSS display property
  // for cleaner rendering
  if (hasSubtitles) {
    subtitleContainer.style.visibility = "visible";
    subtitleContainer.style.opacity = "1";
  } else {
    subtitleContainer.style.visibility = "hidden";
    subtitleContainer.style.opacity = "0";
  }

  // Show active track in subtitle button text
  const currentTrackLabel = document.getElementById("currentTrackLabel");
  if (currentTrackLabel) {
    if (
      currentSubtitleTrack >= 0 &&
      currentSubtitleTrack < subtitleTracks.length
    ) {
      const trackName = subtitleTracks[currentSubtitleTrack].language;
      const shortName =
        trackName.length > 20 ? trackName.substring(0, 20) + "..." : trackName;
      currentTrackLabel.textContent = shortName;
    } else {
      currentTrackLabel.textContent = "Off";
    }
  }
}

function toggleSubtitleMenu() {
  subtitleMenu.classList.toggle("show");
}

// Close the subtitle menu when clicking outside
document.addEventListener("click", (e) => {
  if (!subtitleBtn.contains(e.target) && !subtitleMenu.contains(e.target)) {
    subtitleMenu.classList.remove("show");
  }
});

// Function to detect and extract embedded subtitles using ffprobe
async function detectEmbeddedSubtitles(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error("Error detecting subtitles:", err);
        resolve([]);
        return;
      }

      // Filter subtitle streams
      const subtitleStreams = metadata.streams.filter(
        (stream) => stream.codec_type === "subtitle"
      );

      // Create a set to track languages we've already processed
      const languagesProcessed = new Set();
      const tracks = [];

      // Process each subtitle stream
      subtitleStreams.forEach((stream, index) => {
        // Determine language - use metadata if available or generate a generic name
        let language = stream.tags?.language || "";

        // Handle common language codes
        if (language === "eng") language = "English";
        else if (language === "fre" || language === "fra") language = "French";
        else if (language === "ger" || language === "deu") language = "German";
        else if (language === "spa") language = "Spanish";
        else if (language === "ita") language = "Italian";
        else if (language === "jpn") language = "Japanese";
        else if (language === "chi" || language === "zho") language = "Chinese";
        else if (language === "rus") language = "Russian";
        else if (language === "kor") language = "Korean";
        else if (language === "ara") language = "Arabic";
        else if (language === "") language = `Track ${index + 1}`;

        // Create a unique identifier for this language
        const langKey = language.toLowerCase();

        // Skip if we've already processed this language
        if (languagesProcessed.has(langKey)) {
          return;
        }

        // Add to our processed set
        languagesProcessed.add(langKey);

        // Create track object
        tracks.push({
          id: stream.index,
          type: "embedded",
          language: language,
          source: filePath,
          streamIndex: stream.index,
          default: stream.disposition?.default === 1,
          format: stream.codec_name || "unknown",
        });
      });

      resolve(tracks);
    });
  });
}

// Function to extract an embedded subtitle track to a temporary VTT file
async function extractEmbeddedSubtitleToVtt(filePath, streamIndex) {
  return new Promise(async (resolve, reject) => {
    const tempDir = path.join(
      await ipcRenderer.invoke("get-temp-path"),
      "winmed-subtitles"
    );
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, `subtitle-${Date.now()}.vtt`);

    ffmpeg(filePath)
      .outputOptions(`-map 0:${streamIndex}`)
      .outputFormat("webvtt")
      .on("end", () => resolve(outputPath))
      .on("error", (err) => {
        console.error("Error extracting subtitle:", err);
        reject(err);
      })
      .save(outputPath);
  });
}

// Function to look for external subtitle files
function findExternalSubtitles(videoPath) {
  const videoDir = path.dirname(videoPath);
  const videoFilename = path.basename(videoPath, path.extname(videoPath));

  const subtitleExts = [".srt", ".vtt", ".ass", ".ssa", ".sub"];
  let externalTracks = [];

  try {
    const files = fs.readdirSync(videoDir);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const filename = path.basename(file, ext);

      // Check if this is a subtitle file matching our video filename
      if (subtitleExts.includes(ext) && filename.startsWith(videoFilename)) {
        // Extract language info if present (filename.en.srt pattern)
        const parts = filename.split(".");
        let language =
          parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "Unknown";

        if (language === videoFilename) {
          language = "Default";
        }

        externalTracks.push({
          id: `ext-${externalTracks.length}`,
          type: "external",
          language: language,
          source: path.join(videoDir, file),
          format: ext.substring(1),
        });
      }
    }
  } catch (error) {
    console.error("Error finding external subtitles:", error);
  }

  return externalTracks;
}

// Function to convert SRT to VTT if needed
async function prepareSubtitleTrack(track) {
  return new Promise(async (resolve, reject) => {
    if (track.type === "embedded") {
      extractEmbeddedSubtitleToVtt(track.source, track.streamIndex)
        .then((vttPath) => {
          track.vttPath = vttPath;
          resolve(track);
        })
        .catch(reject);
      return;
    }

    // For external files
    if (track.format === "vtt") {
      track.vttPath = track.source;
      resolve(track);
    } else if (track.format === "srt") {
      // Convert SRT to VTT
      const tempDir = path.join(
        await ipcRenderer.invoke("get-temp-path"),
        "winmed-subtitles"
      );
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const outputPath = path.join(
        tempDir,
        `${path.basename(track.source, ".srt")}.vtt`
      );

      fs.createReadStream(track.source)
        .pipe(srtToVtt())
        .pipe(fs.createWriteStream(outputPath))
        .on("finish", () => {
          track.vttPath = outputPath;
          resolve(track);
        })
        .on("error", reject);
    } else {
      // For other formats, try to convert with ffmpeg
      const tempDir = path.join(
        await ipcRenderer.invoke("get-temp-path"),
        "winmed-subtitles"
      );
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const outputPath = path.join(tempDir, `subtitle-${Date.now()}.vtt`);

      ffmpeg(track.source)
        .outputFormat("webvtt")
        .on("end", () => {
          track.vttPath = outputPath;
          resolve(track);
        })
        .on("error", (err) => {
          console.error("Error converting subtitle:", err);
          reject(err);
        })
        .save(outputPath);
    }
  });
}

// Function to populate subtitle menu
function populateSubtitleMenu() {
  subtitleList.innerHTML = "";

  // Add "Disabled" option
  const disabledItem = document.createElement("div");
  disabledItem.className = `subtitle-item ${
    currentSubtitleTrack === -1 ? "active" : ""
  }`;
  disabledItem.textContent = "Disabled";
  disabledItem.dataset.index = "-1";
  disabledItem.addEventListener("click", () => {
    loadSubtitleTrack(-1);
    toggleSubtitleMenu();
  });
  subtitleList.appendChild(disabledItem);

  // Add all available tracks
  subtitleTracks.forEach((track, index) => {
    const item = document.createElement("div");
    item.className = `subtitle-item ${
      currentSubtitleTrack === index ? "active" : ""
    }`;
    item.textContent = track.language;
    item.dataset.index = index;
    item.addEventListener("click", () => {
      loadSubtitleTrack(index);
      toggleSubtitleMenu();
    });
    subtitleList.appendChild(item);
  });
}

// Function to load subtitle track
async function loadSubtitleTrack(trackIndex) {
  if (subtitleProcessing) return;
  subtitleProcessing = true;

  try {
    // Clear any existing subtitles
    subtitleContainer.innerHTML = "";
    cueMap.clear();

    // First, disable all existing text tracks
    for (let i = 0; i < videoPlayer.textTracks.length; i++) {
      videoPlayer.textTracks[i].mode = "disabled";
    }

    // Update current index
    currentSubtitleTrack = trackIndex;

    if (trackIndex >= 0 && trackIndex < subtitleTracks.length) {
      const track = subtitleTracks[trackIndex];

      // Prepare the track if needed
      await prepareSubtitleTrack(track);

      // Create a TextTrack on the video element
      const textTrack = videoPlayer.addTextTrack(
        "subtitles",
        track.language,
        track.language
      );

      // Load the VTT file
      const response = await fetch(track.vttPath);
      const vttText = await response.text();

      // Parse the VTT
      const parser = new WebVTT.Parser(window, WebVTT.StringDecoder());
      const cues = [];

      parser.oncue = (cue) => {
        cues.push(cue);
        textTrack.addCue(cue);

        // Store cue in our map by its start time (rounded to 2 decimal places)
        const key = Math.round(cue.startTime * 100) / 100;
        if (!cueMap.has(key)) {
          cueMap.set(key, []);
        }
        cueMap.get(key).push(cue);
      };

      parser.parse(vttText);
      parser.flush();

      // Set the text track mode based on fullscreen state
      if (document.fullscreenElement) {
        textTrack.mode = "showing"; // Use native display in fullscreen
      } else {
        textTrack.mode = "hidden"; // Use our custom display in windowed mode
      }

      // Enable subtitles if we loaded a track successfully
      subtitlesVisible = true;

      // Store preference
      localStorage.setItem("currentSubtitleTrack", currentSubtitleTrack);
      localStorage.setItem("subtitlesVisible", "true");
    } else {
      // Subtitles disabled
      localStorage.setItem("currentSubtitleTrack", -1);
    }

    // Update UI
    renderSelectedTrack();
    updateSubtitleDisplay();

    // Update menu UI to show correct selection
    const menuItems = subtitleList.querySelectorAll(".subtitle-item");
    menuItems.forEach((item) => {
      item.classList.toggle(
        "active",
        parseInt(item.dataset.index) === currentSubtitleTrack
      );
    });

    // Update subtitle button state
    subtitleBtn.classList.toggle(
      "active",
      subtitlesVisible && currentSubtitleTrack >= 0
    );
  } catch (error) {
    console.error("Error loading subtitle track:", error);
  } finally {
    subtitleProcessing = false;
  }
}

// Function to render the currently selected track name
function renderSelectedTrack() {
  const trackLabel = document.getElementById("currentTrackLabel");
  if (
    currentSubtitleTrack >= 0 &&
    currentSubtitleTrack < subtitleTracks.length
  ) {
    trackLabel.textContent = subtitleTracks[currentSubtitleTrack].language;
  } else {
    trackLabel.textContent = "Off";
  }
}

// Function to handle subtitle upload
function handleSubtitleUpload(files) {
  if (!files || !files.length) return;

  const file = files[0];
  const ext = path.extname(file.path).toLowerCase();

  if ([".srt", ".vtt", ".ass", ".ssa", ".sub"].includes(ext)) {
    // Create a unique ID for the file to avoid duplicates
    const fileId = `upload-${Date.now()}`;

    // Check if we already have this file path in the tracks
    const existingIndex = subtitleTracks.findIndex(
      (track) =>
        track.source === file.path || track.language.includes(file.name)
    );

    if (existingIndex >= 0) {
      // Use existing track
      loadSubtitleTrack(existingIndex);
    } else {
      // Add new track
      const track = {
        id: fileId,
        type: "external",
        language: `Uploaded (${file.name})`,
        source: file.path,
        format: ext.substring(1),
      };

      subtitleTracks.push(track);
      populateSubtitleMenu();
      loadSubtitleTrack(subtitleTracks.length - 1);
    }
  } else {
    alert(
      "Invalid subtitle format. Please upload .srt, .vtt, .ass, .ssa, or .sub files."
    );
  }
}

// Render subtitles on video time update
videoPlayer.addEventListener("timeupdate", () => {
  if (!subtitlesVisible || currentSubtitleTrack < 0) {
    return;
  }

  const currentTime = videoPlayer.currentTime;

  // Only update DOM when needed
  let hasVisibleCues = false;
  let cueContent = "";

  // Find all cues that should be displayed
  for (const [startTime, cues] of cueMap.entries()) {
    for (const cue of cues) {
      if (currentTime >= cue.startTime && currentTime <= cue.endTime) {
        hasVisibleCues = true;
        cueContent += (cueContent ? "<br>" : "") + cue.text;
      }
    }
  }

  // Update DOM only if content changed
  if (hasVisibleCues) {
    if (
      subtitleContainer.innerHTML !==
      `<div class="subtitle-text">${cueContent}</div>`
    ) {
      subtitleContainer.innerHTML = `<div class="subtitle-text">${cueContent}</div>`;
    }
  } else if (subtitleContainer.innerHTML !== "") {
    subtitleContainer.innerHTML = "";
  }
});

// Detect and load subtitles when playing a file
async function scanAndLoadSubtitles(filePath) {
  try {
    // Reset subtitle state
    subtitleTracks = [];
    currentSubtitleTrack = -1;
    cueMap.clear();
    subtitleContainer.innerHTML = "";

    // Look for embedded subtitles
    const embeddedTracks = await detectEmbeddedSubtitles(filePath);

    // Look for external subtitle files
    const externalTracks = findExternalSubtitles(filePath);

    // Deduplicate tracks by language
    const languageMap = new Map();

    // First add embedded tracks with preference
    embeddedTracks.forEach((track) => {
      // Normalize language identifier
      const langKey = track.language.toLowerCase().trim();
      // Only add if we don't already have this language, or if it's marked as default
      if (!languageMap.has(langKey) || track.default) {
        languageMap.set(langKey, track);
      }
    });

    // Then add external tracks if language doesn't exist yet
    externalTracks.forEach((track) => {
      const langKey = track.language.toLowerCase().trim();
      if (!languageMap.has(langKey)) {
        languageMap.set(langKey, track);
      }
    });

    // Convert map to array
    subtitleTracks = Array.from(languageMap.values());

    // Populate menu with available tracks
    populateSubtitleMenu();

    // Auto-load first track if available
    const savedTrackIndex = parseInt(
      localStorage.getItem("currentSubtitleTrack") || "-1"
    );
    const savedSubtitlesVisible =
      localStorage.getItem("subtitlesVisible") === "true";

    // If we have a saved track index and it's valid, use it
    if (savedTrackIndex >= 0 && savedTrackIndex < subtitleTracks.length) {
      subtitlesVisible = savedSubtitlesVisible;
      loadSubtitleTrack(savedTrackIndex);
    } else if (subtitleTracks.length > 0) {
      // Find default track if available
      const defaultTrackIndex = subtitleTracks.findIndex(
        (track) => track.default
      );

      // Otherwise load the first track if available
      subtitlesVisible = true;
      loadSubtitleTrack(defaultTrackIndex >= 0 ? defaultTrackIndex : 0);
    }

    // Update UI
    subtitleBtn.classList.toggle("active", subtitlesVisible);
    updateSubtitleDisplay();
  } catch (error) {
    console.error("Error scanning for subtitles:", error);
  }
}

// Event listeners for subtitle UI
subtitleBtn.addEventListener("click", toggleSubtitleMenu);
subtitleUploadBtn.addEventListener("click", () => {
  subtitleUploadInput.click();
});

subtitleUploadInput.addEventListener("change", (e) => {
  handleSubtitleUpload(e.target.files);
  e.target.value = ""; // Reset for future uploads
});

// Initialize from localStorage on startup
document.addEventListener("DOMContentLoaded", () => {
  subtitlesVisible = localStorage.getItem("subtitlesVisible") === "true";
  subtitleBtn.classList.toggle("active", subtitlesVisible);
});

// WebVTT parser (simplified - you might want to use a proper library)
const WebVTT = {
  Parser: function (window, decoder) {
    this.window = window;
    this.decoder = decoder;
    this.oncue = function () {};
    this.onparsingerror = function () {};
    this.onflush = function () {};
  },
  StringDecoder: function () {
    return {
      decode: function (data) {
        return data;
      },
    };
  },
};

WebVTT.Parser.prototype.parse = function (data) {
  // Very basic parser - in a real implementation you'd use a library
  const lines = data.split("\n");
  let inCue = false;
  let cue;
  let tempCue = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip WebVTT header
    if (line.startsWith("WEBVTT")) continue;

    // Timestamp line like "00:00:12.000 --> 00:00:15.000"
    if (line.includes(" --> ")) {
      const times = line.split(" --> ");
      tempCue = {
        startTime: this.parseTimestamp(times[0]),
        endTime: this.parseTimestamp(times[1]),
        text: "",
      };
      inCue = true;
      continue;
    }

    // Cue text
    if (inCue && line !== "") {
      tempCue.text += (tempCue.text ? "\n" : "") + line;
    }

    // End of cue or empty line after cue
    if (inCue && (line === "" || i === lines.length - 1) && tempCue.text) {
      cue = new VTTCue(tempCue.startTime, tempCue.endTime, tempCue.text);
      this.oncue(cue);
      tempCue = {};
      inCue = false;
    }
  }
};

WebVTT.Parser.prototype.flush = function () {
  this.onflush();
};

WebVTT.Parser.prototype.parseTimestamp = function (timestamp) {
  const regex = /(\d+):(\d+):(\d+)\.(\d+)/;
  const match = regex.exec(timestamp);

  if (match) {
    return (
      parseInt(match[1], 10) * 3600 +
      parseInt(match[2], 10) * 60 +
      parseInt(match[3], 10) +
      parseInt(match[4], 10) / 1000
    );
  }

  // Also handle MM:SS.mmm format
  const shortRegex = /(\d+):(\d+)\.(\d+)/;
  const shortMatch = shortRegex.exec(timestamp);

  if (shortMatch) {
    return (
      parseInt(shortMatch[1], 10) * 60 +
      parseInt(shortMatch[2], 10) +
      parseInt(shortMatch[3], 10) / 1000
    );
  }

  return 0;
};

// Function to handle fullscreen subtitle positioning
function updateSubtitlePositioning() {
  const isFullscreen = !!document.fullscreenElement;

  if (isFullscreen) {
    subtitleContainer.classList.add("fullscreen");

    // When in fullscreen, use native captions for better integration
    if (currentSubtitleTrack >= 0 && videoPlayer.textTracks.length > 0) {
      // Find the active text track (usually the last one we added)
      let activeTrackIndex = -1;
      for (let i = 0; i < videoPlayer.textTracks.length; i++) {
        if (
          videoPlayer.textTracks[i].label ===
          subtitleTracks[currentSubtitleTrack].language
        ) {
          activeTrackIndex = i;
          break;
        }
      }

      // If we found our track, enable it for native display
      if (activeTrackIndex >= 0 && subtitlesVisible) {
        videoPlayer.textTracks[activeTrackIndex].mode = "showing";
        // Hide our custom display in fullscreen since we're using native captions
        subtitleContainer.style.visibility = "hidden";
      }
    }
  } else {
    subtitleContainer.classList.remove("fullscreen");

    // When exiting fullscreen, switch back to our custom display
    if (currentSubtitleTrack >= 0 && videoPlayer.textTracks.length > 0) {
      // Disable all native text tracks
      for (let i = 0; i < videoPlayer.textTracks.length; i++) {
        if (videoPlayer.textTracks[i].mode === "showing") {
          videoPlayer.textTracks[i].mode = "hidden";
        }
      }

      // Show our custom display if subtitles are enabled
      if (subtitlesVisible) {
        subtitleContainer.style.visibility = "visible";
        subtitleContainer.style.opacity = "1";
      }
    }
  }
}

// Add event listener for fullscreen change
document.addEventListener("fullscreenchange", updateSubtitlePositioning);

// Auto-hide controls and cursor when inactive
let inactivityTimer;
let cursorTimer;
const INACTIVITY_DELAY = 1000; // Reduced from 3000 to 1000ms for more immediate hiding
const CURSOR_DELAY = 1500; // Reduced from 4000 to 1500ms

function resetInactivityTimers() {
  clearTimeout(inactivityTimer);
  clearTimeout(cursorTimer);

  // Show controls and cursor immediately
  container.classList.remove("hide-controls", "hide-cursor");

  // Start new timers
  if (!videoPlayer.paused && videoPlayer.src) {
    inactivityTimer = setTimeout(() => {
      container.classList.add("hide-controls");
    }, INACTIVITY_DELAY);

    cursorTimer = setTimeout(() => {
      container.classList.add("hide-cursor");
    }, CURSOR_DELAY);
  }
}

function startInactivityTracking() {
  // Clear any existing timers
  clearTimeout(inactivityTimer);
  clearTimeout(cursorTimer);

  // Add event listeners for user activity
  const activityEvents = ["mousemove", "mousedown", "keydown", "wheel"];
  activityEvents.forEach((event) => {
    document.addEventListener(event, resetInactivityTimers, { passive: true });
  });

  // Start tracking if video is playing
  if (!videoPlayer.paused && videoPlayer.src) {
    resetInactivityTimers();
  }
}

// Listen for app ready message from main process
ipcRenderer.on("app-ready", () => {
  startInactivityTracking();
});

// Update video state tracking
videoPlayer.addEventListener("play", () => {
  startInactivityTracking();
});

videoPlayer.addEventListener("pause", () => {
  clearTimeout(inactivityTimer);
  clearTimeout(cursorTimer);
  container.classList.remove("hide-controls", "hide-cursor");
});
