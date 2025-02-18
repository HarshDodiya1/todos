import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/auth";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify the todo belongs to the user's template
    const todo = await prisma.todo.findFirst({
      where: {
        id: params.id,
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

    await prisma.todo.delete({
      where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Todo deletion error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete todo" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 