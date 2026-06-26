import { getAdminUser } from "@/lib/admin-auth";
import { createPost, fetchPosts } from "@/lib/blog";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("category")
    ? Number(searchParams.get("category"))
    : undefined;

  try {
    const result = await fetchPosts({
      page,
      perPage: 50,
      search,
      categoryId,
      status: "any",
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load posts" },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body?.title?.trim())
    return NextResponse.json({ error: "Title is required" }, { status: 400 });

  try {
    const post = await createPost({
      title: body.title,
      content: body.content || "",
      excerpt: body.excerpt || "",
      status: body.status === "publish" ? "publish" : "draft",
      slug: body.slug || undefined,
      categories: Array.isArray(body.categories) ? body.categories : undefined,
      featured_media: body.featured_media || undefined,
    });
    return NextResponse.json(post);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create post" },
      { status: 502 },
    );
  }
}
