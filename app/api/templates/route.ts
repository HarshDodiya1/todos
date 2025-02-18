import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../auth/[...nextauth]/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const templates = await prisma.template.findMany({
      where: { userId: session.user.id },
      include: { todos: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(templates);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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
    const { name } = body;

    if (!name) {
      return new NextResponse(
        JSON.stringify({ error: "Name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set all other templates to inactive
    await prisma.template.updateMany({
      where: { userId: session.user.id },
      data: { isActive: false }
    });

    // Create new template
    const template = await prisma.template.create({
      data: {
        name,
        isActive: true,
        userId: session.user.id
      },
      include: { todos: true }
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Template creation error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to create template", details: error }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, name, isActive } = body;

    if (isActive) {
      // Set all other templates to inactive
      await prisma.template.updateMany({
        where: { 
          userId: session.user.id,
          NOT: { id }
        },
        data: { isActive: false }
      });
    }

    const template = await prisma.template.update({
      where: { id },
      data: { name, isActive },
      include: { todos: true }
    });

    return NextResponse.json(template);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse("Template ID required", { status: 400 });
    }

    await prisma.template.delete({
      where: { id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
} 