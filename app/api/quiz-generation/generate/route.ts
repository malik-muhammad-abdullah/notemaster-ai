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
    const { topic, numQuestions, questionType } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (!numQuestions || numQuestions < 10 || numQuestions > 20) {
      return NextResponse.json(
        { error: "Number of questions must be between 10 and 20" },
        { status: 400 }
      );
    }

    if (
      !questionType ||
      !["mcq", "true_false", "fill_in_blank"].includes(questionType)
    ) {
      return NextResponse.json(
        { error: "Invalid question type" },
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

    // Query vector store for relevant documents
    const vectorSearchResults = await queryVectorStore(topic, user.id, 6);
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
      modelName: "gpt-4",
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.7,
    });

    // Create a specialized prompt template for quiz generation
    const promptTemplate = PromptTemplate.fromTemplate(`
      You are an expert quiz creator specializing in educational assessment.
      Your goal is to create high-quality practice questions that test understanding and knowledge of specific topics.
      
      Create a quiz with the following specifications:
      Topic: {topic}
      Number of Questions: {numQuestions}
      Question Type: {questionType}
      
      Use the following context to create relevant and accurate questions:
      {context}
      
      Format your response in the following way:
      
      # {topic} Quiz
      
      ## Instructions
      [Provide clear instructions based on the question type]
      
      ## Questions
      [Number each question and format based on type]
      
      ## Answer Key
      [Provide answers with explanations]
      
      Formatting rules for different question types:
      
      For Multiple Choice (MCQ):
      **Question 1.** Question text
      
      A) Option 1  
      B) Option 2  
      C) Option 3  
      D) Option 4
      
      For True/False:
      **Question 1.** Question text
      
      - True or False
      
      For Fill in the Blanks:
      **Question 1.** Question text with _____ for blanks
      
      Important formatting rules:
      1. Always put a blank line between the question text and options
      2. Each option MUST be on its own line with two spaces at the end of the line
      3. Use exactly one blank line between questions
      4. For MCQ, use capital letters A) B) C) D) for options
      5. For True/False, use a hyphen and indent the options
      6. Make all question numbers bold using markdown (**Question X.**)
      7. Include the word "Question" before each number
      8. Use a period after the question number
      9. Add two spaces at the end of each option line to force a line break
      10. Do not use indentation for options to ensure proper line breaks
      
      In the answer key:
      * For MCQ: Include the correct letter and explanation
      * For True/False: State True or False and explain why
      * For Fill in the Blanks: Provide the correct word/phrase and context
      
      Example MCQ formatting:
      **Question 1.** What is the capital of France?
      
      A) London  
      B) Berlin  
      C) Paris  
      D) Madrid
      
      **Question 2.** Which planet is known as the Red Planet?
      
      A) Venus  
      B) Mars  
      C) Jupiter  
      D) Saturn
      
      Note: Each option MUST end with two spaces and a newline. This is crucial for proper markdown formatting.
      
      Make sure questions:
      1. Are clear and unambiguous
      2. Test different cognitive levels
      3. Cover various aspects of the topic
      4. Include a mix of difficulty levels
      5. Have detailed explanations in the answer key
      6. Are based on the provided context when possible
      7. Are factually accurate and aligned with the source material
      
      If the provided context is insufficient or marked as "No relevant documents found",
      generate questions based on general knowledge of the topic while maintaining accuracy.
      
      Human: Create a {questionType} quiz about {topic} with {numQuestions} questions
      Assistant:`);

    // Create a chain that combines the prompt template, LLM, and output parser
    const chain = RunnableSequence.from([
      promptTemplate,
      llm,
      new StringOutputParser(),
    ]);

    // Generate quiz
    const quiz = await chain.invoke({
      topic,
      numQuestions,
      questionType,
      context: formattedDocs,
    });

    // Create a new conversation for the quiz
    const conversation = await prisma.chatConversation.create({
      data: {
        userId: user.id,
        title: topic,
        type: "QUIZ_GENERATION",
      },
    });

    // Store the quiz as a message
    await prisma.chatMessage.create({
      data: {
        content: quiz,
        role: "assistant",
        conversationId: conversation.id,
      },
    });

    return NextResponse.json({
      quiz: quiz,
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate quiz",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
