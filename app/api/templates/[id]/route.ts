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

    // Verify the template belongs to the user
    const template = await prisma.template.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    });

    if (!template) {
      return new NextResponse(
        JSON.stringify({ error: "Template not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    await prisma.template.delete({
      where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Template deletion error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to delete template" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 