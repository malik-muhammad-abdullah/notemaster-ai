import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Study guide ID is required" },
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

    // Verify the study guide exists and belongs to the user
    const studyGuide = await prisma.chatConversation.findFirst({
      where: {
        id: id,
        userId: user.id,
        type: "STUDY_GUIDE",
      },
    });

    if (!studyGuide) {
      return NextResponse.json(
        { error: "Study guide not found" },
        { status: 404 }
      );
    }

    // Delete the study guide and its messages
    await prisma.chatMessage.deleteMany({
      where: {
        conversationId: id,
      },
    });

    await prisma.chatConversation.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({
      message: "Study guide deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting study guide:", error);
    return NextResponse.json(
      {
        error: "Failed to delete study guide",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
