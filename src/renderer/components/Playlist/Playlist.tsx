import React from 'react';
import { PlaylistProps } from '../../types/types';
import './Playlist.css';
import ListIcon from '../Icons/ListIcon';
import AddIcon from '../Icons/AddIcon';

const Playlist: React.FC<PlaylistProps> = ({
  items,
  currentItem,
  onItemSelect,
  onAddFile,
}) => {
  return (
    <div className="sidebar">
      <div className="playlist-header">
        <div className="playlist-title">
          <ListIcon size={20} color="#1db954" />
          <h2>Media Playlist</h2>
        </div>
        <button
          onClick={onAddFile}
          className="add-file-btn"
          title="Add Media File"
          aria-label="Add media file"
          type="button"
        >
          <AddIcon size={20} color="#1db954" />
        </button>
      </div>
      <div className="playlist">
        {items.map((item) => (
          <div
            key={item.id}
            className={`playlist-item ${currentItem?.id === item.id ? 'active' : ''}`}
            onClick={() => onItemSelect(item)}
          >
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlist;
