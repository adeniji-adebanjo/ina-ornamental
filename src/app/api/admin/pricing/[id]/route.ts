import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";

// Accept an empty string / null (clears the date) or a YYYY-MM-DD value.
function normalizeDate(v: unknown): string | null | undefined {
  if (v === null || v === "") return null;
  if (typeof v !== "string") return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}

// Update a price list's validity window (valid_from / valid_until).
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const updates: { valid_from?: string | null; valid_until?: string | null } =
    {};
  if ("valid_from" in body) {
    const d = normalizeDate(body.valid_from);
    if (d === undefined)
      return NextResponse.json(
        { error: "Valid-from must be a YYYY-MM-DD date or empty." },
        { status: 400 },
      );
    updates.valid_from = d;
  }
  if ("valid_until" in body) {
    const d = normalizeDate(body.valid_until);
    if (d === undefined)
      return NextResponse.json(
        { error: "Valid-until must be a YYYY-MM-DD date or empty." },
        { status: 400 },
      );
    updates.valid_until = d;
  }

  // Guard against an inverted window when both bounds are present.
  const from = updates.valid_from;
  const until = updates.valid_until;
  if (from && until && until < from)
    return NextResponse.json(
      { error: "Valid-until cannot be before valid-from." },
      { status: 400 },
    );

  if (Object.keys(updates).length === 0)
    return NextResponse.json(
      { error: "Nothing to update." },
      { status: 400 },
    );

  const admin = await createAdminSupabaseClient();
  const { data, error } = await admin
    .from("client_price_lists")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = await createAdminSupabaseClient();
  // Items will cascade-delete if FK is set, otherwise delete manually
  await admin.from("client_price_items").delete().eq("price_list_id", id);
  const { error } = await admin
    .from("client_price_lists")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
