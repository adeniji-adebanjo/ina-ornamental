import { getAdminUser } from "@/lib/admin-auth";
import { uploadMedia } from "@/lib/blog";
import { checkImageUpload } from "@/lib/upload-limits";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const invalid = await checkImageUpload(file);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  try {
    const media = await uploadMedia(file, file.name || "upload");
    return NextResponse.json(media);
  } catch (e) {
    console.error("Blog media upload failed:", e);
    return NextResponse.json(
      { error: "The image couldn't be uploaded to the media library. Please try again." },
      { status: 502 },
    );
  }
}
