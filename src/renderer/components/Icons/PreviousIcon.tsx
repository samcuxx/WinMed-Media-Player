import React from 'react';

interface PreviousIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const PreviousIcon: React.FC<PreviousIconProps> = ({
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
      d="M19 19V5M5 12L19 5V19L5 12Z"
      fill={color}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default PreviousIcon;
