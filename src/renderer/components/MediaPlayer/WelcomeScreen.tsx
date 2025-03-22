import React from 'react';
import './WelcomeScreen.css';

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
        <i className="fas fa-film welcome-icon"></i>
        <h2>Welcome to WinMed Player</h2>
        <p>Drop your media files here or click to select</p>
        <button onClick={onSelectFiles} className="welcome-btn">
          <i className="fas fa-folder-open"></i>
          Select Files
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
