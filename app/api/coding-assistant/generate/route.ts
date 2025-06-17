import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user ID first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json(
        { error: "Code input is required" },
        { status: 400 }
      );
    }

    // Call OpenAI API to generate response
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert programming assistant. Your task is to either:
1. Explain the provided code in detail, including its purpose, how it works, and potential improvements
2. Generate high-quality, well-documented code based on the user's request

Your response should be in markdown format and include:
- Clear explanations with examples
- Code snippets with syntax highlighting
- Best practices and potential improvements
- Common pitfalls to avoid (if applicable)`,
          },
          {
            role: "user",
            content: code,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate response");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Generate a concise title
    const titleResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are a title generator. Your task is to create a short, meaningful title (maximum 50 characters) that captures the essence of a coding task or explanation. The title should be clear and descriptive but concise.

Rules:
1. Maximum 50 characters
2. Be specific but brief
3. Focus on the main task/concept
4. Use proper capitalization
5. No need for "Code for" or similar prefixes
6. No punctuation at the end

Example good titles:
- "React useEffect Hook Implementation"
- "Binary Search Algorithm"
- "MongoDB User Authentication"
- "CSS Grid Layout System"
- "API Rate Limiting Logic"`,
            },
            {
              role: "user",
              content: `Generate a concise title for this coding task. Here's the prompt and response:

PROMPT:
${code}

RESPONSE:
${content}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 60,
        }),
      }
    );

    if (!titleResponse.ok) {
      throw new Error("Failed to generate title");
    }

    const titleData = await titleResponse.json();
    const title = titleData.choices[0].message.content.trim();

    // Save to database using the correct user ID
    const conversation = await prisma.chatConversation.create({
      data: {
        type: "CODING_ASSISTANT",
        title: title,
        userId: user.id,
        messages: {
          create: [
            {
              content: code,
              role: "user",
            },
            {
              content: content,
              role: "assistant",
            },
          ],
        },
      },
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ content, id: conversation.id });
  } catch (error) {
    console.error("Error in coding assistant generation:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
