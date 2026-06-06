import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";

// GET: Fetch prices for a specific location (used when creating client price lists)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const location = request.nextUrl.searchParams.get("location");
  if (!location)
    return NextResponse.json(
      { error: "Location is required" },
      { status: 400 },
    );

  const admin = await createAdminSupabaseClient();
  const { data, error } = await admin
    .from("location_pricing")
    .select("species_id, size, price")
    .eq("location", location);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
