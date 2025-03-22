import { v4 as uuidv4 } from 'uuid';
import React, { useState, useCallback } from 'react';
import TitleBar from './components/Layout/TitleBar';
import Playlist from './components/Playlist/Playlist';
import MediaPlayer from './components/MediaPlayer/MediaPlayer';
import Controls from './components/Controls/Controls';
import { MediaItem } from './types/types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './App.css';

const SEEK_TIME = 5; // seconds
const VOLUME_STEP = 5; // percentage

function App(): React.ReactElement {
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [currentItem, setCurrentItem] = useState<MediaItem>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [showPlaylist, setShowPlaylist] = useState(false);

  const handleAddFiles = useCallback(
    (files: File[]) => {
      const newItems: MediaItem[] = files.map((file) => ({
        id: uuidv4(),
        name: file.name,
        path: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'audio',
      }));

      setPlaylist((prev) => [...prev, ...newItems]);
      if (!currentItem) {
        setCurrentItem(newItems[0]);
        setIsPlaying(true);
      }
    },
    [currentItem],
  );

  const handleRemoveItem = useCallback(
    (id: string) => {
      setPlaylist((prev) => prev.filter((item) => item.id !== id));
      if (currentItem?.id === id) {
        const nextItem = playlist.find((item) => item.id !== id);
        setCurrentItem(nextItem);
      }
    },
    [currentItem, playlist],
  );

  const handleItemSelect = useCallback((item: MediaItem) => {
    setCurrentItem(item);
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(
    (time: number, totalDuration: number) => {
      setCurrentTime(time);
      setDuration(totalDuration);
    },
    [],
  );

  const handleEnded = useCallback(() => {
    if (repeatMode === 'one') {
      setCurrentTime(0);
      setIsPlaying(true);
    } else if (repeatMode === 'all' || playlist.length > 1) {
      const currentIndex = playlist.findIndex(
        (item) => item.id === currentItem?.id,
      );
      const nextIndex = (currentIndex + 1) % playlist.length;
      setCurrentItem(playlist[nextIndex]);
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [repeatMode, playlist, currentItem]);

  const handleNext = useCallback(() => {
    if (playlist.length <= 1) return;
    const currentIndex = playlist.findIndex(
      (item) => item.id === currentItem?.id,
    );
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentItem(playlist[nextIndex]);
    setCurrentTime(0);
  }, [playlist, currentItem]);

  const handlePrevious = useCallback(() => {
    if (playlist.length <= 1) return;
    const currentIndex = playlist.findIndex(
      (item) => item.id === currentItem?.id,
    );
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentItem(playlist[prevIndex]);
    setCurrentTime(0);
  }, [playlist, currentItem]);

  const handleShuffle = useCallback(() => {
    setPlaylist((prev) => {
      const shuffled = [...prev].sort(() => Math.random() - 0.5);
      return shuffled;
    });
  }, []);

  const handleSeekForward = useCallback(() => {
    setCurrentTime((prev) => Math.min(prev + SEEK_TIME, duration));
  }, [duration]);

  const handleSeekBackward = useCallback(() => {
    setCurrentTime((prev) => Math.max(prev - SEEK_TIME, 0));
  }, []);

  const handleVolumeUp = useCallback(() => {
    setVolume((prev) => Math.min(prev + VOLUME_STEP, 100));
    setIsMuted(false);
  }, []);

  const handleVolumeDown = useCallback(() => {
    setVolume((prev) => Math.max(prev - VOLUME_STEP, 0));
    setIsMuted(false);
  }, []);

  useKeyboardShortcuts({
    onPlayPause: handlePlayPause,
    onSeekForward: handleSeekForward,
    onSeekBackward: handleSeekBackward,
    onVolumeUp: handleVolumeUp,
    onVolumeDown: handleVolumeDown,
    onToggleFullscreen: () => setIsFullscreen(!isFullscreen),
    onToggleMute: () => setIsMuted(!isMuted),
    onTogglePiP: () => setIsPiPActive(!isPiPActive),
  });

  const handleWindowControls = {
    minimize: () => window.electron.ipcRenderer.sendMessage('minimize-window'),
    maximize: () => window.electron.ipcRenderer.sendMessage('maximize-window'),
    close: () => window.electron.ipcRenderer.sendMessage('close-window'),
  };

  return (
    <div className="app">
      <TitleBar
        onMinimize={handleWindowControls.minimize}
        onMaximize={handleWindowControls.maximize}
        onClose={handleWindowControls.close}
      />

      <div className={`container ${!showPlaylist ? 'hide-playlist' : ''}`}>
        <Playlist
          items={playlist}
          currentItem={currentItem}
          onItemSelect={handleItemSelect}
          onAddFile={() => document.getElementById('fileInput')?.click()}
          onRemoveItem={handleRemoveItem}
        />

        <div className="main-content">
          <button
            className="btn toggle-playlist"
            onClick={() => setShowPlaylist(!showPlaylist)}
            title="Toggle Playlist"
            type="button"
            aria-label="Toggle playlist visibility"
          >
            <i className="fas fa-list" />
          </button>

          <MediaPlayer
            currentItem={currentItem}
            isPlaying={isPlaying}
            isPiPActive={isPiPActive}
            isFullscreen={isFullscreen}
            currentTime={currentTime}
            volume={volume}
            isMuted={isMuted}
            repeatMode={repeatMode}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={setDuration}
            onFilesAdded={handleAddFiles}
            onPiPChange={setIsPiPActive}
            onFullscreenChange={setIsFullscreen}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onVolumeChange={setVolume}
            onMuteToggle={() => setIsMuted(!isMuted)}
            onProgressChange={setCurrentTime}
            onRepeatModeChange={() => {
              const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
              const currentIndex = modes.indexOf(repeatMode);
              setRepeatMode(modes[(currentIndex + 1) % modes.length]);
            }}
            onShuffle={handleShuffle}
            onSeekForward={handleSeekForward}
            onSeekBackward={handleSeekBackward}
            onPiPToggle={() => setIsPiPActive(!isPiPActive)}
          />

          <Controls
            isPlaying={isPlaying}
            volume={volume}
            progress={currentTime}
            duration={duration}
            currentTime={currentTime}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            isPiPActive={isPiPActive}
            repeatMode={repeatMode}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onVolumeChange={setVolume}
            onMuteToggle={() => setIsMuted(!isMuted)}
            onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
            onPiPToggle={() => setIsPiPActive(!isPiPActive)}
            onProgressChange={setCurrentTime}
            onRepeatModeChange={() => {
              const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
              const currentIndex = modes.indexOf(repeatMode);
              setRepeatMode(modes[(currentIndex + 1) % modes.length]);
            }}
            onShuffle={handleShuffle}
            onSeekForward={handleSeekForward}
            onSeekBackward={handleSeekBackward}
          />
        </div>
      </div>

      <input
        type="file"
        id="fileInput"
        multiple
        accept="video/*,audio/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) {
            handleAddFiles(Array.from(e.target.files));
          }
        }}
        aria-label="Add media files"
      />
    </div>
  );
}

export default App;
