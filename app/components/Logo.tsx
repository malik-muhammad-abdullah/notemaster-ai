"use client";

import { FC } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`font-bold ${sizeClasses[size]} ${className}`}>
      <span className="text-blue-600">Note</span>
      <span className="text-purple-600">Master</span>
      <span className="text-blue-400 ml-1">AI</span>
    </div>
  );
};

export default Logo; 