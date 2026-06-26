import { getAdminUser } from "@/lib/admin-auth";
import { deletePost, updatePost } from "@/lib/blog";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  try {
    const post = await updatePost(Number(id), {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      status: body.status,
      slug: body.slug || undefined,
      categories: Array.isArray(body.categories) ? body.categories : undefined,
      featured_media:
        body.featured_media === null ? 0 : body.featured_media || undefined,
    });
    return NextResponse.json(post);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update post" },
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
    await deletePost(Number(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete post" },
      { status: 502 },
    );
  }
}
