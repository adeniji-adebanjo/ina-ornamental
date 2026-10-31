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
  const { data, error } = await fetchAllRows<{
    species_id: string;
    size: string | null;
    price: number | string;
    species: { sizes: string[] | null } | { sizes: string[] | null }[] | null;
  }>((from, to) =>
    admin
      .from("location_pricing")
      .select("species_id, size, price, species:species(sizes)")
      .eq("location", location)
      .order("species_id")
      .order("size", { nullsFirst: true })
      .range(from, to),
  );

  if (error) {
    console.error("Location pricing lookup failed:", error.message);
    return NextResponse.json(
      { error: "Couldn't load this location's prices" },
      { status: 500 },
    );
  }

  // The price list takes the FIRST row per species, so order each species'
  // rows deliberately: the no-size price, then sizes in the order the species
  // lists them (how admins enter them, typically smallest first), then any
  // size the species doesn't list. Alphabetical order put "Large" first.
  const rank = (row: (typeof data)[number]) => {
    if (row.size == null) return -1;
    const sp = Array.isArray(row.species) ? row.species[0] : row.species;
    const i = (sp?.sizes ?? []).findIndex(
      (s) => s.toLowerCase() === row.size!.toLowerCase(),
    );
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const rows = data
    .map((row) => ({ row, r: rank(row) }))
    .sort(
      (a, b) =>
        a.row.species_id.localeCompare(b.row.species_id) || a.r - b.r,
    )
    .map(({ row }) => ({
      species_id: row.species_id,
      size: row.size,
      price: row.price,
    }));

  return NextResponse.json(rows);
}
