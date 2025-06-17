"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

// Custom components for markdown rendering
const MarkdownComponents: Partial<Components> = {
  h1: ({ node, ...props }: any) => (
    <h1
      className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100"
      {...props}
    />
  ),
  h2: ({ node, ...props }: any) => (
    <h2
      className="text-lg font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-200"
      {...props}
    />
  ),
  h3: ({ node, ...props }: any) => (
    <h3
      className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200"
      {...props}
    />
  ),
  p: (props: React.HTMLProps<HTMLParagraphElement>) => (
    <p className="mb-4 leading-7">{props.children}</p>
  ),
  ul: ({ node, depth = 0, ...props }: any) => (
    <ul
      className={`mb-4 ${depth === 0 ? "space-y-2" : "mt-2"} list-disc ml-${
        depth ? "8" : "4"
      }`}
      {...props}
    />
  ),
  li: ({ node, ordered, ...props }: any) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold" {...props} />
  ),
  em: ({ node, ...props }: any) => <em className="italic" {...props} />,
  code: ({ node, ...props }: any) => (
    <code
      className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded"
      {...props}
    />
  ),
  pre: ({ node, ...props }: any) => (
    <pre
      className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="pl-4 border-l-4 border-gray-200 dark:border-gray-700 italic"
      {...props}
    />
  ),
  a: ({ node, ...props }: any) => (
    <a
      className="text-blue-600 dark:text-blue-400 hover:underline"
      {...props}
    />
  ),
  hr: ({ node, ...props }: any) => (
    <hr className="my-6 border-gray-200 dark:border-gray-700" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto mb-4">
      <table
        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
        {...props}
      />
    </div>
  ),
  th: ({ node, ...props }: any) => (
    <th
      className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
      {...props}
    />
  ),
  td: ({ node, ...props }: any) => (
    <td
      className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700"
      {...props}
    />
  ),
};

interface CodeAssistant {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

const howItWorks = [
  {
    title: "Enter Your Code",
    description: "Paste your code or describe what you want to generate",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  },
  {
    title: "AI Analysis",
    description:
      "Our AI analyzes your code and provides detailed explanations or generates code based on your request",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
      </svg>
    ),
  },
  {
    title: "Detailed Response",
    description:
      "Get comprehensive explanations with examples or clean, well-documented code",
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

const LoadingAnimation = () => (
  <div className="flex flex-col items-center justify-center p-8 space-y-6">
    <div className="relative w-32 h-32">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
      <svg
        className="relative w-full h-full text-white p-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          className="animate-draw"
        />
      </svg>
    </div>
    <div className="space-y-3 text-center">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        Analyzing Your Code
      </h3>
      <div className="flex flex-col items-center space-y-2">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-bounce delay-200"></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Processing code and generating response...
        </p>
      </div>
    </div>
  </div>
);

export default function CodingAssistantPage() {
  const { data: session } = useSession();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [codeAssistants, setCodeAssistants] = useState<CodeAssistant[]>([]);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(
    null
  );
  const [loadingGeneration, setLoadingGeneration] = useState<string | null>(
    null
  );

  // Fetch code assistants on component mount
  useEffect(() => {
    if (session?.user?.email) {
      fetchCodeAssistants();
    }
  }, [session]);

  const fetchCodeAssistants = async () => {
    try {
      const response = await fetch("/api/coding-assistant/list");
      if (!response.ok) throw new Error("Failed to fetch code assistants");
      const data = await response.json();
      setCodeAssistants(data.codeAssistants);
    } catch (error) {
      console.error("Error fetching code assistants:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const response = await fetch("/api/coding-assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate response");
      }

      const data = await response.json();
      setResponse(data.content);
      await fetchCodeAssistants(); // Refresh the list
    } catch (err) {
      setError("Failed to generate response. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssistantSelect = async (assistantId: string) => {
    try {
      setLoadingGeneration(assistantId);
      const response = await fetch(
        `/api/coding-assistant/conversations/${assistantId}`
      );
      if (!response.ok) throw new Error("Failed to fetch assistant");
      const data = await response.json();
      setSelectedAssistantId(assistantId);
      setResponse(data.content);
      setCode(data.title);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error("Error fetching assistant:", error);
    } finally {
      setLoadingGeneration(null);
    }
  };

  const handleDeleteAssistant = async (
    assistantId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this code assistant?"))
      return;

    try {
      const response = await fetch(
        `/api/coding-assistant/delete/${assistantId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete assistant");
      await fetchCodeAssistants();
      if (selectedAssistantId === assistantId) {
        setSelectedAssistantId(null);
        setResponse("");
        setCode("");
      }
    } catch (error) {
      console.error("Error deleting assistant:", error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-950">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 md:top-6 md:left-6 z-50 aspect-square md:aspect-auto p-2.5 md:py-2.5 md:px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 rounded-lg shadow-lg transition-all duration-200 text-sm font-medium text-white flex items-center justify-center md:justify-start md:space-x-3 cursor-pointer group w-10 md:w-auto"
      >
        <svg
          className="w-5 h-5 md:w-5 md:h-5 text-blue-200 group-hover:text-white transition-colors duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <span className="relative hidden md:inline">
          Show Code Generations
          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
        </span>
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-full md:w-80 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Code Generations
                  </h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                  >
                    <svg
                      className="h-5 w-5 text-gray-500 dark:text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                <div className="space-y-2">
                  {codeAssistants.length > 0 ? (
                    codeAssistants.map((assistant) => (
                      <div
                        key={assistant.id}
                        onClick={() => handleAssistantSelect(assistant.id)}
                        className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedAssistantId === assistant.id
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        <div className="flex justify-between items-start group">
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150 whitespace-pre-wrap">
                              {assistant.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {format(
                                new Date(assistant.createdAt),
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {loadingGeneration === assistant.id ? (
                              <div className="w-5 h-5">
                                <svg
                                  className="animate-spin w-full h-full text-blue-500"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                              </div>
                            ) : (
                              <button
                                onClick={(e) =>
                                  handleDeleteAssistant(assistant.id, e)
                                }
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-all duration-200"
                              >
                                <svg
                                  className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        No code generations yet
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-xs">
                        Enter some code to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Title section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 md:w-10 md:h-10 mr-3 md:mr-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
            NoteMaster AI Coding Assistant
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
            Get instant code explanations, generate optimized solutions, and
            improve your coding skills with AI assistance.
          </p>
        </div>

        {/* How it works section */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8 flex items-center">
            <svg
              className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 p-6"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Code input form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="space-y-4">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your code or describe what you want to generate..."
              className="w-full h-48 md:h-64 p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                loading || !code.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              }`}
            >
              {loading ? "Analyzing Code..." : "Analyze Code"}
            </button>
          </div>
        </form>

        {/* Response section */}
        <AnimatePresence mode="wait">
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                  Analysis Result
                </h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <span>{copied ? "Copied!" : "Copy"}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <ReactMarkdown
                  components={MarkdownComponents}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                  {response}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
