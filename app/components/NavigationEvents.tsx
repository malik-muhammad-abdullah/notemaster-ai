"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Create a custom event for navigation start
    const handleRouteChangeStart = () => {
      setIsNavigating(true);
    };

    // Create a custom event for navigation complete
    const handleRouteChangeComplete = () => {
      setIsNavigating(false);
    };

    // Add the event listeners to window
    window.addEventListener("navigation-start", handleRouteChangeStart);
    window.addEventListener("navigation-complete", handleRouteChangeComplete);

    // Clean up
    return () => {
      window.removeEventListener("navigation-start", handleRouteChangeStart);
      window.removeEventListener("navigation-complete", handleRouteChangeComplete);
    };
  }, []);

  // When pathname or searchParams change, it means navigation completed
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div className="h-full bg-blue-500 animate-loading-bar"></div>
    </div>
  );
} 