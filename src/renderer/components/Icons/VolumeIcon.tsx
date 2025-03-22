import React from 'react';

interface VolumeIconProps {
  size?: number;
  color?: string;
  className?: string;
  isMuted?: boolean;
}

const VolumeIcon: React.FC<VolumeIconProps> = ({
  size = 24,
  color = 'currentColor',
  className = '',
  isMuted = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {isMuted ? (
      <path
        d="M11 5L6 9H2V15H6L11 19V5Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="M11 5L6 9H2V15H6L11 19V5Z"
        fill={color}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

export default VolumeIcon;
