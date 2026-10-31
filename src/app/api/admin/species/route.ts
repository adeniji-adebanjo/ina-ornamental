import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import { CATALOG_TAG } from "@/lib/queries/species";
import { revalidateTag } from "next/cache";
import {
  pickSpeciesFields,
  parseImageUrls,
  replaceSpeciesImages,
} from "@/lib/species-write";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const picked = pickSpeciesFields(body);
  if ("error" in picked)
    return NextResponse.json({ error: picked.error }, { status: 400 });
  if (!picked.data.common_name || !picked.data.slug)
    return NextResponse.json(
      { error: "Common name and slug are required" },
      { status: 400 },
    );
  const imageUrls = parseImageUrls(body.image_urls);
  if (imageUrls && "error" in imageUrls)
    return NextResponse.json({ error: imageUrls.error }, { status: 400 });

  const admin = await createAdminSupabaseClient();
  const { data, error } = await admin
    .from("species")
    .insert(picked.data)
    .select()
    .single();

  if (error) {
    const msg =
      error.code === "23505"
        ? "Another species already uses this slug"
        : "Couldn't create the species";
    console.error("Species create failed:", error.message);
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    const imgError = await replaceSpeciesImages(admin, data.id, imageUrls);
    if (imgError) {
      console.error("Species image insert failed:", imgError);
      revalidateTag(CATALOG_TAG, "max");
      return NextResponse.json(
        { error: "Species created, but its images couldn't be saved. Edit it to add them again." },
        { status: 500 },
      );
    }
  }

  revalidateTag(CATALOG_TAG, "max");
  return NextResponse.json(data);
}
