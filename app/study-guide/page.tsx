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
import PdfExportButton from "../components/PdfExportButton";

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

interface StudyGuide {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

const howItWorks = [
  {
    title: "Enter Your Topic",
    description: "Type in any subject or topic you want to study",
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
      "Our AI breaks down the topic into key concepts and learning objectives",
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
    title: "Comprehensive Guide",
    description:
      "Get a structured study guide with concepts, strategies, and exam tips",
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

export default function StudyGuidePage() {
  const { data: session } = useSession();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [studyGuide, setStudyGuide] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studyGuides, setStudyGuides] = useState<StudyGuide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch study guides on component mount
  useEffect(() => {
    if (session?.user?.email) {
      fetchStudyGuides();
    }
  }, [session]);

  const fetchStudyGuides = async () => {
    try {
      const response = await fetch("/api/study-guide/list");
      if (!response.ok) throw new Error("Failed to fetch study guides");
      const data = await response.json();
      setStudyGuides(data.studyGuides);
    } catch (error) {
      console.error("Error fetching study guides:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setLoading(true);
      setError("");
      setStudyGuide("");

      const response = await fetch("/api/study-guide/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate study guide");
      }

      const data = await response.json();
      setStudyGuide(data.studyGuide);
      await fetchStudyGuides(); // Refresh the study guides list
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate study guide"
      );
      console.error("Study guide generation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuideSelect = async (guideId: string) => {
    try {
      setSelectedGuideId(guideId);
      const guide = studyGuides.find((g) => g.id === guideId);
      if (guide) {
        setStudyGuide(guide.content);
        setTopic(guide.title);
      }
    } catch (error) {
      console.error("Error selecting guide:", error);
    }
  };

  const handleDeleteGuide = async (guideId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the guide selection
    try {
      const response = await fetch(`/api/study-guide/delete/${guideId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete study guide");
      }

      // Remove the guide from the list
      setStudyGuides((guides) => guides.filter((g) => g.id !== guideId));

      // Clear the current guide if it was selected
      if (selectedGuideId === guideId) {
        setSelectedGuideId(null);
        setStudyGuide("");
        setTopic("");
      }
    } catch (error) {
      console.error("Error deleting guide:", error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(studyGuide);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanMarkdown = (content: string) => {
    return content.replace(/^- /gm, "");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-950">
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-6 left-6 z-50 py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 rounded-lg shadow-lg transition-all duration-200 text-sm font-medium text-white flex items-center space-x-3 cursor-pointer group"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-blue-200 group-hover:text-white transition-colors duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
        <span className="relative">
          Show All Generated Study Guides
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
              className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Study Guides
                  </h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 cursor-pointer"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
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
                  {studyGuides.map((guide) => (
                    <div
                      key={guide.id}
                      className={`relative group rounded-lg transition-all duration-200 ${
                        selectedGuideId === guide.id
                          ? "bg-blue-100 dark:bg-blue-900"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <button
                        onClick={() => handleGuideSelect(guide.id)}
                        className="w-full p-3 pr-12 text-left cursor-pointer"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(guide.createdAt), "MMM d, yyyy")}
                        </p>
                      </button>
                      <button
                        onClick={(e) => handleDeleteGuide(guide.id, e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-all duration-200 cursor-pointer"
                        title="Delete study guide"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-red-500 dark:text-red-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                  {studyGuides.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No study guides generated yet
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-10">
            <div className="mr-4 bg-blue-600 rounded-xl p-3 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              NoteMaster AI Study Guide
            </h1>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <motion.div
            className="md:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                  Exam Preparation Guide Generator
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Enter your topic to get a comprehensive exam preparation
                  guide. The AI will create a structured study plan with key
                  concepts, strategies, and practice materials.
                </p>

                {/* Topic Input Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-4">
                    <label
                      htmlFor="topic"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Topic or Subject
                    </label>
                    <textarea
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter the topic you want to study (e.g., 'Advanced Calculus - Differential Equations' or 'Computer Networks - TCP/IP Protocols')"
                      className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !topic.trim()}
                    className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 cursor-pointer ${
                      loading || !topic.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                    }`}
                  >
                    {loading
                      ? "Generating Study Guide..."
                      : "Generate Study Guide"}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="md:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                How it Works
              </h3>
              <div className="space-y-6">
                {howItWorks.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      {step.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {step.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Study Guide Output */}
        {studyGuide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Generated Study Guide
                </h2>
                <div className="flex space-x-4">
                  <PdfExportButton
                    contentRef={contentRef}
                    fileName={`study-guide-${topic}`}
                  />
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <div
                ref={contentRef}
                className="prose dark:prose-invert max-w-none"
              >
                <ReactMarkdown
                  components={MarkdownComponents}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                  {cleanMarkdown(studyGuide)}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
