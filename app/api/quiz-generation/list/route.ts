import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all quizzes for the user
    const quizzes = await prisma.chatConversation.findMany({
      where: {
        userId: user.id,
        type: "QUIZ_GENERATION",
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    // Format the response
    const formattedQuizzes = quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title || "Untitled Quiz",
      content: quiz.messages[0]?.content || "",
      createdAt: quiz.createdAt,
    }));

    return NextResponse.json({
      quizzes: formattedQuizzes,
    });
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch quizzes",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
