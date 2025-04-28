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
    console.log("Quiz Generation API: Request received");
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("Quiz Generation API: Unauthorized - no valid session");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Quiz Generation API: Request body received", { 
      hasMessage: !!body.message, 
      hasConversationId: !!body.conversationId,
      hasQuestionType: !!body.questionType,
      hasDifficulty: !!body.difficulty
    });
    const { message, conversationId, questionType, difficulty } = body;

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

    if (!questionType) {
      return NextResponse.json(
        { error: "Question type is required" },
        { status: 400 }
      );
    }

    if (!difficulty) {
      return NextResponse.json(
        { error: "Difficulty is required" },
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
    const vectorSearchResults = await queryVectorStore(message, user.id, 6);
    const relevantDocs = vectorSearchResults.success && vectorSearchResults.results ? 
      vectorSearchResults.results : [];

    // Format documents as string
    const formattedDocs = relevantDocs.length > 0 ? 
      formatDocumentsAsString(relevantDocs) : "No relevant documents found.";

    // Initialize language model
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.4, // Higher temperature for more creative questions
    });

    // Create a specialized prompt template for quiz generation
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an expert quiz creator specializing in educational assessment.
      Your goal is to create high-quality practice questions that test understanding and knowledge of specific topics.
      
      When creating quizzes:
      1. Focus on key concepts from the material
      2. Create clear, unambiguous questions
      3. For multiple choice, provide plausible but clearly incorrect alternatives
      4. Include a mix of difficulty levels (easy, medium, hard)
      5. If answer keys are requested, provide detailed explanations for the correct answers
      6. Format questions clearly with numbering and proper spacing
      7. For multiple-choice, label options as A, B, C, D, etc.
      8. Create questions that test different cognitive levels (recall, application, analysis)
      
      Question Type: {questionType}
      Difficulty: {difficulty}
      
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
      questionType: questionType,
      difficulty: difficulty
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

    console.log("Quiz Generation API: Response generated successfully");
    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Quiz Generation API error:", error);
    return NextResponse.json(
      { error: "Failed to process message", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 