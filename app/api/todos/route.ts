import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/auth";

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
    const { content, templateId, date } = body;

    // Validate input
    if (!content || !templateId || !date) {
      return new NextResponse(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // First verify the template belongs to the user
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

    const todo = await prisma.todo.create({
      data: {
        content,
        date,
        templateId,
        order: 0 // Add default order
      },
      include: {
        template: true
      }
    });

    return NextResponse.json(todo);
  } catch (error) {
    console.error("Todo creation error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create todo" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { id, content, completed } = body;

    // Verify the todo belongs to the user's template
    const todo = await prisma.todo.findFirst({
      where: {
        id,
        template: {
          userId: session.user.id
        }
      }
    });

    if (!todo) {
      return new NextResponse(
        JSON.stringify({ error: "Todo not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: {
        content,
        completed,
      },
      include: {
        template: true
      }
    });

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error("Todo update error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to update todo" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
