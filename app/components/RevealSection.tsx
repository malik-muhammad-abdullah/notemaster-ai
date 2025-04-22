"use client";
import { ReactNode, useEffect, useState } from "react";

interface RevealSectionProps {
  children: ReactNode;
  delay?: "100" | "200" | "300";
  className?: string;
}

export default function RevealSection({ 
  children, 
  delay = "100", 
  className = "" 
}: RevealSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`
        transform transition-all duration-700 
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} 
        reveal-delay-${delay} 
        ${className}
      `}
    >
      {children}
    </div>
  );
} 