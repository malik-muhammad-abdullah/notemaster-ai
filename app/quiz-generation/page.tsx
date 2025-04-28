"use client";
import ChatLayout from "@/app/components/ChatLayout";
import { useState } from 'react';

export default function QuizGenerationPage() {
  const [questionType, setQuestionType] = useState('MCQs');
  const [difficulty, setDifficulty] = useState('medium');

  return (
    <ChatLayout 
      title="NoteMaster AI Quiz Generator" 
      apiEndpoint="/quiz-generation"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Practice Quiz Creator</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This AI assistant can generate practice quizzes based on your study materials. Request multiple-choice questions, true/false questions, or short answer questions on specific topics to test your knowledge.
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">Example prompts:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>"Create a 10-question multiple-choice quiz on the American Revolution"</li>
            <li>"Generate 5 true/false questions about atoms and molecules"</li>
            <li>"Make a practice test with 3 short answer questions about JavaScript functions"</li>
          </ul>
        </div>
      </div>
    </ChatLayout>
  );
} 