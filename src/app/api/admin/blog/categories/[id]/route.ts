import { getAdminUser } from "@/lib/admin-auth";
import { deleteCategory, updateCategory } from "@/lib/blog";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body?.name?.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const category = await updateCategory(Number(id), body.name.trim());
    return NextResponse.json(category);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to rename category" },
      { status: 502 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await deleteCategory(Number(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete category" },
      { status: 502 },
    );
  }
}
