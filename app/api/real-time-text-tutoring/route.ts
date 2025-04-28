import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { queryVectorStore } from "@/lib/query-vectors";
import { formatDocumentsAsString } from "langchain/util/document";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export async function POST(request: Request) {
  try {
    console.log("Text Tutoring API: Request received");
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("Text Tutoring API: Unauthorized - no valid session");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Text Tutoring API: Request body received", { 
      hasMessage: !!body.message, 
      hasConversationId: !!body.conversationId
    });
    const { message, conversationId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: "ConversationId is required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify conversation exists and belongs to user
    const conversation = await prisma.chatConversation.findUnique({
      where: {
        id: conversationId,
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Store the user message in the database
    const userMessage = await prisma.chatMessage.create({
      data: {
        content: message,
        role: "user",
        conversationId,
      },
    });

    // Get previous messages for context
    const chatHistory = conversation.messages.map(msg => {
      return `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`;
    }).join("\n");

    // Query vector store for relevant documents
    const vectorSearchResults = await queryVectorStore(message, user.id, 5);
    const relevantDocs = vectorSearchResults.success && vectorSearchResults.results ? 
      vectorSearchResults.results : [];

    // Format documents as string
    const formattedDocs = relevantDocs.length > 0 ? 
      formatDocumentsAsString(relevantDocs) : "No relevant documents found.";

    // Initialize language model
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.3, // Slightly higher temperature for more diverse explanations
    });

    // Create a specialized prompt template for tutoring
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an expert educational tutor specializing in explaining complex concepts in clear, accessible ways.
      Your goal is to help the student understand the material by providing patient, step-by-step explanations.
      
      When tutoring:
      1. Identify the core concepts the student needs to understand
      2. Provide clear, step-by-step explanations
      3. Use analogies and examples to illustrate complex ideas
      4. Break down complicated processes into smaller, manageable parts
      5. Check for understanding by asking questions
      6. Be encouraging and supportive, avoiding complex jargon unless necessary
      7. If you don't know something, say so rather than providing incorrect information
      
      Context from relevant documents:
      {context}
      
      Chat History:
      {chatHistory}
      
      Human: {question}
      Assistant:`);

    // Create a chain that combines the prompt template, LLM, and output parser
    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    // Generate response
    const response = await chain.invoke({
      context: formattedDocs,
      chatHistory: chatHistory,
      question: message,
    });

    // Store the assistant's response in the database
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        content: response,
        role: "assistant",
        conversationId,
      },
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    console.log("Text Tutoring API: Response generated successfully");
    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Text Tutoring API error:", error);
    return NextResponse.json(
      { error: "Failed to process message", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 