"use client";
import { useState, useEffect, useRef } from "react";
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

interface TutorialGuide {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

const howItWorks = [
  {
    title: "Enter Your Topic",
    description: "Type in any topic you want to learn about in detail",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    title: "AI Analysis",
    description:
      "Our AI analyzes your topic and relevant materials to create a comprehensive tutorial",
    icon: (
      <svg
        className="w-6 h-6"
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
    title: "Detailed Tutorial",
    description:
      "Get a detailed, step-by-step tutorial with examples and explanations",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
];

const LoadingAnimation = () => (
  <div className="flex flex-col items-center justify-center p-8 space-y-6">
    <div className="relative w-24 h-24">
      {/* Brain icon with gradient and pulse animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
      <svg
        className="relative w-full h-full text-white p-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 18.5C12 19.8807 13.1193 21 14.5 21C15.8807 21 17 19.8807 17 18.5C17 17.1193 15.8807 16 14.5 16M12 18.5C12 19.8807 10.8807 21 9.5 21C8.11929 21 7 19.8807 7 18.5C7 17.1193 8.11929 16 9.5 16M12 18.5V13.5M14.5 16C15.4479 15.5517 16 14.6179 16 13.5C16 11.8431 14.6569 10.5 13 10.5M9.5 16C8.55205 15.5517 8 14.6179 8 13.5C8 11.8431 9.34315 10.5 11 10.5M13 10.5C13 9.11929 11.8807 8 10.5 8C9.11929 8 8 9.11929 8 10.5M13 10.5C13 9.11929 14.1193 8 15.5 8C16.8807 8 18 9.11929 18 10.5C18 11.6179 17.4479 12.5517 16.5 13M8 10.5C8 9.11929 6.88071 8 5.5 8C4.11929 8 3 9.11929 3 10.5C3 11.6179 3.55205 12.5517 4.5 13M21 10.5C21 11.6179 20.4479 12.5517 19.5 13C18.5521 12.5517 18 11.6179 18 10.5C18 9.11929 19.1193 8 20.5 8C21.8807 8 23 9.11929 23 10.5Z"
          className="animate-draw"
        />
      </svg>
    </div>
    <div className="space-y-3 text-center">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Generating Your Explanation
      </h3>
      <div className="flex flex-col items-center space-y-2">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Analyzing topic and gathering relevant information...
        </p>
      </div>
    </div>
  </div>
);

export default function TextTutoringPage() {
  const { data: session } = useSession();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tutorial, setTutorial] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tutorials, setTutorials] = useState<TutorialGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch tutorials on component mount
  useEffect(() => {
    if (session?.user?.email) {
      fetchTutorials();
    }
  }, [session]);

  const fetchTutorials = async () => {
    try {
      const response = await fetch("/api/real-time-text-tutoring/list");
      if (!response.ok) throw new Error("Failed to fetch tutorials");
      const data = await response.json();
      setTutorials(data.tutorials);
    } catch (error) {
      console.error("Error fetching tutorials:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setLoading(true);
      setError("");
      setTutorial("");
      setMessages([]);
      setSelectedGuideId(null);

      const response = await fetch("/api/real-time-text-tutoring/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate tutorial");
      }

      const data = await response.json();
      setTutorial(data.tutorial);

      // Refresh tutorials and set the newly created guide as selected
      await fetchTutorials();
      const newGuide = data.conversation;
      if (newGuide?.id) {
        setSelectedGuideId(newGuide.id);
        // Initialize empty messages array for the new conversation
        setMessages([]);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to generate tutorial"
      );
      console.error("Tutorial generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuideSelect = async (guideId: string) => {
    try {
      setSelectedGuideId(guideId);
      const guide = tutorials.find((g) => g.id === guideId);
      if (guide) {
        setTutorial(guide.content);
        setTopic(guide.title);

        // Fetch chat messages for this tutorial
        const response = await fetch(
          `/api/real-time-text-tutoring/conversations/${guideId}`
        );
        if (!response.ok) throw new Error("Failed to fetch chat messages");

        const data = await response.json();
        setMessages(
          data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }))
        );
      }
    } catch (error) {
      console.error("Error selecting tutorial:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load tutorial"
      );
    }
  };

  const handleDeleteGuide = async (guideId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the guide selection
    try {
      const response = await fetch(
        `/api/real-time-text-tutoring/delete/${guideId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete tutorial");

      await fetchTutorials(); // Refresh the list
      if (selectedGuideId === guideId) {
        setSelectedGuideId(null);
        setTutorial("");
      }
    } catch (error) {
      console.error("Error deleting tutorial:", error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tutorial);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFollowUpQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim()) return;

    // Check if we have a tutorial but no selectedGuideId (first question after generation)
    if (tutorial && !selectedGuideId) {
      setError(
        "Please wait a moment and try again. The explanation is still being processed."
      );
      return;
    }

    if (!selectedGuideId) {
      setError(
        "No explanation selected. Please generate or select an explanation first."
      );
      return;
    }

    try {
      setChatLoading(true);
      setError("");

      // Add user message to the chat immediately for better UX
      const newMessages = [
        ...messages,
        { role: "user", content: followUpQuestion },
      ];
      setMessages(newMessages);
      setFollowUpQuestion("");

      const response = await fetch("/api/real-time-text-tutoring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: followUpQuestion,
          conversationId: selectedGuideId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to get response");
      }

      const data = await response.json();

      // Add assistant response to the chat
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.message.content },
      ]);

      // Scroll to the bottom of the chat
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to get response"
      );
      console.error("Follow-up question error:", error);

      // Remove the user's message if there was an error
      setMessages(messages);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Interactive Topic Tutorials
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Enter any topic you want to learn about, and our AI will create a
            comprehensive, step-by-step tutorial using your study materials and
            expert knowledge.
          </p>
        </div>

        {/* How it works section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Your Explanations
                </h2>
                <div className="space-y-4">
                  {tutorials.map((guide) => (
                    <div
                      key={guide.id}
                      onClick={() => handleGuideSelect(guide.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedGuideId === guide.id
                          ? "bg-blue-50 dark:bg-blue-900"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {guide.title}
                        </h3>
                        <button
                          onClick={(e) => handleDeleteGuide(guide.id, e)}
                          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                        >
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(guide.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a topic to learn about..."
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium ${
                      loading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700"
                    }`}
                  >
                    {loading ? "Generating..." : "Generate Explanation"}
                  </button>
                </div>
              </form>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-lg">
                  {error}
                </div>
              )}

              {loading ? (
                <LoadingAnimation />
              ) : (
                tutorial && (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Interactive Tutoring Session
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleCopy}
                          className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          <span>{copied ? "Copied!" : "Copy"}</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="9"
                              y="9"
                              width="13"
                              height="13"
                              rx="2"
                              ry="2"
                            ></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={MarkdownComponents}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeSanitize]}
                      >
                        {tutorial}
                      </ReactMarkdown>
                    </div>

                    {/* Chat Section */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Follow-up Questions
                      </h3>

                      {/* Chat Messages */}
                      <div
                        ref={chatContainerRef}
                        className="space-y-4 mb-4 max-h-96 overflow-y-auto"
                      >
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              message.role === "user"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                message.role === "user"
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                              }`}
                            >
                              <div className="prose dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  components={MarkdownComponents}
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <form
                        onSubmit={handleFollowUpQuestion}
                        className="flex gap-4"
                      >
                        <input
                          type="text"
                          value={followUpQuestion}
                          onChange={(e) => setFollowUpQuestion(e.target.value)}
                          placeholder="Ask a follow-up question..."
                          className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={!tutorial || chatLoading}
                        />
                        <button
                          type="submit"
                          disabled={!tutorial || chatLoading}
                          className={`px-6 py-3 bg-blue-600 text-white rounded-lg font-medium ${
                            !tutorial || chatLoading
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-blue-700"
                          }`}
                        >
                          {chatLoading ? "Asking..." : "Ask"}
                        </button>
                      </form>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
