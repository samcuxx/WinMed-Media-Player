import React from 'react';

interface PauseIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const PauseIcon: React.FC<PauseIconProps> = ({
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
      x="6"
      y="4"
      width="4"
      height="16"
      fill={color}
      stroke={color}
      strokeWidth="2"
    />
    <rect
      x="14"
      y="4"
      width="4"
      height="16"
      fill={color}
      stroke={color}
      strokeWidth="2"
    />
  </svg>
);

export default PauseIcon;
