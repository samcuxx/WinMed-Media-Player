export interface MediaItem {
  id: string;
  name: string;
  path: string;
  type: 'video' | 'audio';
}

export interface MediaPlayerProps {
  currentItem?: MediaItem;
  isPlaying: boolean;
  isPiPActive: boolean;
  isFullscreen: boolean;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'none' | 'one' | 'all';
  onEnded: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onFilesAdded: (files: File[]) => void;
  onPiPChange: (isPiPActive: boolean) => void;
  onFullscreenChange: (isFullscreen: boolean) => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onProgressChange: (time: number) => void;
  onRepeatModeChange: () => void;
  onShuffle: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
  onPiPToggle: () => void;
}

export interface PlaylistProps {
  items: MediaItem[];
  currentItem?: MediaItem;
  onItemSelect: (item: MediaItem) => void;
  onAddFile: () => void;
  onRemoveItem: (id: string) => void;
}

export interface ControlsProps {
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  currentTime: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isPiPActive: boolean;
  repeatMode: 'none' | 'one' | 'all';
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onFullscreenToggle: () => void;
  onPiPToggle: () => void;
  onProgressChange: (time: number) => void;
  onRepeatModeChange: () => void;
  onShuffle: () => void;
  onSeekForward: () => void;
  onSeekBackward: () => void;
}

export interface TitleBarProps {
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}
