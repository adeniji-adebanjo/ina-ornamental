import { getAdminUser } from "@/lib/admin-auth";
import { uploadMedia } from "@/lib/blog";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (!file.type.startsWith("image/"))
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 },
    );

  try {
    const media = await uploadMedia(file, file.name || "upload");
    return NextResponse.json(media);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 502 },
    );
  }
}
