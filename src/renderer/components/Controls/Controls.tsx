import React, { useRef } from 'react';
import { ControlsProps } from '../../types/types';
import './Controls.css';

const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  volume,
  progress,
  duration,
  currentTime,
  isMuted,
  isFullscreen,
  repeatMode,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onMuteToggle,
  onFullscreenToggle,
  onProgressChange,
  onRepeatModeChange,
  onShuffle,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

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

    // Update preview time display if needed
    const preview = document.getElementById('time-preview');
    if (preview) {
      preview.textContent = formatTime(previewTime);
      preview.style.left = `${hoverPosition * 100}%`;
    }
  };

  return (
    <div className="controls">
      <div className="progress-container">
        <div
          ref={progressBarRef}
          className="progress-bar"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
        >
          <div
            className="progress"
            style={{ width: `${(progress / duration) * 100}%` }}
          />
          <div className="progress-hover-area" />
          <div id="time-preview" className="time-preview">
            {formatTime(currentTime)}
          </div>
        </div>
        <div className="time-display">
          <span>{formatTime(currentTime)}</span> /{' '}
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="control-buttons">
        <div className="playback-controls">
          <button onClick={onShuffle} className="btn" title="Shuffle">
            <i className="fas fa-random"></i>
          </button>
          <button onClick={onPrevious} className="btn" title="Previous Track">
            <i className="fas fa-backward"></i>
          </button>
          <button onClick={onPlayPause} className="btn" title="Play/Pause">
            <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
          </button>
          <button onClick={onNext} className="btn" title="Next Track">
            <i className="fas fa-forward"></i>
          </button>
          <button
            onClick={onRepeatModeChange}
            className={`btn ${repeatMode !== 'none' ? repeatMode : ''}`}
            title="Repeat"
          >
            <i className="fas fa-redo"></i>
          </button>
        </div>

        <div className="secondary-controls">
          <div className="volume-control">
            <button onClick={onMuteToggle} className="btn" title="Mute">
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
            onClick={onFullscreenToggle}
            className="btn"
            title="Fullscreen"
          >
            <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;
