import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

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

    // Initialize language model
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
    });

    // Create a specialized prompt template for exam preparation guides
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an expert education assistant and exam preparation specialist. Your goal is to create a comprehensive,
      exam-focused study guide that helps students effectively prepare for their exams.
      
      Create a detailed study guide for the following topic: {topic}
      
      Structure your response in the following format:
      
      # TOPIC OVERVIEW
      [Provide a brief overview of the topic and its importance in the field]
      
      # KEY CONCEPTS
      [List and explain the main concepts that will likely be tested]
      
      # STUDY STRATEGIES
      [Provide specific study strategies for this particular subject]
      
      # ESSENTIAL COMPONENTS
      * **Key Definitions and Terminology**
        * Term 1: Definition
        * Term 2: Definition
      * **Important Formulas/Frameworks**
        * Formula 1: Explanation
        * Framework 1: Description
      * **Common Exam Question Types**
        * Question Type 1: Strategy
        * Question Type 2: Strategy
      * **Sample Practice Questions**
        * Question 1
        * Question 2
      * **Memory Aids and Mnemonics**
        * Mnemonic 1: Explanation
        * Mnemonic 2: Explanation
      
      # STUDY TIMELINE
      [Suggest a structured study timeline]
      
      # COMMON PITFALLS
      [Highlight common mistakes and misconceptions]
      
      # EXAM DAY TIPS
      [Provide subject-specific exam day strategies]
      
      # QUICK REFERENCE
      [Summarize the most crucial points for last-minute review]
      
      Important formatting rules:
      1. Use * for all bullet points (never use -)
      2. For nested lists, add 2 spaces before the * of the nested item
      3. Bold text should be wrapped in ** (e.g., **bold text**)
      4. Keep nested items aligned with proper indentation
      5. Each bullet point should be on its own line
      
      Human: Create a study guide for {topic}
      Assistant:`);

    // Create a chain that combines the prompt template, LLM, and output parser
    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    // Generate study guide
    const studyGuide = await chain.invoke({
      topic: topic,
    });

    // Create a new conversation for the study guide
    const conversation = await prisma.chatConversation.create({
      data: {
        userId: user.id,
        title: topic,
        type: "STUDY_GUIDE",
      },
    });

    // Store the study guide as a message
    await prisma.chatMessage.create({
      data: {
        content: studyGuide,
        role: "assistant",
        conversationId: conversation.id,
      },
    });

    return NextResponse.json({
      studyGuide: studyGuide,
    });
  } catch (error) {
    console.error("Study guide generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate study guide",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
