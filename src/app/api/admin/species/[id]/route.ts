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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
  const imageUrls = parseImageUrls(body.image_urls);
  if (imageUrls && "error" in imageUrls)
    return NextResponse.json({ error: imageUrls.error }, { status: 400 });

  const admin = await createAdminSupabaseClient();
  const { data, error } = await admin
    .from("species")
    .update({ ...picked.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    const msg =
      error.code === "23505"
        ? "Another species already uses this slug"
        : "Couldn't save the species";
    console.error("Species update failed:", error.message);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  if (!data)
    return NextResponse.json({ error: "Species not found" }, { status: 404 });

  if (Array.isArray(imageUrls)) {
    const imgError = await replaceSpeciesImages(admin, id, imageUrls);
    if (imgError) {
      console.error("Species image update failed:", imgError);
      revalidateTag(CATALOG_TAG, "max");
      return NextResponse.json(
        { error: "Details saved, but the images couldn't be updated. Please try again." },
        { status: 500 },
      );
    }
  }

  revalidateTag(CATALOG_TAG, "max");
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminSupabaseClient();
  const { error } = await admin.from("species").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  revalidateTag(CATALOG_TAG, "max");
  return NextResponse.json({ success: true });
}
