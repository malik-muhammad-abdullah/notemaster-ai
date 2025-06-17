import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";

export async function GET() {
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

    const conversations = await prisma.chatConversation.findMany({
      where: {
        userId: user.id,
        type: "CODING_ASSISTANT",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // Transform the data to match the expected format
    const codeAssistants = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      content: conv.messages[conv.messages.length - 1]?.content || "",
      createdAt: conv.createdAt,
    }));

    return NextResponse.json({ codeAssistants });
  } catch (error) {
    console.error("Error fetching code assistants:", error);
    return NextResponse.json(
      { error: "Failed to fetch code assistants" },
      { status: 500 }
    );
  }
}
