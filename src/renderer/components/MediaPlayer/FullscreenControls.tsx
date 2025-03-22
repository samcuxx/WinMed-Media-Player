import React, { useRef } from 'react';
import { ControlsProps } from '../../types/types';
import './FullscreenControls.css';

const FullscreenControls: React.FC<ControlsProps> = ({
  isPlaying,
  volume,
  progress,
  duration,
  currentTime,
  isMuted,
  isFullscreen,
  isPiPActive,
  repeatMode,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onPiPToggle,
  onProgressChange,
  onRepeatModeChange,
  onShuffle,
  onSeekForward,
  onSeekBackward,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !onProgressChange) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(clickPosition * duration, duration));
    onProgressChange(newTime);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverPosition = (e.clientX - rect.left) / rect.width;
    const previewTime = Math.max(
      0,
      Math.min(hoverPosition * duration, duration),
    );

    const preview = document.getElementById('fullscreen-time-preview');
    if (preview) {
      preview.textContent = formatTime(previewTime);
      preview.style.left = `${hoverPosition * 100}%`;
    }
  };

  return (
    <div className="fullscreen-controls">
      <div className="fullscreen-progress-container">
        <div
          ref={progressBarRef}
          className="fullscreen-progress-bar"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
        >
          <div
            className="fullscreen-progress"
            style={{ width: `${(progress / duration) * 100}%` }}
          />
          <div className="fullscreen-progress-hover-area" />
          <div id="fullscreen-time-preview" className="fullscreen-time-preview">
            {formatTime(currentTime)}
          </div>
        </div>
        <div className="fullscreen-time-display">
          <span>{formatTime(currentTime)}</span> /{' '}
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="fullscreen-control-buttons">
        <div className="fullscreen-playback-controls">
          <button
            onClick={onShuffle}
            className="fullscreen-btn"
            title="Shuffle"
          >
            <i className="fas fa-random"></i>
          </button>
          <button
            onClick={onPrevious}
            className="fullscreen-btn"
            title="Previous Track"
          >
            <i className="fas fa-backward"></i>
          </button>
          <button
            onClick={onPlayPause}
            className="fullscreen-btn play-pause-btn"
            title="Play/Pause"
          >
            <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
          </button>
          <button
            onClick={onNext}
            className="fullscreen-btn"
            title="Next Track"
          >
            <i className="fas fa-forward"></i>
          </button>
          <button
            onClick={onRepeatModeChange}
            className={`fullscreen-btn ${repeatMode !== 'none' ? repeatMode : ''}`}
            title="Repeat"
          >
            <i className="fas fa-redo"></i>
          </button>
        </div>

        <div className="fullscreen-secondary-controls">
          <div className="fullscreen-volume-control">
            <button
              onClick={onMuteToggle}
              className="fullscreen-btn"
              title="Mute"
            >
              <i className={`fas fa-volume-${isMuted ? 'mute' : 'up'}`}></i>
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              title="Volume Control"
            />
          </div>
          <button
            onClick={onPiPToggle}
            className={`fullscreen-btn ${isPiPActive ? 'active' : ''}`}
            title="Picture in Picture"
          >
            <i className="fas fa-external-link-alt"></i>
          </button>
          <button
            onClick={onFullscreenToggle}
            className="fullscreen-btn"
            title="Exit Fullscreen"
          >
            <i className="fas fa-compress"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenControls;
