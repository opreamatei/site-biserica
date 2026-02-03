import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

type PaymentIntentBody = {
  amount?: number;
};

const CURRENCY = "ron";
const MIN_AMOUNT = 5;
const MAX_AMOUNT = 10000;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as PaymentIntentBody | null;
  const amount = body?.amount;
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Suma invalida." }, { status: 400 });
  }

  const normalizedAmount = Math.floor(amount as number);
  if (normalizedAmount < MIN_AMOUNT) {
    return NextResponse.json(
      { error: `Suma minimă este de ${MIN_AMOUNT} RON.` },
      { status: 400 },
    );
  }
  if (normalizedAmount > MAX_AMOUNT) {
    return NextResponse.json(
      { error: `Suma maximă este de ${MAX_AMOUNT} RON.` },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: normalizedAmount * 100,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        donationAmount: String(normalizedAmount),
        donationType: "one-time",
      },
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Nu s-a putut porni plata." },
        { status: 500 },
      );
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("[stripe] Failed to create payment intent", error);
    return NextResponse.json(
      { error: "Nu s-a putut porni plata." },
      { status: 500 },
    );
  }
}
