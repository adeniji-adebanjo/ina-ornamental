import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { CATALOG_TAG } from "@/lib/queries/species";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
    .insert(speciesData)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  // Insert images
  if (image_urls?.length > 0) {
    const images = image_urls.map((url: string, i: number) => ({
      species_id: data.id,
      image_url: url,
      sort_order: i,
    }));
    await admin.from("species_images").insert(images);
  }

  revalidateTag(CATALOG_TAG, "max");
  return NextResponse.json(data);
}
