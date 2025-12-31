import { auth } from "@/auth";
import { getEvents } from "@/lib/events";
import {
  createBooking,
  fetchActiveBookings,
  fetchUserBookings,
} from "@/lib/bookings";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesară autentificarea." }, { status: 401 });
  }

  const [bookings, allBookings, availability] = await Promise.all([
    fetchUserBookings(session.user.id),
    fetchActiveBookings(undefined, session.user.priestId ?? null),
    Promise.resolve(getEvents(session.user.priestId ?? undefined)),
  ]);

  return NextResponse.json({ bookings, allBookings, availability });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesară autentificarea." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const eventId = body?.eventId as string | undefined;

  if (!eventId) {
    return NextResponse.json({ error: "Evenimentul este obligatoriu." }, { status: 400 });
  }

  try {
    const booking = await createBooking({
      user: session.user,
      eventId,
    });
    const allBookings = await fetchActiveBookings(undefined, session.user.priestId ?? null);
    return NextResponse.json({ booking, allBookings }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu s-a putut crea programarea.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
