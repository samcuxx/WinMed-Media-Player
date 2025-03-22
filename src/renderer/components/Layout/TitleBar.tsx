import React from 'react';
import { TitleBarProps } from '../../types/types';
import './TitleBar.css';

const TitleBar: React.FC<TitleBarProps> = ({
  onMinimize,
  onMaximize,
  onClose,
}) => {
  return (
    <div className="title-bar">
      <div className="title-bar-drag-area">
        <div className="app-title">
          <i className="fas fa-play-circle"></i>
          <span>WinMed Player</span>
        </div>
      </div>
      <div className="window-controls">
        <button
          onClick={onMinimize}
          className="window-control-btn"
          title="Minimize"
        >
          <i className="fas fa-minus"></i>
        </button>
        <button
          onClick={onMaximize}
          className="window-control-btn"
          title="Maximize"
        >
          <i className="fas fa-square"></i>
        </button>
        <button
          onClick={onClose}
          className="window-control-btn close-btn"
          title="Close"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
