import "server-only";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY env var for Stripe.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
  }
  return stripeClient;
}
