"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const { status, data: session } = useSession();

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            NoteMaster <span className="text-blue-600">AI</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Your AI-powered study companion. Upload your study materials and leverage AI to understand, summarize, and learn faster.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            {status === "authenticated" ? (
              <div className="rounded-md shadow">
                <Link
                  href="/chat"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="rounded-md shadow">
                <Link
                  href="/api/auth/signin"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Sign In to Begin
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            AI-Powered Features
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link key={feature.path} href={feature.path}>
                <div className="h-full bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <div className="px-6 py-8 flex-grow">
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                  <div className="px-6 py-2 bg-gray-50 dark:bg-gray-700">
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Try it now →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* User Status */}
        <div className="mt-12 text-center">
          <div className="inline-block px-6 py-3 bg-white dark:bg-gray-800 rounded-lg shadow">
            {status === "authenticated" ? (
              <div className="flex items-center space-x-2">
                {session.user?.image && (
                  <div className="rounded-full overflow-hidden w-8 h-8">
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={32}
                      height={32}
                    />
                  </div>
                )}
                <span className="text-gray-700 dark:text-gray-300">
                  Signed in as {session.user?.name || session.user?.email}
                </span>
                <Link
                  href="/api/auth/signout"
                  className="ml-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign Out
                </Link>
              </div>
            ) : status === "unauthenticated" ? (
              <div>
                <span className="text-gray-700 dark:text-gray-300">
                  You are not signed in.
                </span>
                <Link
                  href="/api/auth/signin"
                  className="ml-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="text-gray-700 dark:text-gray-300">Loading...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
