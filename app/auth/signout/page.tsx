"use client";

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/app/components/Logo';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function SignOut() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setLoading(true);
    await signOut({ callbackUrl: '/' });
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="h-full flex items-center justify-center bg-chat-pattern p-4 overflow-hidden">
      <div className="w-full max-w-md animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01] animate-scaleUp">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-400"></div>
          
          <div className="px-8 pt-8 pb-6 subpixel-antialiased">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-1">
                <Logo size="lg" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 tracking-normal">The Ultimate Productivity Platform for Students</p>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 tracking-tight">Sign Out</h1>
              <p className="text-gray-600 dark:text-gray-300 tracking-normal mb-4">Are you sure you want to sign out?</p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-red-50 dark:bg-gray-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                  className="w-12 h-12 text-red-500 dark:text-red-400" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="flex items-center justify-center space-x-3 w-full py-3.5 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all shadow-sm hover:shadow-md group cursor-pointer"
              >
                {loading && <LoadingSpinner size="sm" className="mr-2" />}
                <span className="font-medium">
                  {loading ? 'Signing out...' : 'Sign Out'}
                </span>
              </button>
              
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex items-center justify-center space-x-3 w-full py-3.5 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm hover:shadow-md group cursor-pointer"
              >
                <span className="font-medium">Cancel</span>
              </button>
            </div>
          </div>

          <div className="px-8 py-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 subpixel-antialiased">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 tracking-normal">
              <p>You'll need to sign in again to access your account</p>
              <div className="mt-4 flex justify-center">
                <div className="w-24 h-1 rounded-full bg-gradient-to-r from-red-300 to-orange-300 opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 subpixel-antialiased tracking-normal">
            <span>© {new Date().getFullYear()} NoteMaster AI. All rights reserved.</span>
          </div>
        </div>
      </div>
    </div>
  );
} 