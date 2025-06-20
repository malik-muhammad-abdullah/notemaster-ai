"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [previousPathname, setPreviousPathname] = useState(pathname);

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
      window.removeEventListener(
        "navigation-complete",
        handleRouteChangeComplete
      );
    };
  }, []);

  // When pathname changes, update the previous pathname
  useEffect(() => {
    setPreviousPathname(pathname);
  }, [pathname]);

  // When pathname changes (but not just searchParams), it means we're navigating to a new page
  useEffect(() => {
    setIsNavigating(false);
    // Only reset scroll if we're navigating to a completely different page
    if (previousPathname && pathname !== previousPathname) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div className="h-full bg-blue-500 animate-loading-bar"></div>
    </div>
  );
}
