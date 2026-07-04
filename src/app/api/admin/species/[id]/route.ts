import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/queries/species";
import { revalidateTag } from "next/cache";
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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { image_urls, ...speciesData } = body;

  const admin = await createAdminSupabaseClient();
  const { data, error } = await admin
    .from("species")
    .update(speciesData)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  // Replace images
  if (image_urls !== undefined) {
    await admin.from("species_images").delete().eq("species_id", id);
    if (image_urls.length > 0) {
      const images = image_urls.map((url: string, i: number) => ({
        species_id: id,
        image_url: url,
        sort_order: i,
      }));
      await admin.from("species_images").insert(images);
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
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminSupabaseClient();
  const { error } = await admin.from("species").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  revalidateTag(CATALOG_TAG, "max");
  return NextResponse.json({ success: true });
}
