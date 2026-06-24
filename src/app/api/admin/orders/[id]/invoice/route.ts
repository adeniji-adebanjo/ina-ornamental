import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";

export async function GET(
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

  // Fetch order with groups and items
  const { data: order, error } = await admin
    .from("orders")
    .select(
      `
      *,
      order_groups (
        *,
        order_items (*)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error || !order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Sort groups and items
  order.order_groups?.sort(
    (a: { sort_order: number }, b: { sort_order: number }) =>
      a.sort_order - b.sort_order,
  );
  for (const group of order.order_groups || []) {
    group.order_items?.sort(
      (a: { species_name: string }, b: { species_name: string }) =>
        a.species_name.localeCompare(b.species_name),
    );
  }

  // Generate PDF
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const pdfPromise = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Header
  doc.fontSize(20).text("INÁ Ornamental Fish", { align: "center" });
  doc.fontSize(10).text("Premium Ornamental Fish Export", { align: "center" });
  doc.moveDown(0.5);

  // Invoice title
  doc
    .fontSize(16)
    .fillColor("#3b655d")
    .text("INVOICE / PACKING LIST", { align: "center" });
  doc.fillColor("#000000");
  doc.moveDown();

  // Order details
  doc.fontSize(10);
  const detailsTop = doc.y;

  doc.text(`Reference: ${order.order_reference}`, 50, detailsTop);
  doc.text(
    `Date: ${new Date(order.submitted_at).toLocaleDateString("en-GB")}`,
    50,
  );
  doc.text(`Status: ${order.status.toUpperCase()}`, 50);

  doc.text(`Customer: ${order.customer_name}`, 300, detailsTop);
  if (order.company_name) doc.text(`Company: ${order.company_name}`, 300);
  doc.text(`Email: ${order.email}`, 300);
  if (order.phone) doc.text(`Phone: ${order.phone}`, 300);
  if (order.country) doc.text(`Country: ${order.country}`, 300);
  if (order.delivery_address)
    doc.text(`Delivery: ${order.delivery_address}`, 300);

  doc.moveDown(2);

  // Draw separator
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#3b655d").stroke();
  doc.moveDown(0.5);

  let grandTotal = 0;
  let grandQty = 0;

  for (const group of order.order_groups || []) {
    // Group header
    doc.fontSize(12).fillColor("#3b655d").text(group.group_name);
    doc.fillColor("#000000");
    doc.moveDown(0.3);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(8).fillColor("#666666");
    doc.text("Species", 50, tableTop, { width: 150 });
    doc.text("Scientific Name", 200, tableTop, { width: 130 });
    doc.text("Size", 330, tableTop, { width: 60 });
    doc.text("Qty", 390, tableTop, { width: 40, align: "right" });
    doc.text("Price", 440, tableTop, { width: 50, align: "right" });
    doc.text("Total", 495, tableTop, { width: 50, align: "right" });
    doc.fillColor("#000000");

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();

    let groupTotal = 0;
    let groupQty = 0;

    for (const item of group.order_items || []) {
      // Check for page break
      if (doc.y > 720) {
        doc.addPage();
      }

      const y = doc.y + 4;
      doc.fontSize(9);
      doc.text(item.species_name, 50, y, { width: 150 });
      doc.text(item.scientific_name || "-", 200, y, { width: 130 });
      doc.text(item.size || "-", 330, y, { width: 60 });
      doc.text(String(item.quantity), 390, y, { width: 40, align: "right" });

      const price = item.unit_price || 0;
      const total = price * item.quantity;
      doc.text(price ? `$${price.toFixed(2)}` : "-", 440, y, {
        width: 50,
        align: "right",
      });
      doc.text(total ? `$${total.toFixed(2)}` : "-", 495, y, {
        width: 50,
        align: "right",
      });

      groupTotal += total;
      groupQty += item.quantity;
      doc.moveDown(0.6);
    }

    // Group subtotal
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor("#3b655d");
    doc.text(`Subtotal: ${groupQty} pcs`, 390, doc.y, {
      width: 40,
      align: "right",
    });
    doc.text(
      groupTotal ? `$${groupTotal.toFixed(2)}` : "-",
      495,
      doc.y - doc.currentLineHeight(),
      { width: 50, align: "right" },
    );
    doc.fillColor("#000000");
    doc.moveDown();

    grandTotal += groupTotal;
    grandQty += groupQty;
  }

  // Grand total
  doc.moveDown(0.5);
  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor("#3b655d")
    .lineWidth(2)
    .stroke();
  doc.lineWidth(1);
  doc.moveDown(0.3);

  doc.fontSize(12).fillColor("#3b655d");
  doc.text(`Total Quantity: ${grandQty} pcs`, 50);
  if (grandTotal > 0) {
    doc.text(`Grand Total: $${grandTotal.toFixed(2)}`, 50);
  }

  // Notes
  if (order.notes) {
    doc.moveDown();
    doc.fontSize(10).fillColor("#000000").text("Notes:", 50);
    doc.fontSize(9).text(order.notes, 50);
  }

  // Footer
  doc.moveDown(2);
  doc
    .fontSize(8)
    .fillColor("#999999")
    .text("INÁ Ornamental Fish — Thank you for your business!", {
      align: "center",
    });

  doc.end();

  const pdfBuffer = await pdfPromise;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${order.order_reference}.pdf"`,
    },
  });
}
