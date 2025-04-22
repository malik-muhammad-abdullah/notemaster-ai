"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import AppLink from "./components/AppLink";
import RevealSection from "./components/RevealSection";
import { useEffect, useState } from "react";

export default function Home() {
  const { status, data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  // Make sure we're fully mounted before animations start
  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      title: "AI Chat",
      description: "Chat with an AI assistant that learns from your documents",
      path: "/chat",
      icon: "💬"
    },
    {
      title: "Study Guide Generator",
      description: "Create comprehensive study guides from your materials",
      path: "/study-guide",
      icon: "📚"
    },
    {
      title: "Summarization",
      description: "Get concise summaries of your documents and research",
      path: "/summarization",
      icon: "📝"
    },
    {
      title: "Interactive Tutoring",
      description: "Get real-time explanations and assistance with course materials",
      path: "/real-time-text-tutoring",
      icon: "👩‍🏫"
    },
    {
      title: "Quiz Generator",
      description: "Create practice quizzes to test your knowledge",
      path: "/quiz-generation",
      icon: "❓"
    },
    {
      title: "Coding Assistant",
      description: "Get help with programming tasks and code explanations",
      path: "/coding-assistant",
      icon: "💻"
    }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-blue-950 ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-300 dark:bg-pink-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="px-4 py-12 sm:px-6 max-w-6xl mx-auto relative z-10">
        {/* Hero Section */}
        <RevealSection>
          <div className="text-center mb-20">
            <h1 className="text-5xl font-extrabold sm:text-6xl md:text-7xl drop-shadow-sm">
              <span className="text-gray-900 dark:text-white">NoteMaster</span> <span className="text-indigo-500 dark:text-indigo-300">AI</span>
            </h1>
            <p className="mt-5 max-w-md mx-auto text-base text-gray-600 dark:text-gray-300 sm:text-lg md:mt-7 md:text-xl md:max-w-3xl">
              Your AI-powered study companion. Upload your study materials and leverage AI to understand, summarize, and learn faster.
            </p>
            <div className="mt-8 max-w-md mx-auto flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-4 sm:space-y-0">
              {status === "authenticated" ? (
                <AppLink
                  href="/chat"
                  className="px-8 py-4 rounded-full text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Get Started
                </AppLink>
              ) : (
                <AppLink
                  href="/api/auth/signin"
                  className="px-8 py-4 rounded-full text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Sign In to Begin
                </AppLink>
              )}
              <AppLink
                href="#features"
                className="px-8 py-4 rounded-full text-base font-medium text-indigo-600 dark:text-indigo-300 bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300"
              >
                Explore Features
              </AppLink>
            </div>
          </div>
        </RevealSection>

        {/* Feature Grid */}
        <RevealSection delay="200">
          <div className="mt-16" id="features">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12 relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400">AI-Powered Features</span>
              <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 rounded-full"></span>
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <AppLink key={feature.path} href={feature.path}>
                  <div className="group h-full bg-white dark:bg-gray-800 overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
                    <div className="px-6 py-8 flex-grow relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                      <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300 ease-in-out">{feature.icon}</div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-base text-gray-500 dark:text-gray-300">
                        {feature.description}
                      </p>
                    </div>
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700">
                      <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-300 flex items-center">
                        <span>Try it now</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </AppLink>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* User Status */}
        <RevealSection delay="300">
          <div className="mt-20 text-center">
            <div className="inline-block px-8 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
              {status === "authenticated" ? (
                <div className="flex items-center space-x-3">
                  {session.user?.image && (
                    <div className="rounded-full overflow-hidden w-10 h-10 ring-2 ring-indigo-500 dark:ring-indigo-400">
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={40}
                        height={40}
                      />
                    </div>
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    Signed in as <span className="font-semibold">{session.user?.name || session.user?.email}</span>
                  </span>
                  <AppLink
                    href="/api/auth/signout"
                    className="ml-3 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors duration-300"
                  >
                    Sign Out
                  </AppLink>
                </div>
              ) : status === "unauthenticated" ? (
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700 dark:text-gray-300">
                    You are not signed in
                  </span>
                  <AppLink
                    href="/api/auth/signin"
                    className="ml-3 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors duration-300"
                  >
                    Sign In
                  </AppLink>
                </div>
              ) : (
                <div className="text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </div>
        </RevealSection>
      </div>
    </div>
  );
}
