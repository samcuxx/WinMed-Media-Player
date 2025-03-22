import React from 'react';

interface FilmIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const FilmIcon: React.FC<FilmIconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="2"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M7 2V22M17 2V22M2 12H22M2 7H7M2 17H7M17 17H22M17 7H22"
      stroke={color}
      strokeWidth="2"
    />
  </svg>
);

export default FilmIcon;
