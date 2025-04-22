"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

// Create a context for the loading state
interface LoadingContextType {
  isLoading: boolean;
  showLoadingOverlay: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

  useEffect(() => {
    // When status is no longer 'loading', trigger the transition
    if (status !== "loading") {
      // First, update the actual loading state
      setIsLoading(false);
      
      // Then, after a short delay, hide the overlay completely
      const timer = setTimeout(() => {
        setShowLoadingOverlay(false);
      }, 350); // Slightly longer than the transition duration
      
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoadingOverlay }}>
      {showLoadingOverlay && (
        <div 
          className={`fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center transition-opacity duration-300 ease-in-out ${
            isLoading ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="text-center">
            <div className="relative inline-flex">
              <div className="w-20 h-20 rounded-full border-8 border-gray-200 dark:border-gray-700"></div>
              <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-8 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-6 text-xl font-medium text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
} 