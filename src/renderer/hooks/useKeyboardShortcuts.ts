import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onPlayPause: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onTogglePiP: () => void;
}

export const useKeyboardShortcuts = ({
  onPlayPause,
  onSeekForward,
  onSeekBackward,
  onVolumeUp,
  onVolumeDown,
  onToggleFullscreen,
  onToggleMute,
  onTogglePiP,
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case 'arrowright':
          e.preventDefault();
          onSeekForward();
          break;
        case 'arrowleft':
          e.preventDefault();
          onSeekBackward();
          break;
        case 'arrowup':
          e.preventDefault();
          onVolumeUp();
          break;
        case 'arrowdown':
          e.preventDefault();
          onVolumeDown();
          break;
        case 'f':
          e.preventDefault();
          onToggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          onToggleMute();
          break;
        case 'p':
          if (e.altKey) {
            e.preventDefault();
            onTogglePiP();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    onPlayPause,
    onSeekForward,
    onSeekBackward,
    onVolumeUp,
    onVolumeDown,
    onToggleFullscreen,
    onToggleMute,
    onTogglePiP,
  ]);
};
