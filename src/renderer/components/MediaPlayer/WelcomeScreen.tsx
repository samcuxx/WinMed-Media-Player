import React from 'react';
import './WelcomeScreen.css';
import FilmIcon from '../Icons/FilmIcon';
import FolderIcon from '../Icons/FolderIcon';

interface WelcomeScreenProps {
  onSelectFiles: () => void;
  onFilesDropped: (files: File[]) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onSelectFiles,
  onFilesDropped,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.type.startsWith('video/') || file.type.startsWith('audio/'),
    );

    if (files.length > 0) {
      onFilesDropped(files);
    }
  };

  return (
    <div
      className="welcome-screen"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="welcome-content">
        <FilmIcon size={64} color="#1db954" className="welcome-icon" />
        <h2>Welcome to WinMed Player</h2>
        <p>Drop your media files here or click to select</p>
        <button onClick={onSelectFiles} className="welcome-btn" type="button">
          <FolderIcon size={24} color="#fff" />
          Select Files
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
