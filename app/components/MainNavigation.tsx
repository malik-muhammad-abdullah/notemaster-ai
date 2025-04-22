"use client";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import AppLink from "./AppLink";

export default function MainNavigation() {
  const pathname = usePathname();
  const { status, data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      
      // Close mobile menu when clicking outside, but not when clicking the hamburger button
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target as Node) && 
        !(event.target as HTMLElement).closest('button[aria-controls="mobile-menu"]')
      ) {
        setMobileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add appropriate class for sidebar open state
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open');
      // Add click handler to close sidebar when clicking outside
      const handleOverlayClick = (event: MouseEvent) => {
        // Check if the click is on the overlay (::after element)
        // by checking if the click is not on a sidebar element
        if (sidebarOpen && 
            !(event.target as HTMLElement).closest('.sidebar') && 
            !(event.target as HTMLElement).closest('button[aria-expanded="true"]')) {
          setSidebarOpen(false);
        }
      };
      
      document.addEventListener('click', handleOverlayClick);
      return () => {
        document.body.classList.remove('sidebar-open');
        document.removeEventListener('click', handleOverlayClick);
      };
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }, [sidebarOpen]);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <nav className="bg-gray-800 text-white fixed top-0 left-0 right-0 z-30">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Sidebar toggle button */}
              <button
                type="button"
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-0 mr-2 transition-colors"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-expanded={sidebarOpen ? "true" : "false"}
              >
                <span className="sr-only">Toggle files sidebar</span>
                <svg 
                  className="h-6 w-6" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
              </button>
              
              <div className="flex-shrink-0">
                <AppLink href="/">
                <span className="font-bold text-xl">NoteMaster AI</span>
                </AppLink>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                {status === "authenticated" && session?.user ? (
                  <div className="relative" ref={dropdownRef}>
                    <div 
                      className="flex items-center space-x-2 cursor-pointer rounded-md hover:bg-gray-700 px-3 py-2 transition-all duration-200 ease-in-out"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      {session.user.image && (
                        <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-600 hover:border-gray-400 transition-all duration-200">
                          <Image 
                            src={session.user.image} 
                            alt="User profile" 
                            width={32} 
                            height={32}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <span className="text-sm font-medium text-white whitespace-nowrap">
                        {session.user.name}
                      </span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-4 w-4 text-gray-300 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    
                    {/* Dropdown menu with transition */}
                    <div 
                      className={`absolute right-0 top-full mt-1 min-w-[240px] bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200 transition-all duration-200 ease-in-out transform origin-top-right ${
                        dropdownOpen 
                          ? 'opacity-100 scale-100 translate-y-0' 
                          : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                      }`}
                    >
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 break-words">{session.user.email}</p>
                      </div>
                  <AppLink
                    href="/api/auth/signout"
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 flex items-center"
                        onClick={() => setDropdownOpen(false)}
                  >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 5a1 1 0 00-1 1v6a1 1 0 002 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                          <path d="M12.293 6.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L13.586 9H7a1 1 0 010-2h6.586l-1.293-1.293a1 1 0 010-1.414z" />
                        </svg>
                    Sign Out
                  </AppLink>
                    </div>
                  </div>
                ) : (
                  <AppLink
                    href="/api/auth/signin"
                    className="text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-center"
                  >
                    Sign In
                  </AppLink>
                )}
              </div>
            </div>
            <div className="-mr-2 flex md:hidden">
              {/* Mobile menu button */}
              <button
                type="button"
                className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-0 transition-colors duration-200"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen ? "true" : "false"}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg 
                    className="block h-6 w-6" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        <div 
          className={`md:hidden transition-all duration-200 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`} 
          id="mobile-menu"
          ref={mobileMenuRef}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Mobile sidebar toggle */}
            <button
              className="flex items-center w-full px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md text-sm font-medium transition-colors duration-200"
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                setMobileMenuOpen(false);
              }}
            >
              <svg
                className="h-5 w-5 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Your Files
            </button>
            
            {status === "authenticated" && session?.user ? (
              <div className="flex flex-col">
                <div className="flex items-center space-x-2 px-3 py-2">
                  {session.user.image && (
                    <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-600">
                      <Image 
                        src={session.user.image} 
                        alt="User profile" 
                        width={32} 
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-white">{session.user.name}</div>
                    <div className="text-xs text-gray-300">{session.user.email}</div>
                  </div>
                </div>
                
                <AppLink
                  href="/api/auth/signout"
                  className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md text-sm font-medium transition-colors duration-200 w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 5a1 1 0 00-1 1v6a1 1 0 002 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    <path d="M12.293 6.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L13.586 9H7a1 1 0 010-2h6.586l-1.293-1.293a1 1 0 010-1.414z" />
                  </svg>
                  Sign Out
                </AppLink>
              </div>
            ) : (
              <AppLink
                href="/api/auth/signin"
                className="flex items-center space-x-2 px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md text-sm font-medium transition-colors duration-200 w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 5a1 1 0 00-1 1v6a1 1 0 002 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  <path d="M7.293 6.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L8.586 9H2a1 1 0 010-2h6.586L7.293 5.707a1 1 0 010-1.414z" />
                </svg>
                Sign In
              </AppLink>
            )}
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Push content down when navbar is present */}
      <div className="h-16"></div>
    </>
  );
} 