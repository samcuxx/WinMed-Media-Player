const { ipcRenderer } = require("electron");

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
const closeSubtitleMenu = document.getElementById("closeSubtitleMenu");
const subtitleList = document.getElementById("subtitleList");
const loadSubtitleBtn = document.getElementById("loadSubtitle");

// State
let playlistItems = [];
let currentIndex = -1;
let isShuffleMode = false;
let repeatMode = "none"; // none, one, all
let isDraggingProgress = false;
let nextPreloadedMedia = null;
let seekTimeout = null;
let isSubtitleMenuOpen = false;
let subtitleTracks = [];
let currentSubtitleTrack = null;

// Keyboard shortcuts
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
      break;
    case "ArrowRight":
      e.preventDefault();
      videoPlayer.currentTime += 5; // Forward 5 seconds
      break;
    case "ArrowUp":
      e.preventDefault();
      videoPlayer.volume = Math.min(1, videoPlayer.volume + 0.1);
      volumeSlider.value = videoPlayer.volume * 100;
      break;
    case "ArrowDown":
      e.preventDefault();
      videoPlayer.volume = Math.max(0, videoPlayer.volume - 0.1);
      volumeSlider.value = videoPlayer.volume * 100;
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
      }
      break;
    case "KeyC":
      e.preventDefault();
      toggleSubtitles();
      break;
  }
});

// Event Listeners
addFileBtn.addEventListener("click", async () => {
  const filePaths = await ipcRenderer.invoke("select-file");
  if (filePaths && filePaths.length > 0) {
    addToPlaylist(filePaths[0]);
  }
});

playPauseBtn.addEventListener("click", togglePlayPause);
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
muteBtn.addEventListener("click", toggleMute);
togglePlaylistBtn.addEventListener("click", () => {
  container.classList.toggle("hide-playlist");
});
pipBtn.addEventListener("click", togglePictureInPicture);

videoPlayer.addEventListener("timeupdate", updateProgress);
videoPlayer.addEventListener("loadedmetadata", updateDuration);
videoPlayer.addEventListener("ended", playNext);

// Functions
function addToPlaylist(filePath) {
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
    currentIndex = index;

    // If we're playing the next file and it's preloaded, use it
    if (nextPreloadedMedia && nextPreloadedMedia.src === playlistItems[index]) {
      videoPlayer.src = nextPreloadedMedia.src;
      nextPreloadedMedia.remove();
      nextPreloadedMedia = null;
    } else {
      videoPlayer.src = playlistItems[index];
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
        })
        .catch((error) => {
          console.log("Playback failed:", error);
        });
    }

    // Reset subtitle tracks when changing files
    while (videoPlayer.textTracks.length > 0) {
      videoPlayer.removeChild(videoPlayer.textTracks[0]);
    }
    currentSubtitleTrack = null;
    updateSubtitleButtonState();
    updateSubtitleList();

    updatePlaylistUI();
  }
}

function togglePlayPause() {
  if (videoPlayer.paused) {
    videoPlayer.play();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } else {
    videoPlayer.pause();
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
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
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    videoPlayer.requestFullscreen();
  }
}

function toggleMute() {
  videoPlayer.muted = !videoPlayer.muted;
  muteBtn.innerHTML = videoPlayer.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
  volumeSlider.value = videoPlayer.muted ? 0 : videoPlayer.volume * 100;
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
    }
  } else if (currentIndex > index) {
    currentIndex--;
  }
  updatePlaylistUI();
}

// Preload the next media file
function preloadNextMedia() {
  if (playlistItems.length <= 1) return;

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

  nextPreloadedMedia = document.createElement("video");
  nextPreloadedMedia.preload = "auto";
  nextPreloadedMedia.src = playlistItems[nextIndex];
  nextPreloadedMedia.load();
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
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      await videoPlayer.requestPictureInPicture();
    }
  } catch (error) {
    console.error("PiP error:", error);
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
window.addEventListener("resize", () => {
  if (
    window.outerWidth === screen.availWidth &&
    window.outerHeight === screen.availHeight
  ) {
    maximizeBtn.innerHTML = '<i class="fas fa-clone"></i>';
  } else {
    maximizeBtn.innerHTML = '<i class="fas fa-square"></i>';
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
    addToPlaylist(result[0]);
    toggleWelcomeScreen(false);
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
  files.forEach((file) => {
    if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
      addToPlaylist(file.path);
      toggleWelcomeScreen(false);
    }
  });
});

// Subtitle functionality
subtitleBtn.addEventListener("click", toggleSubtitleMenu);
closeSubtitleMenu.addEventListener("click", closeSubtitleMenuHandler);
loadSubtitleBtn.addEventListener("click", loadExternalSubtitle);

// Close subtitle menu when clicking outside
document.addEventListener("click", (e) => {
  if (
    isSubtitleMenuOpen &&
    !subtitleMenu.contains(e.target) &&
    !subtitleBtn.contains(e.target)
  ) {
    closeSubtitleMenuHandler();
  }
});

function toggleSubtitleMenu() {
  isSubtitleMenuOpen = !isSubtitleMenuOpen;
  subtitleMenu.classList.toggle("show");
}

function closeSubtitleMenuHandler() {
  isSubtitleMenuOpen = false;
  subtitleMenu.classList.remove("show");
}

function toggleSubtitles() {
  const tracks = videoPlayer.textTracks;
  if (tracks.length > 0) {
    const track = tracks[0];
    track.mode = track.mode === "showing" ? "hidden" : "showing";
    updateSubtitleButtonState();
  }
}

function updateSubtitleButtonState() {
  const tracks = videoPlayer.textTracks;
  const hasActiveTrack = Array.from(tracks).some(
    (track) => track.mode === "showing"
  );
  subtitleBtn.classList.toggle("active", hasActiveTrack);
}

async function loadExternalSubtitle() {
  try {
    const result = await ipcRenderer.invoke("select-file", {
      filters: [
        { name: "Subtitle Files", extensions: ["srt", "vtt", "ass", "ssa"] },
      ],
    });

    if (result && result.length > 0) {
      const filePath = result[0];
      const fileName = filePath.split(/[/\\]/).pop();

      // Convert SRT to VTT if needed
      if (filePath.toLowerCase().endsWith(".srt")) {
        const srt2vtt = require("srt-to-vtt");
        const fs = require("fs");
        const stream = fs
          .createReadStream(filePath)
          .pipe(srt2vtt())
          .pipe(fs.createWriteStream(filePath + ".vtt"));

        stream.on("finish", () => {
          addSubtitleTrack(filePath + ".vtt", fileName);
        });
      } else {
        addSubtitleTrack(filePath, fileName);
      }
    }
  } catch (error) {
    console.error("Error loading subtitle:", error);
  }
}

function addSubtitleTrack(filePath, label) {
  // Remove existing tracks
  while (videoPlayer.textTracks.length > 0) {
    videoPlayer.removeChild(videoPlayer.textTracks[0]);
  }

  const track = document.createElement("track");
  track.kind = "subtitles";
  track.label = label;
  track.srclang = "en"; // Default to English
  track.src = filePath;
  track.default = true;

  videoPlayer.appendChild(track);
  track.addEventListener("load", () => {
    track.mode = "showing";
    updateSubtitleButtonState();
    updateSubtitleList();
  });
}

function updateSubtitleList() {
  subtitleList.innerHTML = "";

  // Add "Off" option
  const offItem = document.createElement("div");
  offItem.className = "subtitle-item";
  offItem.innerHTML = `
    <label>
      <input type="radio" name="subtitle" value="off" ${
        !currentSubtitleTrack ? "checked" : ""
      }>
      Off
    </label>
  `;
  subtitleList.appendChild(offItem);

  // Add available tracks
  Array.from(videoPlayer.textTracks).forEach((track, index) => {
    const item = document.createElement("div");
    item.className = "subtitle-item";
    item.innerHTML = `
      <label>
        <input type="radio" name="subtitle" value="${index}" ${
      track.mode === "showing" ? "checked" : ""
    }>
        ${track.label || `Track ${index + 1}`}
      </label>
    `;
    subtitleList.appendChild(item);
  });

  // Add event listeners to radio buttons
  const radioButtons = subtitleList.querySelectorAll('input[type="radio"]');
  radioButtons.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const tracks = videoPlayer.textTracks;
      Array.from(tracks).forEach((track) => {
        track.mode = "hidden";
      });

      if (e.target.value !== "off" && tracks[e.target.value]) {
        tracks[e.target.value].mode = "showing";
        currentSubtitleTrack = tracks[e.target.value];
      } else {
        currentSubtitleTrack = null;
      }

      updateSubtitleButtonState();
    });
  });
}

// Update main.js to handle subtitle file selection
ipcRenderer.handle("select-file", async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: options.filters || [
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
