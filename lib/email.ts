import { Resend } from "resend";

import { ResetPasswordEmail } from "./emails/reset-password";

type ResetEmailParams = {
  to: string;
  token: string;
  expires: string;
  origin?: string;
};

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;
const fromName = process.env.RESEND_FROM_NAME || "Biserica Foișor";

export async function sendResetEmail({
  to,
  token,
  expires,
  origin,
}: ResetEmailParams): Promise<"sent" | "skipped" | "error"> {
  if (!apiKey || !from) return "skipped";

  const resend = new Resend(apiKey);
  const fromAddress = from.match(/<([^>]+)>/)?.[1]?.trim() ?? from.trim();
  const fromValue = `${fromName} <${fromAddress}>`;
  const site = origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const baseUrl = site.replace(/\/$/, "");
  const logoDark = `${baseUrl}/logo_negru.webp`;
  const logoLight = `${baseUrl}/${encodeURIComponent("logo alb.jpg")}`;
  const expiresLabel = new Date(expires).toLocaleString("ro-RO");

  const email = ResetPasswordEmail({
    token,
    expiresLabel,
    logoDarkUrl: logoDark,
    logoLightUrl: logoLight,
  });

  try {
    await resend.emails.send({
      from: fromValue,
      to,
      subject: "Resetare parol\u0103",
      react: email,
    });
    return "sent";
  } catch (error) {
    console.error("[email] Failed to send reset email", error);
    return "error";
  }
}
