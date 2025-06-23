import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/prisma/client";

// PUT: Update a task
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const taskId = params.id;
    const { title, description, dueDate, status, priority, reminders } =
      await request.json();

    // Verify task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: user.id,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Delete existing reminders
    await prisma.taskReminder.deleteMany({
      where: {
        taskId,
      },
    });

    // Create new reminders with proper date calculation
    const dueDateObj = new Date(dueDate);
    let reminderData = [];

    if (reminders && reminders.length > 0) {
      reminderData = reminders.map((reminder: { minutes: number }) => ({
        sendAt: new Date(dueDateObj.getTime() - reminder.minutes * 60000),
      }));
    }

    // Update task with new reminders
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        dueDate: dueDateObj,
        status,
        priority,
        reminders:
          reminderData.length > 0
            ? {
                create: reminderData,
              }
            : undefined,
      },
      include: {
        reminders: true,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const taskId = params.id;

    // Verify task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: user.id,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Delete task (this will cascade delete reminders)
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
