"use client";
import ChatLayout from "@/app/components/ChatLayout";

export default function SummarizationPage() {
  return (
    <ChatLayout 
      title="NoteMaster AI Summarization" 
      apiEndpoint="/summarization"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Content Summarizer</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This AI assistant can create concise summaries of your uploaded documents. It can generate different types of summaries including executive summaries, chapter summaries, or bullet point lists of key information.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">Example prompts:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>"Summarize the main points of this research paper in 5 bullet points"</li>
            <li>"Create an executive summary of this business proposal"</li>
            <li>"Provide a concise overview of Chapter 3 highlighting key concepts"</li>
          </ul>
        </div>
      </div>
    </ChatLayout>
  );
} 