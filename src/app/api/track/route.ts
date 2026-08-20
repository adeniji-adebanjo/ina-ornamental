import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

// `ilike` gives us case-insensitive matching, but its pattern syntax would let
// a caller pass "%" and match somebody else's order — neutralise the wildcards
// so the pattern can only ever match itself. `*` is PostgREST's own alias for
// `%`, and `_` is escaped for correctness too: it occurs in real addresses.
function escapeLike(value: string): string {
  return value.replace(/[\\%_*]/g, (c) => `\\${c}`);
}

// Public shipment lookup. Orders are not publicly readable (RLS allows insert
// only), so this route reads with the admin client and gates on reference +
// email — the two things the customer received in their confirmation email.
export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const limit = rateLimit(`track:${ip}`, { limit: 12, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many lookups. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const reference = String(body.reference ?? "").trim();
  const email = String(body.email ?? "").trim();

  if (!reference || !email) {
    return NextResponse.json(
      { error: "Enter both your order reference and the email you ordered with." },
      { status: 400 },
    );
  }

  const admin = await createAdminSupabaseClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "order_reference, customer_name, status, awb_number, airline_name, manual_status",
    )
    .ilike("order_reference", escapeLike(reference))
    .ilike("email", escapeLike(email))
    .maybeSingle();

  // One message for "no such reference" and "wrong email" alike, so this can't
  // be used to enumerate order references.
  if (error || !data) {
    return NextResponse.json(
      { error: "We couldn't find an order with that reference and email address." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    order_reference: data.order_reference,
    customer_name: data.customer_name,
    status: data.status,
    awb_number: data.awb_number,
    airline_name: data.airline_name,
    manual_status: data.manual_status,
  });
}
