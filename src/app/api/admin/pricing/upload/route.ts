import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin-auth";
import { fetchAllRows } from "@/lib/supabase/paginate";
import {
  cellText,
  parsePrice,
  loadWorkbook,
  normalizeAvailability,
  applyAvailabilityUpdates,
} from "@/lib/excel";
import { checkSpreadsheetUpload } from "@/lib/upload-limits";
import { CATALOG_TAG } from "@/lib/queries/species";
import { revalidateTag } from "next/cache";

// Parse an uploaded Excel file and return species_id + price pairs
// Supports either a simple two-column sheet (Name + Price) or a location pricing template
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const badFile = checkSpreadsheetUpload(file);
  if (badFile)
    return NextResponse.json({ error: badFile }, { status: 400 });

  const workbook = await loadWorkbook(file);

  const admin = await createAdminSupabaseClient();
  const { data: allSpecies, error: speciesError } = await fetchAllRows<{
    id: string;
    common_name: string | null;
    slug: string | null;
    scientific_name: string | null;
  }>((from, to) =>
    admin
      .from("species")
      .select("id, common_name, slug, scientific_name")
      .order("id")
      .range(from, to),
  );
  if (speciesError) {
    return NextResponse.json(
      { error: `Couldn't read species: ${speciesError.message}` },
      { status: 500 },
    );
  }

  const speciesMap = new Map<string, string>();
  for (const s of allSpecies) {
    if (s.common_name) speciesMap.set(s.common_name.toLowerCase(), s.id);
    if (s.slug) speciesMap.set(s.slug.toLowerCase(), s.id);
    if (s.scientific_name)
      speciesMap.set(s.scientific_name.toLowerCase(), s.id);
  }

  const ws = workbook.worksheets[0];
  if (!ws) {
    return NextResponse.json(
      { error: "No worksheet found in file" },
      { status: 400 },
    );
  }

  // The header is usually row 1, but the app's own price-list export puts a
  // title block above it. Use the first of the top 20 rows that names a
  // species/name column, so an exported list can be re-uploaded as-is.
  let headerRowNum = 1;
  for (let r = 1; r <= Math.min(20, ws.rowCount); r++) {
    const labels: string[] = [];
    ws.getRow(r).eachCell((cell) =>
      labels.push(cellText(cell.value).trim().toLowerCase()),
    );
    if (labels.includes("species") || labels.includes("name")) {
      headerRowNum = r;
      break;
    }
  }
  const headerRow = ws.getRow(headerRowNum);
  const headerIndex = new Map<string, number>();
  headerRow.eachCell((cell, colNumber) => {
    const value = cellText(cell.value).trim().toLowerCase();
    if (value) headerIndex.set(value, colNumber);
  });

  const hasExplicitPriceHeader =
    headerIndex.has("price") ||
    headerIndex.has("unit price") ||
    headerIndex.has("custom price") ||
    headerIndex.has("amount");

  const knownHeaders = new Set<number>([
    headerIndex.get("name"),
    headerIndex.get("species"),
    headerIndex.get("scientific name"),
    headerIndex.get("scientificname"),
    headerIndex.get("scientific_name"),
    headerIndex.get("size"),
    headerIndex.get("class"),
    headerIndex.get("availability"),
    headerIndex.get("price"),
    headerIndex.get("unit price"),
    headerIndex.get("custom price"),
    headerIndex.get("amount"),
    // Descriptive columns people commonly add — never prices.
    ...["#", "no", "no.", "s/n", "notes", "note", "comments", "qty/box",
      "qty per box", "box qty", "pcs/box", "unit", "origin", "category",
      "slug", "tags", "description"].map((h) => headerIndex.get(h)),
  ].filter(Boolean) as number[]);

  const locationColumns: { col: number; location: string }[] = [];
  headerRow.eachCell((cell, colNumber) => {
    const value = cellText(cell.value).trim();
    if (!value) return;
    if (!knownHeaders.has(colNumber)) {
      locationColumns.push({ col: colNumber, location: value });
    }
  });

  let priceCol: number | null = null;
  const nameCol = headerIndex.get("name") ?? headerIndex.get("species") ?? 1;
  const sciCol =
    headerIndex.get("scientific name") ||
    headerIndex.get("scientificname") ||
    headerIndex.get("scientific_name");
  const availCol = headerIndex.get("availability");

  const items: { species_id: string; price: number }[] = [];
  // Availability is global per species; capture it here to sync back afterwards.
  const availabilityById = new Map<string, string>();
  const errors: string[] = [];

  if (hasExplicitPriceHeader || locationColumns.length === 0) {
    // Simple format: Name/Species in column A and price in a dedicated Price column or column B.
    priceCol =
      headerIndex.get("price") ||
      headerIndex.get("unit price") ||
      headerIndex.get("custom price") ||
      headerIndex.get("amount") ||
      2;

    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowNum) return;
      const speciesName = cellText(row.getCell(nameCol).value).trim();
      const scientificName = sciCol
        ? cellText(row.getCell(sciCol).value).trim()
        : "";
      const price = parsePrice(row.getCell(priceCol!).value);

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

      if (availCol && !availabilityById.has(speciesId)) {
        const avail = normalizeAvailability(row.getCell(availCol).value);
        if (avail) availabilityById.set(speciesId, avail);
      }

      if (isNaN(price) || price <= 0) {
        errors.push(`Row ${rowNumber}: Invalid price for "${speciesName || scientificName}"`);
        return;
      }

      items.push({ species_id: speciesId, price });
    });
  } else {
    if (locationColumns.length > 1) {
      return NextResponse.json(
        {
          error:
            "Multiple pricing columns found. Upload a template with only one location price column for custom pricing.",
        },
        { status: 400 },
      );
    }

    priceCol = locationColumns[0].col;

    ws.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowNum) return;
      const speciesName = cellText(row.getCell(nameCol).value).trim();
      const scientificName = sciCol
        ? cellText(row.getCell(sciCol).value).trim()
        : "";
      const price = parsePrice(row.getCell(priceCol!).value);

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

      if (availCol && !availabilityById.has(speciesId)) {
        const avail = normalizeAvailability(row.getCell(availCol).value);
        if (avail) availabilityById.set(speciesId, avail);
      }

      if (isNaN(price) || price <= 0) {
        errors.push(`Row ${rowNumber}: Invalid price for "${speciesName || scientificName}"`);
        return;
      }

      items.push({ species_id: speciesId, price });
    });
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "No valid pricing data found", errors },
      { status: 400 },
    );
  }

  // Templates carry one row per species+size; a price list holds one price per
  // species. Collapse duplicates, keeping the first price seen per species.
  const seenSpecies = new Set<string>();
  const dedupedItems = items.filter((item) => {
    if (seenSpecies.has(item.species_id)) return false;
    seenSpecies.add(item.species_id);
    return true;
  });

  const availabilityUpdated = await applyAvailabilityUpdates(
    admin,
    availabilityById,
  );
  // Availability is part of the cached catalogue data.
  if (availabilityUpdated > 0) revalidateTag(CATALOG_TAG, "max");

  return NextResponse.json({ items: dedupedItems, errors, availabilityUpdated });
}
