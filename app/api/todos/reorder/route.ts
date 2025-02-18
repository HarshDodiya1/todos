import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { todos, templateId } = body;

    // Verify the template belongs to the user
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        userId: session.user.id,
      },
    });

    if (!template) {
      return new NextResponse(
        JSON.stringify({ error: "Template not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update todos in transaction to maintain order
    await prisma.$transaction(
      todos.map((todo: any, index: number) =>
        prisma.todo.update({
          where: { id: todo.id },
          data: { order: index },
        })
      )
    );

    const updatedTodos = await prisma.todo.findMany({
      where: { templateId },
      orderBy: { order: "asc" },
      include: {
        template: true
      }
    });

    return NextResponse.json(updatedTodos);
  } catch (error) {
    console.error("Todo reorder error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to reorder todos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
