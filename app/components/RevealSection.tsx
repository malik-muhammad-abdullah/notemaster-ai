"use client";
import { ReactNode } from "react";

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
  return (
    <div className={`reveal-delay-${delay} ${className}`}>
      {children}
    </div>
  );
} 