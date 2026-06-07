import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

async function verifySmtpConnection() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return {
      ok: false,
      status: 400,
      body: { error: "SMTP_USER or SMTP_PASS not set in environment" },
    } as const;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (process.env.SMTP_PORT || "465") === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.verify();
    return {
      ok: true,
      status: 200,
      body: { ok: true, message: "SMTP connection verified" },
    } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("SMTP verify failed:", message);
    return {
      ok: false,
      status: 500,
      body: {
        error: "SMTP verify failed",
        details: message,
      },
    } as const;
  }
}

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const result = await verifySmtpConnection();
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST() {
  const unauthorized = await requireAdmin(request);
  if (unauthorized) return unauthorized;
  const result = await verifySmtpConnection();
  return NextResponse.json(result.body, { status: result.status });
}
