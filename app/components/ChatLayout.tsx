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
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [questionType, setQuestionType] = useState('MCQs');
  const [difficulty, setDifficulty] = useState('medium');
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(1);
  const [includeAnswers, setIncludeAnswers] = useState(false);

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

  // Debug the loading state
  useEffect(() => {
    console.log("isConversationLoading:", isConversationLoading);
  }, [isConversationLoading]);

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

  // Check for test parameters in development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const urlParams = new URLSearchParams(window.location.search);
      const testParam = urlParams.get('test');
      
      if (testParam === 'skeleton') {
        console.log("Test mode: Showing skeleton loader");
        setIsConversationLoading(true);
        
        // Automatically hide after 5 seconds
        const timer = setTimeout(() => {
          setIsConversationLoading(false);
          console.log("Test mode: Hiding skeleton loader after timeout");
          
          // Clean URL after test
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
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
    setIsConversationLoading(true);
    console.log("Loading conversation, setting isConversationLoading to true");
    
    try {
      // Simulate loading delay for better visualization in development
      // Remove this setTimeout in production
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`/api${apiEndpoint}/conversations/${conversationId}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error(`Error loading conversation for ${apiEndpoint}:`, error);
    } finally {
      console.log("Finished loading conversation, setting isConversationLoading to false");
      setIsConversationLoading(false);
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

  // Add event listener for loading conversations from other components
  useEffect(() => {
    const handleLoadConversation = (event: CustomEvent<{ conversationId: string }>) => {
      if (event.detail && event.detail.conversationId) {
        loadConversation(event.detail.conversationId);
      }
    };

    // Add event listener
    window.addEventListener('load-conversation', handleLoadConversation as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('load-conversation', handleLoadConversation as EventListener);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let userMsg = message;
    if (apiEndpoint === '/quiz-generation') {
      userMsg = `Generate ${numQuestions} ${difficulty} ${questionType} questions on the topic: ${topic}${includeAnswers ? ' (with answers)' : ' (no answers)'}`;
    }
    if ((apiEndpoint === '/quiz-generation' && (!topic.trim() || !numQuestions || numQuestions < 1 || numQuestions > 25)) || !userMsg.trim() || isLoading) return;
    
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
      content: userMsg,
    };

    // Add user message to UI
    setMessages((prev) => [...prev, userMessage]);
    if (apiEndpoint !== '/quiz-generation') setMessage("");
    setIsLoading(true);

    try {
      console.log(`Sending message to ${apiEndpoint} with conversationId:`, activeConversationId);
      const requestBody: any = {
        message: userMessage.content,
        conversationId: activeConversationId,
        topic: topic,
        numQuestions: numQuestions,
        includeAnswers: includeAnswers,
      };
      if (apiEndpoint === '/quiz-generation') {
        requestBody.questionType = questionType;
        requestBody.difficulty = difficulty;
      }
      const response = await fetch(`/api${apiEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white/80 dark:bg-gray-800/60 overflow-y-auto backdrop-blur-md rounded-r-2xl shadow-lg transform transition-all duration-300 ease-in-out">
        <div className="p-5">
          <button
            onClick={createNewConversation}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow transform transition-all duration-200 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>New Chat</span>
            </div>
          </button>
        </div>
        <div className="px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wider mb-3 ml-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            CONVERSATIONS
          </h2>
          <div className="space-y-1.5 pr-1">
            {conversations.length === 0 ? (
              <div className="text-center py-8 px-2">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 shadow-inner">
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    No conversations yet. Start a new chat to begin.
                  </p>
                </div>
              </div>
            ) : (
              conversations.map((conversation) => (
              <div 
                key={conversation.id}
                  className="group relative"
              >
                <button
                  onClick={() => loadConversation(conversation.id)}
                    className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                    currentConversationId === conversation.id
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center w-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${
                        currentConversationId === conversation.id
                          ? "text-blue-500 dark:text-blue-400"
                          : "text-gray-400 dark:text-gray-500"
                      }`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate mr-2">{conversation.title}</span>
                    </div>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Are you sure you want to delete this conversation?")) {
                      deleteConversation(conversation.id);
                    }
                  }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200"
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
        {/* Custom content area */}
        {children && (
          <div className="p-4 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm">
            {children}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-chat-pattern bg-white/80 dark:bg-gray-900/40 backdrop-blur-sm chat-scrollbar relative">
          {/* Curved background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-indigo-50/10 dark:from-blue-900/10 dark:to-indigo-900/5 pointer-events-none"></div>
          
          {isConversationLoading ? (
            <div className="space-y-8 py-4 relative z-10">
              <div className="text-center mb-6 text-sm text-gray-500 dark:text-gray-400">
                Loading conversation...
              </div>
              {/* Assistant skeleton */}
              <div className="flex justify-start mr-12">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 skeleton-shimmer"></div>
                  <div className="max-w-[75%] w-64 h-20 rounded-2xl bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
                </div>
              </div>
              {/* User skeleton */}
              <div className="flex justify-end ml-12">
                <div className="flex items-start space-x-2">
                  <div className="max-w-[75%] w-48 h-12 rounded-2xl bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 skeleton-shimmer"></div>
                </div>
              </div>
              {/* Assistant skeleton */}
              <div className="flex justify-start mr-12">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 skeleton-shimmer"></div>
                  <div className="max-w-[75%] w-80 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
                </div>
              </div>
              {/* Assistant skeleton */}
              <div className="flex justify-start mr-12">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 skeleton-shimmer"></div>
                  <div className="max-w-[75%] w-72 h-10 rounded-2xl bg-gray-200 dark:bg-gray-700 skeleton-shimmer"></div>
                </div>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center relative z-10">
              <div className="relative max-w-md rounded-3xl bg-white/90 dark:bg-gray-800/90 shadow-xl backdrop-blur border border-gray-100/50 dark:border-gray-700/50 p-8 transform transition-all hover:scale-[1.01] duration-300 overflow-hidden">
                <div className="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 blur-3xl opacity-60 z-0"></div>
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100 text-center">Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">{title}</span></h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">Start a conversation by typing a message below.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">Your AI assistant can answer questions based on your uploaded documents.</p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => inputRef.current?.focus()}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow transform transition-all duration-200 hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Start Conversation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pb-2 relative z-10">
              {messages.map((msg, index) => {
                const isUser = msg.role === "user";
                const isLastMessage = index === messages.length - 1;
                const showTimestamp = isLastMessage || messages[index + 1]?.role !== msg.role;
                
                return (
                  <div key={index} className={`${isUser ? 'user-message-enter ml-12' : 'bot-message-enter mr-12'}`}>
                    <div className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'} space-x-2`}>
                      {!isUser && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a10 10 0 0 1 10 10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6A10 10 0 0 1 12 2z"></path>
                            <path d="M17.5 17.5L19 22"></path>
                            <path d="M6.5 17.5L5 22"></path>
                            <path d="M8 14h.01"></path>
                            <path d="M16 14h.01"></path>
                            <path d="M12 14h.01"></path>
                          </svg>
                        </div>
                      )}
                      <div 
                        className={`max-w-[75%] rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] ${
                          isUser
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3.5'
                            : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100/50 dark:border-gray-700/50 text-gray-800 dark:text-white p-4'
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      {isUser && (
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden ring-2 ring-white dark:ring-gray-800 shadow-md">
                          {session?.user?.image ? (
                            <Image
                              src={session.user.image}
                              alt="User avatar"
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {showTimestamp && msg.createdAt && (
                      <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right mr-12' : 'ml-12'}`}>
                        {formatDate(msg.createdAt)}
                      </div>
                    )}
                </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start bot-message-enter">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md ring-2 ring-white dark:ring-gray-800">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 0 1 10 10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6A10 10 0 0 1 12 2z"></path>
                        <path d="M17.5 17.5L19 22"></path>
                        <path d="M6.5 17.5L5 22"></path>
                        <path d="M8 14h.01"></path>
                        <path d="M16 14h.01"></path>
                        <path d="M12 14h.01"></path>
                      </svg>
                    </div>
                    <div className="max-w-[75%] p-5 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-100/50 dark:border-gray-700/50 shadow-sm">
                      <div className="flex space-x-3 items-center h-6 typing-indicator">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
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
        <div className="bg-gradient-to-b from-white/70 to-white/90 dark:from-gray-800/70 dark:to-gray-800/90 backdrop-blur-md px-6 py-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-4xl mx-auto">
            {apiEndpoint === '/quiz-generation' ? (
              <div className="flex gap-2 mb-1 w-full">
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={numQuestions}
                  onChange={e => setNumQuestions(Number(e.target.value))}
                  placeholder="#"
                  className="rounded-lg px-2 py-3 bg-gray-800 text-white w-24 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                />
                <select value={questionType} onChange={e => setQuestionType(e.target.value)} className="rounded-lg px-2 py-3 bg-gray-800 text-white flex-1">
                  <option value="MCQs">Multiple Choice</option>
                  <option value="short">Short Questions</option>
                  <option value="long">Long Questions</option>
                  <option value="truefalse">True/False</option>
                </select>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="rounded-lg px-2 py-3 bg-gray-800 text-white flex-1">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Enter topic..."
                  className="rounded-lg px-2 py-3 bg-gray-800 text-white flex-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="flex items-center gap-2 px-3 select-none">
                  <span className="text-sm text-gray-200">Include Answers</span>
                  <button
                    type="button"
                    aria-pressed={includeAnswers}
                    onClick={() => setIncludeAnswers(v => !v)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${includeAnswers ? 'bg-blue-600' : 'bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${includeAnswers ? 'translate-x-5' : 'translate-x-1'}`}
                    />
                  </button>
                </label>
                <button
                  type="submit"
                  disabled={isLoading || !topic.trim() || !numQuestions || numQuestions < 1 || numQuestions > 25}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-3 rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="flex items-center space-x-2">
                    <span>Send</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.414 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-200/70 dark:border-gray-700/70 rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm text-gray-900 dark:text-white shadow-inner input-focus-effect"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !message.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-6 py-3 rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className="flex items-center space-x-2">
                <span>Send</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.414 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </div>
            </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 