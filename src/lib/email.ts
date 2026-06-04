import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "orders@inaornamentalfish.com";
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || "inaornamental@gmail.com")
  .split(",")
  .map((e) => e.trim());

interface OrderEmailData {
  order_reference: string;
  customer_name: string;
  company_name?: string;
  email: string;
  phone?: string;
  country?: string;
  delivery_address?: string;
  notes?: string;
  groups: {
    name: string;
    items: {
      species_name: string;
      scientific_name?: string;
      size?: string;
      quantity: number;
      unit_price?: number | null;
    }[];
  }[];
}

function buildOrderItemsHTML(data: OrderEmailData) {
  return data.groups
    .map(
      (g) => `
      <h3 style="margin:16px 0 8px;color:#3b655d;font-size:16px;">${g.name}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f5f3ee;">
            <th style="text-align:left;padding:8px;border-bottom:1px solid #e2d8c8;">Species</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #e2d8c8;">Size</th>
            <th style="text-align:center;padding:8px;border-bottom:1px solid #e2d8c8;">Qty</th>
            ${g.items.some((i) => i.unit_price) ? '<th style="text-align:right;padding:8px;border-bottom:1px solid #e2d8c8;">Price</th>' : ""}
          </tr>
        </thead>
        <tbody>
          ${g.items
            .map(
              (item) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #f0ece4;">
                <strong>${item.species_name}</strong>
                ${item.scientific_name ? `<br><em style="color:#8e8270;font-size:12px;">${item.scientific_name}</em>` : ""}
              </td>
              <td style="padding:8px;border-bottom:1px solid #f0ece4;">${item.size || "-"}</td>
              <td style="text-align:center;padding:8px;border-bottom:1px solid #f0ece4;">${item.quantity}</td>
              ${item.unit_price ? `<td style="text-align:right;padding:8px;border-bottom:1px solid #f0ece4;">$${Number(item.unit_price).toFixed(2)}</td>` : ""}
            </tr>`,
            )
            .join("")}
        </tbody>
      </table>`,
    )
    .join("");
}

function buildEmailHTML(data: OrderEmailData, isAdmin: boolean) {
  const totalItems = data.groups.reduce(
    (sum, g) => sum + g.items.reduce((s, i) => s + i.quantity, 0),
    0,
  );

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#3b655d;padding:24px;border-radius:12px 12px 0 0;">
      <h1 style="color:white;margin:0;font-size:22px;">iNA Ornamental Fish</h1>
      <p style="color:#c7e2dc;margin:4px 0 0;font-size:13px;">
        ${isAdmin ? "New Order Received" : "Order Confirmation"}
      </p>
    </div>
    
    <div style="background:white;padding:24px;border:1px solid #e2d8c8;border-top:none;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 16px;font-size:15px;color:#38322a;">
        ${isAdmin ? `A new order has been submitted by <strong>${data.customer_name}</strong>.` : `Dear ${data.customer_name}, thank you for your order! Here are your order details.`}
      </p>

      <div style="background:#faf7f2;padding:16px;border-radius:8px;margin-bottom:20px;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="padding:4px 0;color:#8e8270;">Reference</td><td style="padding:4px 0;font-weight:bold;color:#3b655d;">${data.order_reference}</td></tr>
          <tr><td style="padding:4px 0;color:#8e8270;">Name</td><td style="padding:4px 0;">${data.customer_name}</td></tr>
          ${data.company_name ? `<tr><td style="padding:4px 0;color:#8e8270;">Company</td><td style="padding:4px 0;">${data.company_name}</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#8e8270;">Email</td><td style="padding:4px 0;">${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding:4px 0;color:#8e8270;">Phone</td><td style="padding:4px 0;">${data.phone}</td></tr>` : ""}
          ${data.country ? `<tr><td style="padding:4px 0;color:#8e8270;">Country</td><td style="padding:4px 0;">${data.country}</td></tr>` : ""}
          ${data.delivery_address ? `<tr><td style="padding:4px 0;color:#8e8270;">Address</td><td style="padding:4px 0;">${data.delivery_address}</td></tr>` : ""}
          <tr><td style="padding:4px 0;color:#8e8270;">Total Items</td><td style="padding:4px 0;font-weight:bold;">${totalItems}</td></tr>
        </table>
      </div>

      ${buildOrderItemsHTML(data)}

      ${data.notes ? `<div style="margin-top:16px;padding:12px;background:#faf7f2;border-radius:8px;"><strong style="font-size:13px;color:#8e8270;">Notes:</strong><p style="margin:4px 0 0;font-size:14px;">${data.notes}</p></div>` : ""}

      <hr style="border:none;border-top:1px solid #e2d8c8;margin:24px 0;">
      <p style="margin:0;font-size:12px;color:#8e8270;text-align:center;">
        ${isAdmin ? `<a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/orders" style="color:#3b655d;">View in Admin Panel →</a>` : "Our team will reach out shortly with shipping details and a proforma invoice."}
      </p>
    </div>

    <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#b0a48e;">
      © ${new Date().getFullYear()} INA Ornamental Fish • Lagos, Nigeria
    </p>
  </div>
</body>
</html>`;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email notifications");
    return;
  }

  const promises: Promise<unknown>[] = [];

  // Send confirmation to customer
  if (data.email) {
    promises.push(
      resend.emails.send({
        from: FROM_EMAIL,
        to: data.email,
        subject: `Order Confirmed — ${data.order_reference} | iNA Ornamental Fish`,
        html: buildEmailHTML(data, false),
      }),
    );
  }

  // Send notification to admin
  promises.push(
    resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAILS,
      subject: `New Order: ${data.order_reference} from ${data.customer_name}`,
      html: buildEmailHTML(data, true),
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
  if (!process.env.RESEND_API_KEY || !data.email) return;

  const statusLabels: Record<string, string> = {
    confirmed: "Your order has been confirmed",
    processing: "Your order is being prepared",
    shipped: "Your order has been shipped",
    delivered: "Your order has been delivered",
    cancelled: "Your order has been cancelled",
  };

  const message = statusLabels[data.status] || `Order status: ${data.status}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `${message} — ${data.order_reference} | iNA Ornamental Fish`,
      html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#3b655d;padding:24px;border-radius:12px 12px 0 0;">
      <h1 style="color:white;margin:0;font-size:22px;">iNA Ornamental Fish</h1>
      <p style="color:#c7e2dc;margin:4px 0 0;font-size:13px;">Order Update</p>
    </div>
    <div style="background:white;padding:24px;border:1px solid #e2d8c8;border-top:none;border-radius:0 0 12px 12px;">
      <p style="font-size:15px;color:#38322a;">Dear ${data.customer_name},</p>
      <p style="font-size:15px;color:#38322a;">${message}.</p>
      <div style="background:#faf7f2;padding:16px;border-radius:8px;margin:16px 0;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="color:#8e8270;">Reference</td><td style="font-weight:bold;color:#3b655d;">${data.order_reference}</td></tr>
          <tr><td style="color:#8e8270;">Status</td><td style="font-weight:bold;text-transform:capitalize;">${data.status}</td></tr>
        </table>
      </div>
      <p style="font-size:13px;color:#8e8270;">If you have questions, reply to this email or contact us on WhatsApp.</p>
    </div>
    <p style="text-align:center;margin:16px 0 0;font-size:11px;color:#b0a48e;">© ${new Date().getFullYear()} INA Ornamental Fish</p>
  </div>
</body></html>`,
    });
  } catch (err) {
    console.error("Status update email error:", err);
  }
}
