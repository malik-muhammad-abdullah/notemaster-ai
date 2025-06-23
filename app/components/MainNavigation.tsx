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
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Get current page title for breadcrumb
  const getPageTitle = () => {
    if (pathname === "/") return null;
    if (pathname.startsWith("/chat")) return "Chat";
    if (pathname.startsWith("/study-guide")) return "Study Guide";
    if (pathname.startsWith("/summarization")) return "Summarization";
    if (pathname.startsWith("/quiz-generation")) return "Quiz Generation";
    if (pathname.startsWith("/real-time-text-tutoring")) return "Text Tutoring";
    if (pathname.startsWith("/file-upload")) return "File Upload";
    if (pathname.startsWith("/coding-assistant")) return "Coding Assistant";
    if (pathname.startsWith("/tasks")) return "Task Management";
    return null;
  };

  const currentPageTitle = getPageTitle();

  // Handle scroll for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }

      // Close mobile menu when clicking outside, but not when clicking the hamburger button
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(
          'button[aria-controls="mobile-menu"]'
        )
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
      document.body.classList.add("sidebar-open");
      // Add click handler to close sidebar when clicking outside
      const handleOverlayClick = (event: MouseEvent) => {
        // Check if the click is on the overlay (::after element)
        // by checking if the click is not on a sidebar element
        if (
          sidebarOpen &&
          !(event.target as HTMLElement).closest(".sidebar") &&
          !(event.target as HTMLElement).closest('button[aria-expanded="true"]')
        ) {
          setSidebarOpen(false);
        }
      };

      document.addEventListener("click", handleOverlayClick);
      return () => {
        document.body.classList.remove("sidebar-open");
        document.removeEventListener("click", handleOverlayClick);
      };
    } else {
      document.body.classList.remove("sidebar-open");
    }
  }, [sidebarOpen]);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-500 ${
          scrolled
            ? "bg-gray-900/95 backdrop-blur-xl border-b border-indigo-500/30 shadow-[0_4px_15px_-1px_rgba(79,70,229,0.2)]"
            : "bg-gray-900/90 backdrop-blur-md"
        }`}
      >
        {/* Animated gradient border */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-70 animate-pulse"></div>

        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Sidebar toggle button */}
              <button
                type="button"
                className="group p-2 rounded-lg text-gray-400 hover:text-indigo-400 focus:outline-none transition-all duration-300 relative overflow-hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-expanded={sidebarOpen ? "true" : "false"}
              >
                <span className="absolute inset-0 bg-indigo-900/20 rounded-lg group-hover:bg-indigo-900/30 transform scale-0 group-hover:scale-100 transition-transform duration-300"></span>
                <span className="relative">
                  <svg
                    className="h-6 w-6 group-hover:scale-110 transition-transform duration-300"
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
                </span>
              </button>

              <div className="flex-shrink-0 ml-2">
                <AppLink
                  href="/"
                  className="group flex items-center transition-all duration-500"
                >
                  <div className="relative overflow-hidden font-extrabold text-xl tracking-tight">
                    <span className="text-white mr-0.5">NoteMaster</span>
                    <span className="text-indigo-300 group-hover:text-indigo-200 transition-colors duration-300">
                      AI
                    </span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></span>
                  </div>
                </AppLink>
              </div>

              {/* Page title breadcrumb */}
              {currentPageTitle && (
                <div className="flex items-center ml-3 sm:ml-4">
                  <svg
                    className="h-5 w-5 text-indigo-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-200 text-sm sm:text-base font-medium ml-1 tracking-wide">
                    {currentPageTitle}
                  </span>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {/* Task Management Link */}
              <AppLink
                href="/tasks"
                className={`group px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  pathname.startsWith("/tasks")
                    ? "bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/50"
                    : "text-gray-300 hover:text-indigo-400 hover:bg-indigo-900/30"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-300 ${
                      pathname.startsWith("/tasks")
                        ? "text-indigo-400"
                        : "text-gray-400 group-hover:text-indigo-400"
                    } group-hover:scale-110`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="relative">
                    Task Management
                    <span
                      className={`absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-500 transform origin-left transition-transform duration-300 ${
                        pathname.startsWith("/tasks")
                          ? "scale-x-100"
                          : "scale-x-0"
                      } group-hover:scale-x-100`}
                    ></span>
                  </span>
                </div>
              </AppLink>

              {/* User Profile Section */}
              {status === "authenticated" && session?.user ? (
                <div className="relative" ref={dropdownRef}>
                  <div
                    className="flex items-center space-x-2 cursor-pointer rounded-full hover:bg-indigo-900/30 px-3 py-2 transition-all duration-300 ease-in-out group"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    {session.user.image && (
                      <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-indigo-500/50 group-hover:ring-indigo-400 transition-all duration-300 shadow-lg shadow-indigo-500/20">
                        <Image
                          src={session.user.image}
                          alt="User profile"
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-200 whitespace-nowrap">
                      {session.user.name}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  {/* Dropdown menu with transition */}
                  <div
                    className={`absolute right-0 top-full mt-2 min-w-[240px] bg-gray-900/95 backdrop-blur-xl border border-indigo-500/20 rounded-xl shadow-[0_8px_20px_-2px_rgba(79,70,229,0.2)] py-1 z-10 transition-all duration-300 ease-in-out transform origin-top-right ${
                      dropdownOpen
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 -translate-y-4 pointer-events-none"
                    }`}
                  >
                    <div className="px-4 py-3 border-b border-indigo-500/20">
                      <p className="text-sm text-gray-400">Signed in as</p>
                      <p className="text-sm font-medium text-white break-words">
                        {session.user.email}
                      </p>
                    </div>
                    <AppLink
                      href="/api/auth/signout"
                      className="group flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-indigo-900/30 hover:text-white transition-colors duration-200"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2 text-gray-400 group-hover:text-indigo-400 transition-colors duration-200"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 5a1 1 0 00-1 1v6a1 1 0 002 0V9a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                        <path d="M12.293 6.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L13.586 9H7a1 1 0 010-2h6.586l-1.293-1.293a1 1 0 010-1.414z" />
                      </svg>
                      <span>Sign Out</span>
                    </AppLink>
                  </div>
                </div>
              ) : (
                <AppLink
                  href="/api/auth/signin"
                  className="relative group overflow-hidden px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(120,119,198,0.8)]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700"></span>
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative text-white font-semibold tracking-wide">
                    Sign In
                  </span>
                </AppLink>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              {/* Mobile menu button */}
              <button
                type="button"
                className="group inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-indigo-400 focus:outline-none transition-all duration-300 relative overflow-hidden"
                aria-controls="mobile-menu"
                aria-expanded={mobileMenuOpen ? "true" : "false"}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="absolute inset-0 bg-indigo-900/20 rounded-lg group-hover:bg-indigo-900/30 transform scale-0 group-hover:scale-100 transition-transform duration-300"></span>
                <span className="sr-only">Open main menu</span>
                <span className="relative">
                  {mobileMenuOpen ? (
                    <svg
                      className="block h-6 w-6 group-hover:scale-110 transition-transform duration-300"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="block h-6 w-6 group-hover:scale-110 transition-transform duration-300"
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
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        <div
          className={`md:hidden transition-all duration-500 ease-in-out ${
            mobileMenuOpen
              ? "max-h-96 opacity-100 border-t border-indigo-500/30"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
          id="mobile-menu"
          ref={mobileMenuRef}
        >
          <div className="px-2 pt-3 pb-4 space-y-1.5 sm:px-3 bg-gray-900/95 backdrop-blur-xl">
            {/* Mobile sidebar toggle */}
            <button
              className="group flex items-center w-full px-3 py-2.5 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden"
              onClick={() => {
                setSidebarOpen(!sidebarOpen);
                setMobileMenuOpen(false);
              }}
            >
              <span className="absolute inset-0 bg-indigo-900/20 rounded-lg group-hover:bg-indigo-900/30 transform scale-0 group-hover:scale-100 transition-transform duration-300"></span>
              <span className="relative flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-indigo-400 group-hover:scale-110 transition-transform duration-300"
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
              </span>
            </button>

            {status === "authenticated" && session?.user ? (
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-indigo-900/20">
                  {session.user.image && (
                    <div className="h-8 w-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20">
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
                    <div className="text-sm font-medium text-white">
                      {session.user.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {session.user.email}
                    </div>
                  </div>
                </div>

                <AppLink
                  href="/api/auth/signout"
                  className="group flex items-center px-3 py-2.5 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-300 w-full relative overflow-hidden"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="absolute inset-0 bg-indigo-900/20 rounded-lg group-hover:bg-indigo-900/30 transform scale-0 group-hover:scale-100 transition-transform duration-300"></span>
                  <span className="relative flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2 text-indigo-400 group-hover:scale-110 transition-transform duration-300"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 5a1 1 0 00-1 1v6a1 1 0 002 0V9a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                      <path d="M12.293 6.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L13.586 9H7a1 1 0 010-2h6.586l-1.293-1.293a1 1 0 010-1.414z" />
                    </svg>
                    Sign Out
                  </span>
                </AppLink>
              </div>
            ) : (
              <AppLink
                href="/api/auth/signin"
                className="group flex items-center px-3 py-2.5 text-white rounded-lg text-sm font-medium transition-all duration-300 w-full relative overflow-hidden"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg"></span>
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></span>
                <span className="relative flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414a1 1 0 00-.293-.707L11.414 2.414A1 1 0 0010.707 2H4a1 1 0 00-1 1zm9 5a1 1 0 00-1 1v6a1 1 0 002 0V9a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                    <path d="M7.293 6.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L8.586 9H2a1 1 0 010-2h6.586L7.293 5.707a1 1 0 010-1.414z" />
                  </svg>
                  Sign In
                </span>
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
