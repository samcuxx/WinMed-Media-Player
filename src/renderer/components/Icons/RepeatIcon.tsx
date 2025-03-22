import React from 'react';

interface RepeatIconProps {
  size?: number;
  color?: string;
  className?: string;
  mode?: 'none' | 'one' | 'all';
}

const RepeatIcon: React.FC<RepeatIconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
  mode = 'none',
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
      d="M17 1L21 5M21 5L17 9M21 5H7C5.89543 5 5 5.89543 5 7V10M7 23L3 19M3 19L7 15M3 19H17C18.1046 19 19 18.1046 19 17V14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {mode === 'one' && (
      <path
        d="M9 12H15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

export default RepeatIcon;
