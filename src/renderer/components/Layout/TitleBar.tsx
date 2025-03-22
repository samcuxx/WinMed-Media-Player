import React from 'react';
import { TitleBarProps } from '../../types/types';
import './TitleBar.css';
import MinimizeIcon from '../Icons/MinimizeIcon';
import MaximizeIcon from '../Icons/MaximizeIcon';
import CloseIcon from '../Icons/CloseIcon';
import WinMedLogo from '../Icons/logo.png';

const TitleBar: React.FC<TitleBarProps> = ({
  onMinimize,
  onMaximize,
  onClose,
}) => {
  return (
    <div className="title-bar">
      <div className="title-bar-drag-area">
        <div className="app-title">
          <img src={WinMedLogo} alt="WinMed Logo" width={16} height={16} />
          <span>WinMed Player</span>
        </div>
      </div>
      <div className="window-controls">
        <button
          onClick={onMinimize}
          className="window-control-btn"
          title="Minimize"
          type="button"
        >
          <MinimizeIcon size={12} color="#fff" />
        </button>
        <button
          onClick={onMaximize}
          className="window-control-btn"
          title="Maximize"
          type="button"
        >
          <MaximizeIcon size={12} color="#fff" />
        </button>
        <button
          onClick={onClose}
          className="window-control-btn close-btn"
          title="Close"
          type="button"
        >
          <CloseIcon size={12} color="#fff" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
