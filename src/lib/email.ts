import nodemailer from "nodemailer";
import { buildInvoiceExcel } from "./invoice";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (process.env.SMTP_PORT || "465") === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const FROM_EMAIL =
  process.env.FROM_EMAIL || process.env.SMTP_USER || "inaornamental@gmail.com";
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || "alfred@inaornamentalfish.com")
  .split(",")
  .map((e) => e.trim());

// Escape user-supplied values before interpolating them into email HTML — order
// fields come from an unauthenticated form and are read in customer + admin
// inboxes.
function esc(v: unknown): string {
  if (v == null) return "";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escOrderData(data: OrderEmailData): OrderEmailData {
  const opt = (v?: string | null) => (v ? esc(v) : v);
  return {
    ...data,
    order_reference: esc(data.order_reference),
    customer_name: esc(data.customer_name),
    company_name: opt(data.company_name) ?? undefined,
    email: esc(data.email),
    phone: opt(data.phone) ?? undefined,
    country: opt(data.country) ?? undefined,
    delivery_address: opt(data.delivery_address) ?? undefined,
    notes: opt(data.notes) ?? undefined,
    proposed_shipment_date: opt(data.proposed_shipment_date),
    consignee_name: opt(data.consignee_name),
    consignee_phone: opt(data.consignee_phone),
    consignee_address: opt(data.consignee_address),
    groups: data.groups.map((g) => ({
      name: esc(g.name),
      items: g.items.map((it) => ({
        ...it,
        species_name: esc(it.species_name),
        scientific_name: it.scientific_name
          ? esc(it.scientific_name)
          : it.scientific_name,
        size: it.size ? esc(it.size) : it.size,
      })),
    })),
  };
}

// Shared <head> for all emails. The viewport meta stops mobile clients from
// rendering at desktop width (which made the order table overflow); the media
// query is honoured by Apple Mail, iOS Mail and the Gmail app, and ignored
// gracefully elsewhere (inline styles remain the baseline).
const EMAIL_HEAD = `<meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <style>
    @media only screen and (max-width: 600px) {
      .ina-container { padding: 12px !important; }
      .ina-card { padding: 16px !important; }
      .ina-items th, .ina-items td { padding: 6px 5px !important; font-size: 12px !important; }
      .ina-sci { font-size: 11px !important; }
    }
  </style>`;

interface OrderEmailData {
  order_reference: string;
  customer_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  country?: string;
  delivery_address?: string;
  notes?: string;
  proposed_shipment_date?: string | null;
  consignee_name?: string | null;
  consignee_phone?: string | null;
  consignee_address?: string | null;
  groups: {
    name: string;
    items: {
      species_name: string;
      scientific_name?: string;
      size?: string;
      quantity: number;
      // Pieces per box; carried through to the Excel invoice's Box Qty column.
      qty_per_box?: number | null;
      unit_price?: number | null;
    }[];
  }[];
}

function buildOrderItemsHTML(data: OrderEmailData) {
  return data.groups
    .map((g) => {
      const hasPrice = g.items.some((i) => i.unit_price);
      // Fixed layout + colgroup keeps the table within the email width on
      // mobile instead of stretching to fit the content.
      const colgroup = hasPrice
        ? `<colgroup><col style="width:46%"><col style="width:20%"><col style="width:14%"><col style="width:20%"></colgroup>`
        : `<colgroup><col style="width:56%"><col style="width:26%"><col style="width:18%"></colgroup>`;
      return `
      <h3 style="margin:16px 0 8px;color:#3b655d;font-size:16px;">${g.name}</h3>
      <table class="ina-items" style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:14px;">
        ${colgroup}
        <thead>
          <tr style="background:#f5f3ee;">
            <th style="text-align:left;padding:8px;border-bottom:1px solid #e2d8c8;">Species</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #e2d8c8;">Size</th>
            <th style="text-align:center;padding:8px;border-bottom:1px solid #e2d8c8;">Qty</th>
            ${hasPrice ? '<th style="text-align:right;padding:8px;border-bottom:1px solid #e2d8c8;">Price</th>' : ""}
          </tr>
        </thead>
        <tbody>
          ${g.items
            .map(
              (item) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #f0ece4;word-break:break-word;">
                <strong>${item.species_name}</strong>
                ${item.scientific_name ? `<br><em class="ina-sci" style="color:#8e8270;font-size:12px;">${item.scientific_name}</em>` : ""}
              </td>
              <td style="padding:8px;border-bottom:1px solid #f0ece4;word-break:break-word;">${item.size || "-"}</td>
              <td style="text-align:center;padding:8px;border-bottom:1px solid #f0ece4;">${item.quantity}</td>
              ${hasPrice ? `<td style="text-align:right;padding:8px;border-bottom:1px solid #f0ece4;">${item.unit_price ? `$${Number(item.unit_price).toFixed(2)}` : "-"}</td>` : ""}
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>`;
    })
    .join("");
}

function buildEmailHTML(rawData: OrderEmailData, isAdmin: boolean) {
  const totalItems = rawData.groups.reduce(
    (sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );
  // All user-supplied strings escaped before templating.
  const data = escOrderData(rawData);

  return `
<!DOCTYPE html>
<html>
<head>${EMAIL_HEAD}</head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,sans-serif;">
  <div class="ina-container" style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#3b655d;padding:24px;border-radius:12px 12px 0 0;">
      <h1 style="color:white;margin:0;font-size:22px;">INÁ Ornamental Fish</h1>
      <p style="color:#c7e2dc;margin:4px 0 0;font-size:13px;">
        ${isAdmin ? "New Order Received" : "Order Confirmation"}
      </p>
    </div>

    <div class="ina-card" style="background:white;padding:24px;border:1px solid #e2d8c8;border-top:none;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 16px;font-size:15px;color:#38322a;">
        ${isAdmin ? `A new order has been submitted by <strong>${data.customer_name}</strong>.` : `Dear ${data.customer_name}, thank you for your order! Here are your order details.`}
      </p>

      <div style="background:#faf7f2;padding:16px;border-radius:8px;margin-bottom:20px;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="padding:4px 0;color:#8e8270;">Reference</td><td style="padding:4px 0;font-weight:bold;color:#3b655d;">${data.order_reference}</td></tr>
          <tr><td style="padding:4px 0;color:#8e8270;">Name</td><td style="padding:4px 0;word-break:break-word;">${data.customer_name}</td></tr>
          ${data.company_name ? `<tr><td style="padding:4px 0;color:#8e8270;">Company</td><td style="padding:4px 0;word-break:break-word;">${data.company_name}</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#8e8270;">Email</td><td style="padding:4px 0;word-break:break-word;">${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding:4px 0;color:#8e8270;">Phone</td><td style="padding:4px 0;word-break:break-word;">${data.phone}</td></tr>` : ""}
          ${data.country ? `<tr><td style="padding:4px 0;color:#8e8270;">Country</td><td style="padding:4px 0;word-break:break-word;">${data.country}</td></tr>` : ""}
          ${data.delivery_address ? `<tr><td style="padding:4px 0;color:#8e8270;">Address</td><td style="padding:4px 0;word-break:break-word;">${data.delivery_address}</td></tr>` : ""}
          ${data.proposed_shipment_date ? `<tr><td style="padding:4px 0;color:#8e8270;">Proposed Shipment</td><td style="padding:4px 0;word-break:break-word;">${data.proposed_shipment_date}</td></tr>` : ""}
          ${data.consignee_name ? `<tr><td style="padding:4px 0;color:#8e8270;">Consignee</td><td style="padding:4px 0;word-break:break-word;">${data.consignee_name}</td></tr>` : ""}
          ${data.consignee_phone ? `<tr><td style="padding:4px 0;color:#8e8270;">Consignee Phone</td><td style="padding:4px 0;word-break:break-word;">${data.consignee_phone}</td></tr>` : ""}
          ${data.consignee_address ? `<tr><td style="padding:4px 0;color:#8e8270;">Consignee Address</td><td style="padding:4px 0;word-break:break-word;">${data.consignee_address}</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#8e8270;">Total Items</td><td style="padding:4px 0;font-weight:bold;">${totalItems}</td></tr>
        </table>
      </div>

      ${buildOrderItemsHTML(data)}

      ${data.notes ? `<div style="margin-top:16px;padding:12px;background:#faf7f2;border-radius:8px;"><strong style="font-size:13px;color:#8e8270;">Notes:</strong><p style="margin:4px 0 0;font-size:14px;">${data.notes}</p></div>` : ""}

      <hr style="border:none;border-top:1px solid #e2d8c8;margin:24px 0;">
      <p style="margin:0;font-size:12px;color:#8e8270;text-align:center;">
        ${isAdmin ? `<a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/orders" style="color:#3b655d;">View in Admin Panel →</a>` : "Our team will reach out shortly with shipping details and a performa invoice."}
      </p>
    </div>

    <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#b0a48e;">
      © ${new Date().getFullYear()} INÁ Ornamental Fish • Lagos, Nigeria
    </p>
  </div>
</body>
</html>`;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const transport = getTransporter();
  if (!transport) {
    console.warn("SMTP_USER/SMTP_PASS not set, skipping email notifications");
    return;
  }

  // Generate Excel invoice attachment
  let invoiceBuffer: Buffer | null = null;
  try {
    invoiceBuffer = await buildInvoiceExcel(data);
  } catch (err) {
    console.error("Failed to generate Excel invoice:", err);
  }

  const attachments = invoiceBuffer
    ? [
        {
          filename: `INA-Invoice-${data.order_reference}.xlsx`,
          content: invoiceBuffer,
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ]
    : [];

  const promises: Promise<unknown>[] = [];

  // Send confirmation to customer
  if (data.email) {
    promises.push(
      transport.sendMail({
        from: `"INÁ Ornamental Fish" <${FROM_EMAIL}>`,
        to: data.email,
        subject: `Order Confirmed — ${data.order_reference} | INÁ Ornamental Fish`,
        html: buildEmailHTML(data, false),
        attachments,
      }),
    );
  }

  // Send notification to admin
  promises.push(
    transport.sendMail({
      from: `"INÁ Ornamental Fish" <${FROM_EMAIL}>`,
      to: ADMIN_EMAILS.join(", "),
      subject: `New Order: ${data.order_reference} from ${data.customer_name}`,
      html: buildEmailHTML(data, true),
      attachments,
    }),
  );

  try {
    await Promise.allSettled(promises);
  } catch (err) {
    console.error("Email send error:", err);
  }
}

export async function sendOrderStatusUpdate(data: {
  order_reference: string;
  customer_name: string;
  email: string;
  status: string;
}) {
  const transport = getTransporter();
  if (!transport || !data.email) return;

  const statusLabels: Record<string, string> = {
    confirmed: "Your order has been confirmed",
    processing: "Your order is being prepared",
    shipped: "Your order has been shipped",
    delivered: "Your order has been delivered",
    cancelled: "Your order has been cancelled",
  };

  const message = statusLabels[data.status] || `Order status: ${data.status}`;

  try {
    await transport.sendMail({
      from: `"INÁ Ornamental Fish" <${FROM_EMAIL}>`,
      to: data.email,
      subject: `${message} — ${data.order_reference} | INÁ Ornamental Fish`,
      html: `
<!DOCTYPE html>
<html><head>${EMAIL_HEAD}</head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,sans-serif;">
  <div class="ina-container" style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#3b655d;padding:24px;border-radius:12px 12px 0 0;">
      <h1 style="color:white;margin:0;font-size:22px;">INÁ Ornamental Fish</h1>
      <p style="color:#c7e2dc;margin:4px 0 0;font-size:13px;">Order Update</p>
    </div>
    <div class="ina-card" style="background:white;padding:24px;border:1px solid #e2d8c8;border-top:none;border-radius:0 0 12px 12px;">
      <p style="font-size:15px;color:#38322a;">Dear ${esc(data.customer_name)},</p>
      <p style="font-size:15px;color:#38322a;">${message}.</p>
      <div style="background:#faf7f2;padding:16px;border-radius:8px;margin:16px 0;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="color:#8e8270;">Reference</td><td style="font-weight:bold;color:#3b655d;">${esc(data.order_reference)}</td></tr>
          <tr><td style="color:#8e8270;">Status</td><td style="font-weight:bold;text-transform:capitalize;">${esc(data.status)}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:#8e8270;">If you have questions, reply to this email or contact us on WhatsApp.</p>
    </div>
    <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#b0a48e;">© ${new Date().getFullYear()} INÁ Ornamental Fish</p>
  </div>
</body></html>`,
    });
  } catch (err) {
    console.error("Status update email error:", err);
  }
}
