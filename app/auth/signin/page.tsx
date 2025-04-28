"use client";

import { useState, useEffect } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import Logo from '@/app/components/Logo';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function SignIn() {
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const setupProviders = async () => {
      setProvidersLoading(true);
      try {
        const providers = await getProviders();
        setProviders(providers);
      } catch (error) {
        console.error("Failed to load providers:", error);
      } finally {
        setProvidersLoading(false);
      }
    };
    setupProviders();
  }, []);

  const handleSignIn = async (providerId: string) => {
    setLoading(true);
    await signIn(providerId, { callbackUrl: '/' });
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
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 tracking-tight">Welcome</h1>
              <p className="text-gray-600 dark:text-gray-300 tracking-normal mb-4">Sign in to your account</p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full bg-blue-50 dark:bg-gray-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                  className="w-16 h-16 text-blue-500 dark:text-blue-400" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              {providersLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="md" className="text-blue-500" />
                  <span className="ml-3 text-gray-600 dark:text-gray-300">Loading sign-in options...</span>
                </div>
              ) : providers && Object.values(providers).length > 0 ? (
                Object.values(providers).map((provider: any) => (
                  <button
                    key={provider.id}
                    onClick={() => handleSignIn(provider.id)}
                    disabled={loading}
                    className="flex items-center justify-center space-x-3 w-full py-3.5 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm hover:shadow-md group cursor-pointer"
                  >
                    {provider.id === 'google' && (
                      <FcGoogle className="text-xl group-hover:scale-110 transition-transform" />
                    )}
                    {loading && <LoadingSpinner size="sm" className="mr-2" />}
                    <span className="font-medium">
                      {loading ? 'Signing in...' : `Continue with ${provider.name}`}
                    </span>
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-600 dark:text-gray-300 py-4">
                  No sign-in providers configured
                </div>
              )}
            </div>
          </div>

          <div className="px-8 py-5 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 subpixel-antialiased">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 tracking-normal">
              <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
              <div className="mt-4 flex justify-center">
                <div className="w-24 h-1 rounded-full bg-gradient-to-r from-blue-300 to-purple-300 opacity-50"></div>
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