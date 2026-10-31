import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import { fetchAllRows } from "@/lib/supabase/paginate";

// GET: Fetch prices for a specific location (used when creating client price lists)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const location = request.nextUrl.searchParams.get("location");
  if (!location)
    return NextResponse.json(
      { error: "Location is required" },
      { status: 400 },
    );

  const admin = await createAdminSupabaseClient();

  // A location carries one row per species+size, so it can exceed the 1000-row
  // response cap. (species_id, location, size) is unique, so this order is
  // stable across pages and puts the generic (no-size) price first per species.
  const { data, error } = await fetchAllRows((from, to) =>
    admin
      .from("location_pricing")
      .select("species_id, size, price")
      .eq("location", location)
      .order("species_id")
      .order("size", { nullsFirst: true })
      .range(from, to),
  );

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
