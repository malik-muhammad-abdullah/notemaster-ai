"use client";
import { useState } from "react";
import ChatLayout from "@/app/components/ChatLayout";

export default function ChatPage() {
  // Development flag to test skeleton loading state
  const [showTestOptions, setShowTestOptions] = useState(false);
  
  return (
    <>
      <ChatLayout 
        title="NoteMaster AI Chat" 
        apiEndpoint="/chat"
      />
      
      {/* Development-only test controls */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 right-4 z-50">
          <button 
            onClick={() => setShowTestOptions(!showTestOptions)}
            className="bg-gray-800 text-white rounded-full p-2 shadow-lg"
            title="Developer: Test UI"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
          
          {showTestOptions && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 mt-2 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Test UI States</p>
              <button 
                onClick={() => {
                  // This forces a refresh which will trigger the skeleton loader
                  window.location.href = '/chat?test=skeleton';
                }}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Test Skeleton
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
} 