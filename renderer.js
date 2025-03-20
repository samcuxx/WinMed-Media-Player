const { ipcRenderer } = require("electron");

// DOM Elements
const mediaPlayer = document.getElementById("mediaPlayer");
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

// State
let playlistItems = [];
let currentIndex = -1;
let isShuffleMode = false;
let repeatMode = "none"; // none, one, all
let isDraggingProgress = false;
let nextPreloadedMedia = null;
let seekTimeout = null;

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
      mediaPlayer.currentTime -= 5; // Rewind 5 seconds
      break;
    case "ArrowRight":
      e.preventDefault();
      mediaPlayer.currentTime += 5; // Forward 5 seconds
      break;
    case "ArrowUp":
      e.preventDefault();
      mediaPlayer.volume = Math.min(1, mediaPlayer.volume + 0.1);
      volumeSlider.value = mediaPlayer.volume * 100;
      break;
    case "ArrowDown":
      e.preventDefault();
      mediaPlayer.volume = Math.max(0, mediaPlayer.volume - 0.1);
      volumeSlider.value = mediaPlayer.volume * 100;
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
    mediaPlayer.currentTime = pos * mediaPlayer.duration;
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

mediaPlayer.addEventListener("timeupdate", updateProgress);
mediaPlayer.addEventListener("loadedmetadata", updateDuration);
mediaPlayer.addEventListener("ended", playNext);

// Drag and drop support
document.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.stopPropagation();
});

document.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const files = Array.from(e.dataTransfer.files);
  files.forEach((file) => {
    if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
      addToPlaylist(file.path);
    }
  });
});

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
      mediaPlayer.src = nextPreloadedMedia.src;
      nextPreloadedMedia.remove();
      nextPreloadedMedia = null;
    } else {
      mediaPlayer.src = playlistItems[index];
    }

    // Set playback settings before playing
    mediaPlayer.preload = "auto";
    mediaPlayer.volume = volumeSlider.value / 100;

    // Play immediately and preload next
    const playPromise = mediaPlayer.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          preloadNextMedia();
        })
        .catch((error) => {
          console.log("Playback failed:", error);
        });
    }

    updatePlaylistUI();
  }
}

function togglePlayPause() {
  if (mediaPlayer.paused) {
    mediaPlayer.play();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  } else {
    mediaPlayer.pause();
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
    mediaPlayer.currentTime = 0;
    mediaPlayer.play();
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
  mediaPlayer.volume = volumeSlider.value / 100;
}

function handleProgressChange(e) {
  const rect = progressContainer.getBoundingClientRect();
  const pos = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);

  // Update visual progress immediately
  progressBar.style.width = `${pos * 100}%`;
  currentTimeDisplay.textContent = formatTime(pos * mediaPlayer.duration);

  // If not dragging, seek immediately
  if (!isDraggingProgress) {
    if (seekTimeout) {
      clearTimeout(seekTimeout);
    }
    seekTimeout = setTimeout(() => {
      mediaPlayer.currentTime = pos * mediaPlayer.duration;
    }, 0);
  }
}

function updateProgress() {
  if (!isDraggingProgress) {
    const progress = (mediaPlayer.currentTime / mediaPlayer.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentTimeDisplay.textContent = formatTime(mediaPlayer.currentTime);
  }
}

function updateDuration() {
  durationDisplay.textContent = formatTime(mediaPlayer.duration);
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
    mediaPlayer.requestFullscreen();
  }
}

function toggleMute() {
  mediaPlayer.muted = !mediaPlayer.muted;
  muteBtn.innerHTML = mediaPlayer.muted
    ? '<i class="fas fa-volume-mute"></i>'
    : '<i class="fas fa-volume-up"></i>';
  volumeSlider.value = mediaPlayer.muted ? 0 : mediaPlayer.volume * 100;
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
      mediaPlayer.src = "";
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
mediaPlayer.addEventListener("error", (e) => {
  console.error("Media loading error:", mediaPlayer.error);
  // If error occurs, try to play next file
  if (currentIndex < playlistItems.length - 1) {
    playNext();
  }
});

// Optimize playback
mediaPlayer.addEventListener("loadedmetadata", () => {
  // Set video buffer size
  if (mediaPlayer.duration > 3600) {
    // If longer than 1 hour
    mediaPlayer.preload = "auto";
  } else {
    mediaPlayer.preload = "metadata";
  }
});

// Add PiP change event listener
mediaPlayer.addEventListener("enterpictureinpicture", () => {
  pipBtn.classList.add("active");
});

mediaPlayer.addEventListener("leavepictureinpicture", () => {
  pipBtn.classList.remove("active");
});

async function togglePictureInPicture() {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      await mediaPlayer.requestPictureInPicture();
    }
  } catch (error) {
    console.error("PiP error:", error);
  }
}
