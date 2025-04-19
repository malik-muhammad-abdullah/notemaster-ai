"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
};

type Conversation = {
  id: string;
  title: string;
  createdAt: Date;
};

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  // Fetch user's conversations
  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
    }
  }, [status]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/chat/conversations");
      const data = await response.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "New Conversation",
        }),
      });
      const data = await response.json();
      if (data.conversation) {
        setCurrentConversationId(data.conversation.id);
        setConversations([...conversations, data.conversation]);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    console.log("Submitting message, currentConversationId:", currentConversationId);
    let activeConversationId = currentConversationId;
    
    // Create a new conversation if none exists
    if (!activeConversationId) {
      console.log("No active conversation, creating new one");
      try {
        const response = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "New Conversation",
          }),
        });
        const data = await response.json();
        console.log("New conversation created:", data);
        if (data.conversation) {
          activeConversationId = data.conversation.id;
          setCurrentConversationId(activeConversationId);
          setConversations([...conversations, data.conversation]);
          console.log("Set active conversation ID to:", activeConversationId);
        } else {
          console.error("Failed to create conversation", data);
          return; // Don't proceed if we couldn't create a conversation
        }
      } catch (error) {
        console.error("Error creating conversation:", error);
        return; // Don't proceed if there was an error
      }
    }
    
    const userMessage: Message = {
      role: "user",
      content: message,
    };

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      console.log("Sending chat message with conversationId:", activeConversationId);
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: activeConversationId,
        }),
      });

      const data = await response.json();
      console.log("Chat API response:", data);
      setIsLoading(false);

      if (data.message) {
        // Add assistant message to UI
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.message.content,
        }]);
      } else if (data.error) {
        // Handle error response
        console.error("Error from chat API:", data.error, data.details);
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Error: ${data.error}${data.details ? ` (${data.details})` : ''}`,
        }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      // Show error message in chat
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, there was an error processing your message. Please try again.",
      }]);
    }
  };

  // Add this function to handle conversation deletion
  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        // Remove the conversation from state
        setConversations(conversations.filter(conv => conv.id !== conversationId));
        
        // If the deleted conversation was the current one, reset state
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
          setMessages([]);
        }
      } else {
        console.error("Failed to delete conversation");
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 dark:bg-gray-900 overflow-y-auto border-r border-gray-200 dark:border-gray-800">
        <div className="p-4">
          <button
            onClick={createNewConversation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          >
            New Chat
          </button>
        </div>
        <div className="px-3 py-2">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Your Conversations
          </h2>
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div 
                key={conversation.id}
                className="flex items-center group"
              >
                <button
                  onClick={() => loadConversation(conversation.id)}
                  className={`flex-grow text-left px-3 py-2 rounded-md text-sm font-medium ${
                    currentConversationId === conversation.id
                      ? "bg-gray-200 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {conversation.title}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to delete this conversation?")) {
                      deleteConversation(conversation.id);
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete conversation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">NoteMaster AI Chat</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            Back to Home
          </Link>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Welcome to NoteMaster AI Chat</h3>
                <p>Start a conversation by typing a message below.</p>
                <p className="mt-4 text-sm">Your AI assistant can answer questions based on your uploaded documents.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white">
                    <div className="flex space-x-2 items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-75"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 