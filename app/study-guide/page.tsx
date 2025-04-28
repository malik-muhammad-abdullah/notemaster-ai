"use client";
import ChatLayout from "@/app/components/ChatLayout";

export default function StudyGuidePage() {
  return (
    <ChatLayout 
      title="NoteMaster AI Study Guide" 
      apiEndpoint="/study-guide"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Study Guide Generator</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This AI assistant can create comprehensive study guides based on your uploaded materials. Ask for a study guide on a specific topic or concept, and the AI will generate a structured learning resource.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">Example prompts:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>"Create a study guide for cell biology focusing on mitochondria function"</li>
            <li>"Make a study guide on the causes and effects of World War I"</li>
            <li>"Generate a chapter summary with key concepts for quantum physics"</li>
          </ul>
        </div>
      </div>
    </ChatLayout>
  );
} 