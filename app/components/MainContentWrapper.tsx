"use client";
import { useEffect, useState, ReactNode } from "react";
import { useLoading } from "./LoadingProvider";

export default function MainContentWrapper({ children }: { children: ReactNode }) {
  const { isLoading, showLoadingOverlay } = useLoading();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // When loading is complete and overlay is gone, trigger the fade-in
    if (!isLoading && !showLoadingOverlay) {
      // Small delay to ensure the loading overlay is gone
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, showLoadingOverlay]);

  return (
    <div
      className={`${isVisible ? 'page-reveal' : 'opacity-0'} will-change-opacity will-change-transform`}
      style={{ animationPlayState: isVisible ? 'running' : 'paused' }}
    >
      {children}
    </div>
  );
} 