import React from 'react';

interface ShuffleIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const ShuffleIcon: React.FC<ShuffleIconProps> = ({
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
    <path
      d="M16 3H21V8M21 3L16 8M8 3H3V8M3 3L8 8M21 16V21H16M21 21L16 16M3 16V21H8M3 21L8 16"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ShuffleIcon;
