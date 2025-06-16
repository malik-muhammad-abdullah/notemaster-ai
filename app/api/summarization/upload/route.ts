import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { extractTextFromFile } from "@/lib/file-text-extractor";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in environment variables");
}

export async function POST(request: Request) {
  try {
    console.log("Summarization Upload API: Request received");
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("Summarization Upload API: Unauthorized - no valid session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Extract text from the uploaded file
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileContent = await extractTextFromFile(buffer, file.type, file.name);

    if (!fileContent) {
      return NextResponse.json(
        { error: "Failed to extract content from file" },
        { status: 400 }
      );
    }

    // Initialize language model
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.2,
    });

    // Create a specialized prompt template for summarization
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an expert summarization assistant that excels at creating concise, accurate summaries of documents and content.
      Your goal is to extract the key information and main points while maintaining accuracy.
      
      When creating a summary:
      1. Identify and focus on the most important information
      2. Remove redundant or unnecessary details
      3. Maintain the original meaning and intent of the content
      4. Use clear, straightforward language
      5. Organize information logically
      
      Format your summary using proper markdown:
      - Use headings (##) for main sections
      - Use bullet points or numbered lists where appropriate
      - Use bold (**) for important terms or concepts
      - Use italics (*) for emphasis
      - Maintain proper spacing between sections
      - Include a brief overview at the start
      - End with key takeaways if applicable
      
      Please summarize the following document:
      
      {document}
      
      Provide a comprehensive summary that captures the main points and key details of the document.
      Remember to use proper markdown formatting for better readability.
    `);

    // Create a chain that combines the prompt template, LLM, and output parser
    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    // Generate response
    const summary = await chain.invoke({
      document: fileContent,
    });

    console.log("Summarization Upload API: Summary generated successfully");
    return NextResponse.json({
      message: {
        content: summary,
      },
    });
  } catch (error) {
    console.error("Summarization Upload API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
