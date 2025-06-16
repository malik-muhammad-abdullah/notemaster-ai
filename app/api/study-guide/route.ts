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
    console.log("Study Guide API: Request received");
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("Study Guide API: Unauthorized - no valid session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Study Guide API: Request body received", {
      hasMessage: !!body.message,
      hasConversationId: !!body.conversationId,
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    const chatHistory = conversation.messages
      .map((msg) => {
        return `${msg.role === "user" ? "Human" : "Assistant"}: ${msg.content}`;
      })
      .join("\n");

    // Query vector store for relevant documents
    const vectorSearchResults = await queryVectorStore(message, user.id, 8); // Getting more docs for study guides
    const relevantDocs =
      vectorSearchResults.success && vectorSearchResults.results
        ? vectorSearchResults.results
        : [];

    // Format documents as string
    const formattedDocs =
      relevantDocs.length > 0
        ? formatDocumentsAsString(relevantDocs)
        : "No relevant documents found.";

    // Initialize language model
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
    });

    // Create a specialized prompt template for study guides
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an expert education assistant and exam preparation specialist. Your goal is to create comprehensive, 
      exam-focused study guides that help students effectively prepare for their exams.
      
      When creating an exam preparation guide:
      1. Start with a brief overview of the topic and its importance
      2. Break down the main concepts that will likely be tested
      3. Provide specific study strategies for this particular subject
      4. Include:
         - Key definitions and terminology
         - Important formulas or frameworks
         - Common exam question types for this topic
         - Sample practice questions with brief explanations
         - Memory aids and mnemonics where applicable
      5. Suggest a structured study timeline
      6. Highlight common mistakes and misconceptions
      7. Provide exam-day tips specific to this subject
      8. End with a quick-reference summary of the most crucial points
      
      Format the guide with clear headings, bullet points, and numbered lists for easy reference.
      Make it both comprehensive and scannable for quick review.
      
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

    console.log("Study Guide API: Response generated successfully");
    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Study Guide API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process message",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
