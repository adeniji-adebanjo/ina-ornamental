import { getAdminUser } from "@/lib/admin-auth";
import { createCategory, fetchCategories } from "@/lib/blog";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const categories = await fetchCategories({ fresh: true });
    return NextResponse.json(categories);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load categories" },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body?.name?.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const category = await createCategory(body.name.trim());
    return NextResponse.json(category);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create category" },
      { status: 502 },
    );
  }
}
