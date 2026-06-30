import { getAdminUser } from "@/lib/admin-auth";
import { cellText, loadWorkbook, parsePrice } from "@/lib/excel";
import { generateUniqueOrderReference } from "@/lib/queries/orders";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface ParsedItem {
  group: string;
  species_id: string;
  species_name: string;
  scientific_name: string | null;
  size: string | null;
  quantity: number;
  unit_price: number | null;
}

// Create a single order from an uploaded spreadsheet of line items. Customer /
// shipment details come from the form fields; this preserves the usual
// order → groups → items structure and mints a unique INA-… reference.
export async function POST(request: NextRequest) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : "";
  };

  const customer_name = str("customer_name");
  const email = str("email");
  if (!customer_name || !email)
    return NextResponse.json(
      { error: "Customer name and email are required." },
      { status: 400 },
    );
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );

  const admin = await createAdminSupabaseClient();

  // Build a name/slug/scientific → id resolver, plus canonical names for
  // denormalisation onto each line item.
  const { data: allSpecies } = await admin
    .from("species")
    .select("id, common_name, slug, scientific_name");
  const nameToId = new Map<string, string>();
  const idToRecord = new Map<
    string,
    { common_name: string; scientific_name: string | null }
  >();
  for (const s of allSpecies ?? []) {
    if (s.common_name) nameToId.set(s.common_name.toLowerCase(), s.id);
    if (s.slug) nameToId.set(s.slug.toLowerCase(), s.id);
    if (s.scientific_name) nameToId.set(s.scientific_name.toLowerCase(), s.id);
    idToRecord.set(s.id, {
      common_name: s.common_name,
      scientific_name: s.scientific_name ?? null,
    });
  }

  let workbook;
  try {
    workbook = await loadWorkbook(file);
  } catch {
    return NextResponse.json(
      { error: "Could not read the file. Upload a valid .xlsx, .xls or .csv." },
      { status: 400 },
    );
  }
  const ws = workbook.worksheets[0];
  if (!ws)
    return NextResponse.json(
      { error: "No worksheet found in file" },
      { status: 400 },
    );

  const headerIndex = new Map<string, number>();
  ws.getRow(1).eachCell((cell, col) => {
    const v = String(cell.value || "").trim().toLowerCase();
    if (v) headerIndex.set(v, col);
  });
  const groupCol = headerIndex.get("group") ?? 1;
  const speciesCol = headerIndex.get("species") ?? headerIndex.get("name") ?? 2;
  const sciCol =
    headerIndex.get("scientific name") ??
    headerIndex.get("scientific_name") ??
    headerIndex.get("scientificname") ??
    3;
  const sizeCol = headerIndex.get("size") ?? 4;
  const qtyCol = headerIndex.get("quantity") ?? headerIndex.get("qty") ?? 5;
  const priceCol =
    headerIndex.get("unit price") ??
    headerIndex.get("price") ??
    headerIndex.get("unit_price") ??
    6;

  const parsed: ParsedItem[] = [];
  const errors: string[] = [];

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const speciesText = cellText(row.getCell(speciesCol).value).trim();
    const sciText = cellText(row.getCell(sciCol).value).trim();
    const qtyText = cellText(row.getCell(qtyCol).value).trim();

    // Skip fully blank rows.
    if (!speciesText && !sciText && !qtyText) return;

    const groupName = cellText(row.getCell(groupCol).value).trim() || "Order A";
    const size = cellText(row.getCell(sizeCol).value).trim() || null;

    let speciesId = speciesText
      ? nameToId.get(speciesText.toLowerCase())
      : undefined;
    if (!speciesId && sciText) speciesId = nameToId.get(sciText.toLowerCase());

    if (!speciesId) {
      errors.push(
        `Row ${rowNumber}: Unknown species "${speciesText || sciText}"`,
      );
      return;
    }

    const qty = Number(qtyText);
    if (!Number.isInteger(qty) || qty <= 0) {
      errors.push(
        `Row ${rowNumber}: Quantity must be a whole number greater than 0`,
      );
      return;
    }

    const up = parsePrice(row.getCell(priceCol).value);
    const unit_price = Number.isFinite(up) && up >= 0 ? up : null;

    const record = idToRecord.get(speciesId);
    parsed.push({
      group: groupName,
      species_id: speciesId,
      species_name: record?.common_name || speciesText,
      scientific_name: record?.scientific_name || sciText || null,
      size,
      quantity: qty,
      unit_price,
    });
  });

  if (errors.length > 0)
    return NextResponse.json(
      {
        error: `${errors.length} row(s) need fixing before the order can be created.`,
        errors,
      },
      { status: 400 },
    );
  if (parsed.length === 0)
    return NextResponse.json(
      { error: "No order items found in the file." },
      { status: 400 },
    );

  // Group items, preserving first-seen group order for sort_order.
  const groupOrder: string[] = [];
  const itemsByGroup = new Map<string, ParsedItem[]>();
  for (const it of parsed) {
    if (!itemsByGroup.has(it.group)) {
      itemsByGroup.set(it.group, []);
      groupOrder.push(it.group);
    }
    itemsByGroup.get(it.group)!.push(it);
  }

  // Append shipment/consignee info to notes, mirroring the public order route.
  let storedNotes = str("notes");
  const shipment = str("proposed_shipment_date");
  const consigneeName = str("consignee_name");
  const consigneePhone = str("consignee_phone");
  const consigneeAddress = str("consignee_address");
  if (shipment) storedNotes += `\n\nProposed Shipment: ${shipment}`;
  if (consigneeName) storedNotes += `\nConsignee: ${consigneeName}`;
  if (consigneePhone) storedNotes += `\nConsignee Phone: ${consigneePhone}`;
  if (consigneeAddress) storedNotes += `\nConsignee Address: ${consigneeAddress}`;

  const order_reference = await generateUniqueOrderReference(admin);

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_reference,
      customer_name,
      company_name: str("company_name") || null,
      email,
      phone: str("phone") || null,
      country: str("country") || null,
      delivery_address: str("delivery_address") || null,
      notes: storedNotes.trim() || null,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderError || !order)
    return NextResponse.json(
      { error: "Could not create the order. Please try again." },
      { status: 500 },
    );

  async function rollback() {
    const { data: groups } = await admin
      .from("order_groups")
      .select("id")
      .eq("order_id", order!.id);
    const ids = (groups ?? []).map((g) => g.id);
    if (ids.length)
      await admin.from("order_items").delete().in("order_group_id", ids);
    await admin.from("order_groups").delete().eq("order_id", order!.id);
    await admin.from("orders").delete().eq("id", order!.id);
  }

  for (let i = 0; i < groupOrder.length; i++) {
    const groupName = groupOrder[i];
    const { data: groupData, error: groupError } = await admin
      .from("order_groups")
      .insert({ order_id: order.id, group_name: groupName, sort_order: i })
      .select()
      .single();
    if (groupError || !groupData) {
      await rollback();
      return NextResponse.json(
        { error: "Could not create the order. Please try again." },
        { status: 500 },
      );
    }

    const items = itemsByGroup.get(groupName)!.map((it) => ({
      order_group_id: groupData.id,
      species_id: it.species_id,
      species_name: it.species_name,
      scientific_name: it.scientific_name,
      size: it.size,
      quantity: it.quantity,
      unit_price: it.unit_price,
    }));
    const { error: itemsError } = await admin
      .from("order_items")
      .insert(items);
    if (itemsError) {
      await rollback();
      return NextResponse.json(
        { error: "Could not create the order. Please try again." },
        { status: 500 },
      );
    }
  }

  // No customer email on admin uploads (batch / back-office creation).
  return NextResponse.json({
    success: true,
    order_reference,
    order_id: order.id,
    groupCount: groupOrder.length,
    itemCount: parsed.length,
  });
}
