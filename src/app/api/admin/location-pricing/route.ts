import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/paginate";
import {
  cellText,
  parsePrice,
  loadWorkbook,
  normalizeAvailability,
  applyAvailabilityUpdates,
} from "@/lib/excel";

// GET: Fetch all location pricing data (or filter by location)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const location = request.nextUrl.searchParams.get("location");

  const admin = await createAdminSupabaseClient();
  const { data, error } = await fetchAllRows((from, to) => {
    let query = admin
      .from("location_pricing")
      .select("*, species:species(id, common_name, scientific_name, slug, sizes)")
      .order("location")
      .order("species_id")
      .order("id");

    if (location) {
      query = query.eq("location", location);
    }

    return query.range(from, to);
  });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST: Upload bulk pricing from parsed Excel data
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") || "";
  const admin = await createAdminSupabaseClient();

  if (contentType.includes("multipart/form-data")) {
    // Handle Excel file upload
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const workbook = await loadWorkbook(file);

    // Get all species for name-to-id mapping
    const { data: allSpecies } = await admin
      .from("species")
      .select("id, common_name, slug, scientific_name");
    const speciesMap = new Map<string, string>();
    for (const s of allSpecies ?? []) {
      if (s.common_name) speciesMap.set(s.common_name.toLowerCase(), s.id);
      if (s.slug) speciesMap.set(s.slug.toLowerCase(), s.id);
      if (s.scientific_name)
        speciesMap.set(s.scientific_name.toLowerCase(), s.id);
    }

    const pricingRows: {
      species_id: string;
      location: string;
      size: string | null;
      price: number;
    }[] = [];
    const errors: string[] = [];
    // Availability is global per species; capture it here to sync back afterwards.
    const availabilityById = new Map<string, string>();

    const ws = workbook.worksheets[0];
    if (!ws) {
      return NextResponse.json(
        { error: "No worksheet found in file" },
        { status: 400 },
      );
    }

    const headerRow = ws.getRow(1);
    const knownHeaders = new Map<string, number>();
    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value || "")
        .trim()
        .toLowerCase();
      if (!val) return;
      knownHeaders.set(val, colNumber);
    });

    const nameCol =
      knownHeaders.get("name") || knownHeaders.get("species") || 1;
    const sizeCol = knownHeaders.get("size") || 2;
    const classCol = knownHeaders.get("class");
    const scientificNameCol = knownHeaders.get("scientific name");
    const availabilityCol = knownHeaders.get("availability");

    const recognizedCols = new Set<number>(
      [nameCol, sizeCol, classCol, scientificNameCol, availabilityCol].filter(
        Boolean,
      ) as number[],
    );

    const locationColumns: { col: number; location: string }[] = [];
    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value || "").trim();
      if (!val) return;
      if (!recognizedCols.has(colNumber)) {
        locationColumns.push({ col: colNumber, location: val });
      }
    });

    if (locationColumns.length === 0) {
      return NextResponse.json(
        {
          error:
            "Invalid format. Headers should include Name/Species, Size, and one or more location columns.",
        },
        { status: 400 },
      );
    }

    // Parse data rows
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const speciesName = cellText(row.getCell(nameCol).value).trim();
      const scientificName = scientificNameCol
        ? cellText(row.getCell(scientificNameCol).value).trim()
        : "";
      const size = cellText(row.getCell(sizeCol).value).trim() || null;

      if (!speciesName && !scientificName) return;

      let speciesId = speciesName
        ? speciesMap.get(speciesName.toLowerCase())
        : undefined;
      if (!speciesId && scientificName) {
        speciesId = speciesMap.get(scientificName.toLowerCase());
      }

      if (!speciesId) {
        const unknownValue = speciesName || scientificName;
        errors.push(`Row ${rowNumber}: Unknown species "${unknownValue}"`);
        return;
      }

      if (availabilityCol && !availabilityById.has(speciesId)) {
        const avail = normalizeAvailability(row.getCell(availabilityCol).value);
        if (avail) availabilityById.set(speciesId, avail);
      }

      for (const { col, location } of locationColumns) {
        const price = parsePrice(row.getCell(col).value);
        if (!isNaN(price) && price > 0) {
          pricingRows.push({ species_id: speciesId, location, size, price });
        }
      }
    });

    if (pricingRows.length === 0) {
      return NextResponse.json(
        { error: "No valid pricing data found", errors },
        { status: 400 },
      );
    }

    // The unique key is (species_id, location, size); a sheet can repeat the
    // same species+size (duplicate rows, or a species listed twice), which
    // would fail the atomic insert. Collapse to one row per key, keeping the
    // last price seen so a corrected later row wins.
    const dedupedByKey = new Map<string, (typeof pricingRows)[number]>();
    for (const row of pricingRows) {
      dedupedByKey.set(
        `${row.species_id}|${row.location}|${row.size ?? ""}`,
        row,
      );
    }
    const dedupedRows = [...dedupedByKey.values()];
    const duplicateCount = pricingRows.length - dedupedRows.length;

    // Upsert: delete existing for these locations, then insert
    const locations = [...new Set(dedupedRows.map((r) => r.location))];
    await admin.from("location_pricing").delete().in("location", locations);

    const { error: insertError } = await admin
      .from("location_pricing")
      .insert(dedupedRows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const availabilityUpdated = await applyAvailabilityUpdates(
      admin,
      availabilityById,
    );

    return NextResponse.json({
      inserted: dedupedRows.length,
      locations,
      availabilityUpdated,
      duplicatesMerged: duplicateCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  // JSON body: manual entries
  const body = await request.json();
  const { items } = body;
  if (!items?.length) {
    return NextResponse.json(
      { error: "No pricing items provided" },
      { status: 400 },
    );
  }

  const { error } = await admin.from("location_pricing").upsert(items, {
    onConflict: "species_id,location,size",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: items.length });
}

// DELETE: Clear all pricing for a given location
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const location = request.nextUrl.searchParams.get("location");
  if (!location) {
    return NextResponse.json({ error: "Location required" }, { status: 400 });
  }

  const admin = await createAdminSupabaseClient();
  await admin.from("location_pricing").delete().eq("location", location);

  return NextResponse.json({ success: true });
}

// PATCH: Rename a location (updates every pricing row for that location)
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const from = typeof body?.from === "string" ? body.from.trim() : "";
  const to = typeof body?.to === "string" ? body.to.trim() : "";
  if (!from || !to) {
    return NextResponse.json(
      { error: "Both current and new location names are required" },
      { status: 400 },
    );
  }
  if (from === to) return NextResponse.json({ success: true });

  const admin = await createAdminSupabaseClient();

  // Refuse to merge into an existing location — that would collide on the
  // (species_id, location, size) unique key. The admin should delete one first.
  const { count } = await admin
    .from("location_pricing")
    .select("id", { count: "exact", head: true })
    .eq("location", to);
  if (count && count > 0) {
    return NextResponse.json(
      { error: `A location named "${to}" already exists` },
      { status: 409 },
    );
  }

  const { error } = await admin
    .from("location_pricing")
    .update({ location: to })
    .eq("location", from);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
