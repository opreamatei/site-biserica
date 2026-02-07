import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

type CheckoutBody = {
  amount?: number;
};

const ALLOWED_AMOUNTS_RON = [1, 10, 20, 50];
const CURRENCY = "ron";
const DONATION_NAME = "Donație Biserica Foișor";

function resolveOrigin(req: Request): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as CheckoutBody | null;
  const amount = body?.amount;
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Sumă invalidă." }, { status: 400 });
  }

  const normalizedAmount = Math.floor(amount as number);
  if (!ALLOWED_AMOUNTS_RON.includes(normalizedAmount)) {
    return NextResponse.json({ error: "Sumă nepermisă." }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const origin = resolveOrigin(req);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: {
              name: DONATION_NAME,
            },
            unit_amount: normalizedAmount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?donate=success`,
      cancel_url: `${origin}/?donate=cancel`,
      metadata: {
        donationAmount: String(normalizedAmount),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("[stripe] Failed to create checkout session", error);
    return NextResponse.json(
      { error: "Nu s-a putut porni plata." },
      { status: 500 },
    );
  }
}
