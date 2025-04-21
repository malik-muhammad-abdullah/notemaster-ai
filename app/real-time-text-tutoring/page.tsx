"use client";
import ChatLayout from "@/app/components/ChatLayout";

export default function TextTutoringPage() {
  return (
    <ChatLayout 
      title="NoteMaster AI Text Tutoring" 
      apiEndpoint="/real-time-text-tutoring"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Interactive Tutor</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This AI assistant serves as your personal tutor, helping you understand difficult concepts from your study materials. Ask questions about your course materials and get detailed, step-by-step explanations.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">Example prompts:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>"Can you explain how photosynthesis works in simple terms?"</li>
            <li>"I'm struggling with derivatives in calculus. Can you walk me through the chain rule?"</li>
            <li>"Help me understand the key themes in Shakespeare's Macbeth"</li>
          </ul>
        </div>
      </div>
    </ChatLayout>
  );
} 