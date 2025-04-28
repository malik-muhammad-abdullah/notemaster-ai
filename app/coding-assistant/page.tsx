"use client";
import ChatLayout from "@/app/components/ChatLayout";

export default function CodingAssistantPage() {
  return (
    <ChatLayout 
      title="NoteMaster AI Coding Assistant" 
      apiEndpoint="/coding-assistant"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Code Helper</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This AI assistant can help you with programming tasks, explain code concepts, debug issues, and provide code examples based on your uploaded materials or specific questions.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">Example prompts:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>"Write a JavaScript function to sort an array of objects by a specific property"</li>
            <li>"Explain how async/await works in JavaScript with examples"</li>
            <li>"Debug this Python code: [paste code with issue]"</li>
            <li>"Convert this SQL query to use a JOIN instead of a subquery"</li>
          </ul>
        </div>
      </div>
    </ChatLayout>
  );
} 