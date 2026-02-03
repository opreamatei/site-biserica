import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { sendDonationThankYouEmail } from "@/lib/email";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const parseAmount = (value?: string | null) => {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toMajorAmount = (amount?: number | null) => {
  if (!Number.isFinite(amount)) return 0;
  return (amount as number) / 100;
};

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error("[stripe] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  const stripe = getStripe();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[stripe] Invalid webhook signature", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        if (paymentIntent.invoice) break;
        if (paymentIntent.metadata?.donationType === "recurring") break;

        let email =
          paymentIntent.metadata?.donorEmail ||
          paymentIntent.receipt_email ||
          null;
        if (!email) {
          const latestCharge = paymentIntent.latest_charge;
          if (latestCharge && typeof latestCharge === "object") {
            email = latestCharge.billing_details?.email ?? null;
          } else if (typeof latestCharge === "string") {
            const charge = await stripe.charges.retrieve(latestCharge);
            email = charge.billing_details?.email ?? null;
          }
        }
        if (!email) break;

        const metadataAmount = parseAmount(paymentIntent.metadata?.donationAmount);
        const amount =
          metadataAmount ??
          toMajorAmount(paymentIntent.amount_received ?? paymentIntent.amount);

        await sendDonationThankYouEmail({
          to: email,
          amount,
          currency: paymentIntent.currency,
          donationType: "one-time",
          paidAt: paymentIntent.created ? paymentIntent.created * 1000 : undefined,
        });
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const email =
          invoice.customer_email || invoice.metadata?.donorEmail || null;
        if (!email) break;

        const amount = toMajorAmount(
          invoice.amount_paid ?? invoice.amount_due ?? 0,
        );

        await sendDonationThankYouEmail({
          to: email,
          amount,
          currency: invoice.currency,
          donationType: "recurring",
          paidAt: invoice.status_transitions?.paid_at
            ? invoice.status_transitions.paid_at * 1000
            : undefined,
        });
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe] Failed to process webhook", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
