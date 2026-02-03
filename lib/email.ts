import { Resend } from "resend";

import { DonationThankYouEmail } from "./emails/donation-thank-you";
import { ResetPasswordEmail } from "./emails/reset-password";

type ResetEmailParams = {
  to: string;
  token: string;
  expires: string;
  origin?: string;
};

type DonationEmailParams = {
  to: string;
  amount: number;
  currency?: string;
  donationType: "one-time" | "recurring";
  origin?: string;
  donorName?: string;
  paidAt?: string | number | Date;
};

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM;
const fromName = process.env.RESEND_FROM_NAME || "Biserica Foișor";

const resolveFromValue = () => {
  if (!from) return null;
  const fromAddress = from.match(/<([^>]+)>/)?.[1]?.trim() ?? from.trim();
  return `${fromName} <${fromAddress}>`;
};

export async function sendResetEmail({
  to,
  token,
  expires,
  origin,
}: ResetEmailParams): Promise<"sent" | "skipped" | "error"> {
  if (!apiKey) return "skipped";

  const resend = new Resend(apiKey);
  const fromValue = resolveFromValue();
  if (!fromValue) return "skipped";
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

export async function sendDonationThankYouEmail({
  to,
  amount,
  currency,
  donationType,
  origin,
  donorName,
  paidAt,
}: DonationEmailParams): Promise<"sent" | "skipped" | "error"> {
  if (!apiKey) return "skipped";
  const fromValue = resolveFromValue();
  if (!fromValue) return "skipped";

  const resolvedCurrency = (currency || "ron").toUpperCase();
  const amountValue = Number.isFinite(amount) ? amount : 0;
  const amountLabel = new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: resolvedCurrency,
  }).format(amountValue);
  const paidAtDate =
    paidAt instanceof Date
      ? paidAt
      : paidAt
        ? new Date(paidAt)
        : null;
  const paidAtLabel = paidAtDate ? paidAtDate.toLocaleString("ro-RO") : undefined;
  const site = origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const baseUrl = site.replace(/\/$/, "");
  const logoDark = `${baseUrl}/logo_negru.webp`;
  const logoLight = `${baseUrl}/${encodeURIComponent("logo alb.jpg")}`;

  const email = DonationThankYouEmail({
    amountLabel,
    donationType,
    donorName,
    donationDateLabel: paidAtLabel,
    logoDarkUrl: logoDark,
    logoLightUrl: logoLight,
  });

  try {
    const resend = new Resend(apiKey);
    const subject =
      donationType === "recurring"
        ? "Multumim pentru donatia lunara"
        : "Multumim pentru donatie";
    await resend.emails.send({
      from: fromValue,
      to,
      subject,
      react: email,
    });
    return "sent";
  } catch (error) {
    console.error("[email] Failed to send donation email", error);
    return "error";
  }
}
