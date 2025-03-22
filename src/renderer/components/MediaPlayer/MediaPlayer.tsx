import React, { useRef, useEffect, useCallback } from 'react';
import { MediaPlayerProps } from '../../types/types';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import WelcomeScreen from './WelcomeScreen';
import FullscreenControls from './FullscreenControls';
import './MediaPlayer.css';

function MediaPlayer({
  currentItem,
  isPlaying,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  onFilesAdded,
  isPiPActive,
  isFullscreen,
  onPiPChange,
  onFullscreenChange,
  currentTime,
  volume,
  isMuted,
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onMuteToggle,
  onProgressChange,
  onRepeatModeChange,
  onShuffle,
  repeatMode,
  onSeekForward,
  onSeekBackward,
}: MediaPlayerProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSeekingRef = useRef(false);

  const { isDragging, dragHandlers } = useDragAndDrop({
    onFilesDropped: onFilesAdded,
  });

  // Handle volume changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // Unified video control effect
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Handle source changes
    if (currentItem) {
      if (video.src !== currentItem.path) {
        isSeekingRef.current = true; // Prevent play attempts during source change
        video.src = currentItem.path;
        video.currentTime = 0;
        video.load();
        onTimeUpdate(0, 0); // Reset time display immediately

        const handleLoadedMetadata = () => {
          isSeekingRef.current = false;
          onTimeUpdate(0, video.duration);
          if (isPlaying) {
            setTimeout(() => {
              video.play().catch((error) => {
                console.error('Error playing after source change:', error);
              });
            }, 0);
          }
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
      }
    }

    // Handle seeking
    if (Math.abs(video.currentTime - currentTime) > 0.1) {
      isSeekingRef.current = true;
      video.currentTime = currentTime;
    }

    // Handle play/pause state
    const updatePlayState = async () => {
      try {
        if (isPlaying && video.paused) {
          await video.play();
        } else if (!isPlaying && !video.paused) {
          video.pause();
        }
      } catch (error) {
        console.error('Error updating video play state:', error);
      }
    };

    // Only update play state if not seeking
    if (!isSeekingRef.current) {
      updatePlayState();
    }

    // Handle seeking completion
    const handleSeeked = () => {
      isSeekingRef.current = false;
      if (isPlaying) {
        video.play().catch((error) => {
          console.error('Error playing after seek:', error);
        });
      }
    };

    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [currentItem, currentTime, isPlaying, onTimeUpdate]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime, videoRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      onLoadedMetadata(videoRef.current.duration);
    }
  };

  // Picture-in-Picture support
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePiPChange = () => {
      onPiPChange(document.pictureInPictureElement === video);
    };

    video.addEventListener('enterpictureinpicture', handlePiPChange);
    video.addEventListener('leavepictureinpicture', handlePiPChange);

    return () => {
      video.removeEventListener('enterpictureinpicture', handlePiPChange);
      video.removeEventListener('leavepictureinpicture', handlePiPChange);
    };
  }, [onPiPChange]);

  // Fullscreen support
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleFullscreenChange = () => {
      onFullscreenChange(document.fullscreenElement === container);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onFullscreenChange]);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error('Failed to toggle Picture-in-Picture mode:', error);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen mode:', error);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`media-container ${isDragging ? 'drag-over' : ''} ${
        isFullscreen ? 'fullscreen' : ''
      }`}
      {...dragHandlers}
    >
      <video
        ref={videoRef}
        id="videoPlayer"
        className={currentItem ? 'active' : ''}
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={onPlayPause}
      >
        <track kind="captions" />
      </video>
      {!currentItem && (
        <WelcomeScreen
          onSelectFiles={() => document.getElementById('fileInput')?.click()}
          onFilesDropped={onFilesAdded}
        />
      )}
      {isFullscreen && currentItem && (
        <FullscreenControls
          isPlaying={isPlaying}
          volume={volume}
          progress={currentTime}
          duration={videoRef.current?.duration || 0}
          currentTime={currentTime}
          isMuted={isMuted}
          isFullscreen={isFullscreen}
          isPiPActive={isPiPActive}
          repeatMode={repeatMode}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onPrevious={onPrevious}
          onVolumeChange={onVolumeChange}
          onMuteToggle={onMuteToggle}
          onFullscreenToggle={toggleFullscreen}
          onProgressChange={onProgressChange}
          onRepeatModeChange={onRepeatModeChange}
          onShuffle={onShuffle}
          onPiPToggle={togglePiP}
          onSeekForward={onSeekForward}
          onSeekBackward={onSeekBackward}
        />
      )}
    </div>
  );
}

export default MediaPlayer;
