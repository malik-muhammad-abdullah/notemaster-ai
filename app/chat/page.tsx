"use client";
import ChatLayout from "@/app/components/ChatLayout";

export default function ChatPage() {
  return (
    <ChatLayout 
      title="NoteMaster AI Chat" 
      apiEndpoint="/chat"
    />
  );
} 