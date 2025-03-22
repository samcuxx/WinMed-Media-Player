import React from 'react';

interface NextIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const NextIcon: React.FC<NextIconProps> = ({
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
      d="M5 5V19M19 12L5 19V5L19 12Z"
      fill={color}
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default NextIcon;
