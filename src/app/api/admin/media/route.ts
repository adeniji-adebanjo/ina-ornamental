import { getAdminUser } from "@/lib/admin-auth";
import { isBlogWritable, uploadMedia } from "@/lib/blog";
import { NextRequest, NextResponse } from "next/server";

// General-purpose image upload to the WordPress media library
// (cms.inaornamentalfish.com/wp-content/uploads). Used by admin image inputs
// such as the species form. Reuses the same WP Application-Password credentials
// and uploadMedia helper as the blog feature.
export async function POST(request: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isBlogWritable())
    return NextResponse.json(
      {
        error:
          "WordPress media upload is not configured. Set WP_API_URL, WP_USERNAME and WP_APP_PASSWORD.",
      },
      { status: 400 },
    );

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
