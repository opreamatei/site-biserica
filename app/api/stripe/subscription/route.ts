import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";
import { getWriteClient, readClient } from "@/lib/sanity";

type SubscriptionBody = {
  amount?: number;
};

type UserRecord = {
  _id: string;
  name?: string;
  email?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

const CURRENCY = "ron";
const PRODUCT_NAME = "Donatie lunara Biserica Foisorul";
const MIN_AMOUNT = 5;
const MAX_AMOUNT = 10000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesara autentificarea." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as SubscriptionBody | null;
  const amount = body?.amount;
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Suma invalida." }, { status: 400 });
  }

  const normalizedAmount = Math.floor(amount as number);
  if (normalizedAmount < MIN_AMOUNT) {
    return NextResponse.json(
      { error: `Suma trebuie sa fie cel putin ${MIN_AMOUNT} RON.` },
      { status: 400 },
    );
  }
  if (normalizedAmount > MAX_AMOUNT) {
    return NextResponse.json(
      { error: `Suma trebuie sa fie cel mult ${MAX_AMOUNT} RON.` },
      { status: 400 },
    );
  }

  const user = await readClient.fetch<UserRecord | null>(
    `*[_type == "user" && _id == $id][0]{_id,name,email,stripeCustomerId,stripeSubscriptionId}`,
    { id: session.user.id },
  );

  if (!user) {
    return NextResponse.json({ error: "Utilizator inexistent." }, { status: 404 });
  }

  try {
    const stripe = getStripe();
    const client = getWriteClient();

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { userId: user._id },
      });
      customerId = customer.id;
      await client.patch(user._id).set({ stripeCustomerId: customerId }).commit();
    }

    const productId =
      process.env.STRIPE_RECURRING_PRODUCT_ID ??
      (await stripe.products.create({ name: PRODUCT_NAME })).id;

    const metadata: Record<string, string> = {
      userId: user._id,
      donationType: "recurring",
      amount: String(normalizedAmount),
    };
    if (user.email) {
      metadata.donorEmail = user.email;
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price_data: {
            currency: CURRENCY,
            product: productId,
            unit_amount: normalizedAmount * 100,
            recurring: { interval: "month" },
          },
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata,
    });

    const latestInvoiceRef = subscription.latest_invoice;
    let latestInvoice: Stripe.Invoice | null = null;
    if (typeof latestInvoiceRef === "string") {
      latestInvoice = await stripe.invoices.retrieve(latestInvoiceRef, {
        expand: ["payment_intent"],
      });
    } else if (latestInvoiceRef && typeof latestInvoiceRef === "object") {
      latestInvoice = latestInvoiceRef;
    }

    const paymentIntent = latestInvoice?.payment_intent;
    const clientSecret =
      typeof paymentIntent === "object" && paymentIntent?.client_secret
        ? paymentIntent.client_secret
        : null;

    if (!clientSecret) {
      return NextResponse.json(
        { error: "Nu s-a putut porni plata." },
        { status: 500 },
      );
    }

    await client
      .patch(user._id)
      .set({
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        stripeSubscriptionCancelAt: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : null,
      })
      .commit();

    return NextResponse.json({ clientSecret, subscriptionId: subscription.id });
  } catch (error) {
    console.error("[stripe] Failed to create subscription", error);
    return NextResponse.json(
      { error: "Nu s-a putut porni plata recurenta." },
      { status: 500 },
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesara autentificarea." }, { status: 401 });
  }

  const user = await readClient.fetch<UserRecord | null>(
    `*[_type == "user" && _id == $id][0]{_id,stripeSubscriptionId}`,
    { id: session.user.id },
  );

  if (!user?.stripeSubscriptionId) {
    return NextResponse.json({ active: false });
  }

  try {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const isStatusActive =
      subscription.status === "active" || subscription.status === "trialing";
    const willCancel = Boolean(subscription.cancel_at_period_end);
    const active = isStatusActive && !willCancel;

    return NextResponse.json({
      active,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: subscription.cancel_at ?? null,
    });
  } catch (error) {
    console.error("[stripe] Failed to fetch subscription", error);
    return NextResponse.json(
      { error: "Nu s-a putut verifica abonamentul." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesara autentificarea." }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as SubscriptionBody | null;
  const amount = body?.amount;
  if (!Number.isFinite(amount)) {
    return NextResponse.json({ error: "Suma invalida." }, { status: 400 });
  }

  const normalizedAmount = Math.floor(amount as number);
  if (normalizedAmount < MIN_AMOUNT) {
    return NextResponse.json(
      { error: `Suma trebuie sa fie cel putin ${MIN_AMOUNT} RON.` },
      { status: 400 },
    );
  }
  if (normalizedAmount > MAX_AMOUNT) {
    return NextResponse.json(
      { error: `Suma trebuie sa fie cel mult ${MAX_AMOUNT} RON.` },
      { status: 400 },
    );
  }

  const user = await readClient.fetch<UserRecord | null>(
    `*[_type == "user" && _id == $id][0]{_id,stripeSubscriptionId}`,
    { id: session.user.id },
  );

  if (!user?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Nu exista un abonament activ." },
      { status: 404 },
    );
  }

  try {
    const stripe = getStripe();
    const client = getWriteClient();

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) {
      return NextResponse.json(
        { error: "Nu s-a putut modifica abonamentul." },
        { status: 500 },
      );
    }

    const productId =
      process.env.STRIPE_RECURRING_PRODUCT_ID ??
      (await stripe.products.create({ name: PRODUCT_NAME })).id;

    const updated = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      proration_behavior: "none",
      items: [
        {
          id: itemId,
          price_data: {
            currency: CURRENCY,
            product: productId,
            unit_amount: normalizedAmount * 100,
            recurring: { interval: "month" },
          },
        },
      ],
    });

    await client
      .patch(user._id)
      .set({
        stripeSubscriptionStatus: updated.status,
        stripeSubscriptionCancelAt: updated.cancel_at
          ? new Date(updated.cancel_at * 1000).toISOString()
          : null,
      })
      .commit();

    return NextResponse.json({ ok: true, status: updated.status });
  } catch (error) {
    console.error("[stripe] Failed to update subscription", error);
    return NextResponse.json(
      { error: "Nu s-a putut modifica abonamentul." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesara autentificarea." }, { status: 401 });
  }

  const user = await readClient.fetch<UserRecord | null>(
    `*[_type == "user" && _id == $id][0]{_id,stripeSubscriptionId}`,
    { id: session.user.id },
  );

  if (!user?.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Nu exista un abonament activ." },
      { status: 404 },
    );
  }

  try {
    const stripe = getStripe();
    const client = getWriteClient();

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await client
      .patch(user._id)
      .set({
        stripeSubscriptionStatus: subscription.status,
        stripeSubscriptionCancelAt: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : null,
      })
      .commit();

    return NextResponse.json({ ok: true, status: subscription.status });
  } catch (error) {
    console.error("[stripe] Failed to cancel subscription", error);
    return NextResponse.json(
      { error: "Nu s-a putut anula abonamentul." },
      { status: 500 },
    );
  }
}
