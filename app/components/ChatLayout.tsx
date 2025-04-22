"use client";
import { useState, useEffect, useRef, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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

type ChatLayoutProps = {
  title: string;
  apiEndpoint: string;
  children?: ReactNode;
};

export default function ChatLayout({ title, apiEndpoint, children }: ChatLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  }, [status, apiEndpoint]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api${apiEndpoint}/conversations`);
      const data = await response.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error(`Error fetching conversations for ${apiEndpoint}:`, error);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await fetch(`/api${apiEndpoint}/conversations`, {
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
        
        // Focus input after creating new conversation
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    } catch (error) {
      console.error(`Error creating conversation for ${apiEndpoint}:`, error);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api${apiEndpoint}/conversations/${conversationId}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error(`Error loading conversation for ${apiEndpoint}:`, error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api${apiEndpoint}/conversations/${conversationId}`, {
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
        console.error(`Failed to delete conversation for ${apiEndpoint}`);
      }
    } catch (error) {
      console.error(`Error deleting conversation for ${apiEndpoint}:`, error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    console.log(`Submitting message to ${apiEndpoint}, currentConversationId:`, currentConversationId);
    let activeConversationId = currentConversationId;
    
    // Create a new conversation if none exists
    if (!activeConversationId) {
      console.log(`No active conversation for ${apiEndpoint}, creating new one`);
      try {
        const response = await fetch(`/api${apiEndpoint}/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "New Conversation",
          }),
        });
        const data = await response.json();
        console.log(`New conversation created for ${apiEndpoint}:`, data);
        if (data.conversation) {
          activeConversationId = data.conversation.id;
          setCurrentConversationId(activeConversationId);
          setConversations([...conversations, data.conversation]);
          console.log(`Set active conversation ID to: ${activeConversationId}`);
        } else {
          console.error(`Failed to create conversation for ${apiEndpoint}`, data);
          return; // Don't proceed if we couldn't create a conversation
        }
      } catch (error) {
        console.error(`Error creating conversation for ${apiEndpoint}:`, error);
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
      console.log(`Sending message to ${apiEndpoint} with conversationId:`, activeConversationId);
      const response = await fetch(`/api${apiEndpoint}`, {
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
      console.log(`API response from ${apiEndpoint}:`, data);
      setIsLoading(false);

      if (data.message) {
        // Add assistant message to UI
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.message.content,
        }]);
      } else if (data.error) {
        // Handle error response
        console.error(`Error from ${apiEndpoint} API:`, data.error, data.details);
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `Error: ${data.error}${data.details ? ` (${data.details})` : ''}`,
        }]);
      }
    } catch (error) {
      console.error(`Error sending message to ${apiEndpoint}:`, error);
      setIsLoading(false);
      // Show error message in chat
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, there was an error processing your message. Please try again.",
      }]);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true
    });
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-blue-600 dark:text-blue-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 overflow-y-auto border-r border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="p-4">
          <button
            onClick={createNewConversation}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow-sm transform transition-transform duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>New Chat</span>
            </div>
          </button>
        </div>
        <div className="px-3 py-2">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-2">
            Your Conversations
          </h2>
          <div className="space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm italic">
                No conversations yet
              </div>
            ) : (
              conversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  className="flex items-center group rounded-md overflow-hidden hover:bg-slate-200/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <button
                    onClick={() => loadConversation(conversation.id)}
                    className={`flex-grow text-left px-3 py-2 text-sm font-medium ${
                      currentConversationId === conversation.id
                        ? "bg-blue-50 dark:bg-gray-700/70 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{conversation.title}</span>
                    </div>
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center mr-3 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              {title}
            </h1>
          </div>
          <Link href="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200">
            Back to Home
          </Link>
        </header>

        {/* Custom content area */}
        {children && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            {children}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-chat-pattern bg-white dark:bg-gray-800 chat-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Welcome to {title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-3">Start a conversation by typing a message below.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Your AI assistant can answer questions based on your uploaded documents.</p>
                <button
                  onClick={() => inputRef.current?.focus()}
                  className="mt-4 text-sm px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
                >
                  New conversation
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-2">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isLastMessage = index === messages.length - 1;
                const showTimestamp = isLastMessage || messages[index + 1]?.role !== msg.role;
                
                return (
                  <div key={index} className={`${isUser ? 'user-message-enter ml-12' : 'bot-message-enter mr-12'}`}>
                    <div className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'} space-x-2`}>
                      {!isUser && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a10 10 0 0 1 10 10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6A10 10 0 0 1 12 2z"></path>
                            <path d="M17.5 17.5L19 22"></path>
                            <path d="M6.5 17.5L5 22"></path>
                            <path d="M8 14h.01"></path>
                            <path d="M16 14h.01"></path>
                            <path d="M12 14h.01"></path>
                          </svg>
                        </div>
                      )}
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 ${
                        isUser
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-100/50 dark:border-gray-700/50 text-gray-800 dark:text-white'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      {isUser && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          {session?.user?.image ? (
                            <Image
                              src={session.user.image}
                              alt="User avatar"
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {showTimestamp && msg.createdAt && (
                      <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right mr-10' : 'ml-10'}`}>
                        {formatDate(msg.createdAt)}
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start bot-message-enter">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 0 1 10 10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6A10 10 0 0 1 12 2z"></path>
                        <path d="M17.5 17.5L19 22"></path>
                        <path d="M6.5 17.5L5 22"></path>
                        <path d="M8 14h.01"></path>
                        <path d="M16 14h.01"></path>
                        <path d="M12 14h.01"></path>
                      </svg>
                    </div>
                    <div className="max-w-[85%] px-6 py-4 rounded-2xl bg-white/90 dark:bg-gray-800/90 border border-gray-100/50 dark:border-gray-700/50 shadow-sm backdrop-blur-sm">
                      <div className="flex space-x-2 items-center h-6 typing-indicator">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white/90 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex space-x-4 max-w-3xl mx-auto">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300/70 dark:border-gray-600/70 rounded-full px-6 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white shadow-inner input-focus-effect"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-5 py-2.5 rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className="flex items-center space-x-2">
                <span>Send</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 