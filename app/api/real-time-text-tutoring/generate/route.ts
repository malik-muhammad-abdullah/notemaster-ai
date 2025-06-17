import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { topic } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Query vector store for relevant documents
    const vectorSearchResults = await queryVectorStore(topic, user.id, 8);
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

    // Create a specialized prompt template for tutorials
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an expert educational tutor specializing in explaining complex concepts in clear, accessible ways.
      Your goal is to create a comprehensive, detailed tutorial that helps students understand the topic thoroughly.
      
      Create a detailed tutorial for the following topic: {topic}
      
      Use the following context from relevant documents if available, and if not available or too less, then use your own knowledge:
      {context}
      
      Structure your response in the following format:
      
      # TOPIC OVERVIEW
      [Provide a clear, engaging introduction to the topic and its importance]
      
      # KEY CONCEPTS
      [Break down and explain the fundamental concepts]
      
      # DETAILED EXPLANATION
      [Provide a thorough, step-by-step explanation of the topic]
      
      # EXAMPLES AND ILLUSTRATIONS
      [Include practical examples and real-world applications]
      
      # COMMON MISCONCEPTIONS
      [Address and clarify common misunderstandings]
      
      # PRACTICE EXERCISES
      [Provide exercises or problems for practice]
      
      # SUMMARY AND KEY TAKEAWAYS
      [Summarize the main points and key learnings]
      
      # ADDITIONAL RESOURCES
      [Suggest resources for further learning]
      
      Important formatting rules:
      1. Use * for all bullet points (never use -)
      2. For nested lists, add 2 spaces before the * of the nested item
      3. Bold text should be wrapped in ** (e.g., **bold text**)
      4. Keep nested items aligned with proper indentation
      5. Each bullet point should be on its own line
      
      Human: Create a tutorial for {topic}
      Assistant:`);

    // Create a chain that combines the prompt template, LLM, and output parser
    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    // Generate tutorial
    const tutorial = await chain.invoke({
      topic: topic,
      context: formattedDocs,
    });

    // Create a new conversation for the tutorial
    const conversation = await prisma.chatConversation.create({
      data: {
        userId: user.id,
        title: topic,
        type: "REAL_TIME_TEXT_TUTORING",
      },
    });

    // Store the tutorial as a message
    await prisma.chatMessage.create({
      data: {
        content: tutorial,
        role: "assistant",
        conversationId: conversation.id,
      },
    });

    return NextResponse.json({
      tutorial: tutorial,
      conversation: conversation,
    });
  } catch (error) {
    console.error("Tutorial generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate tutorial",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
