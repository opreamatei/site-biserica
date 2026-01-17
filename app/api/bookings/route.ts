import { auth } from "@/auth";
import { getEvents } from "@/lib/events";
import {
  createBooking,
  fetchActiveBookings,
  fetchUserBookings,
} from "@/lib/bookings";
import { NextResponse } from "next/server";

const MAX_PEOPLE_COUNT = 10;

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesară autentificarea." }, { status: 401 });
  }

  const [bookings, allBookings, availability] = await Promise.all([
    fetchUserBookings(session.user.id),
    fetchActiveBookings(undefined, session.user.priestId ?? null),
    getEvents(session.user.priestId ?? undefined),
  ]);

  const isAdmin = session.user.role === "admin" || session.user.role === "dev";
  if (isAdmin) {
    return NextResponse.json({ bookings, allBookings, availability });
  }

  const sanitizedBookings = bookings.map(({ eventLabel, ...rest }) => rest);
  const sanitizedAllBookings = allBookings.map(({ eventLabel, ...rest }) => rest);
  const sanitizedAvailability = availability.map(({ label, ...rest }) => rest);

  return NextResponse.json({
    bookings: sanitizedBookings,
    allBookings: sanitizedAllBookings,
    availability: sanitizedAvailability,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesară autentificarea." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const eventId = body?.eventId as string | undefined;
  const rawPeopleCount = body?.peopleCount as number | string | undefined;
  const peopleCount =
    rawPeopleCount === undefined || rawPeopleCount === null
      ? 1
      : Number(rawPeopleCount);

  if (!eventId) {
    return NextResponse.json({ error: "Evenimentul este obligatoriu." }, { status: 400 });
  }
  if (!Number.isFinite(peopleCount) || peopleCount < 1) {
    return NextResponse.json({ error: "Numarul de persoane este invalid." }, { status: 400 });
  }
  if (peopleCount > MAX_PEOPLE_COUNT) {
    return NextResponse.json({ error: "Numarul maxim de persoane este 10." }, { status: 400 });
  }

  try {
    const booking = await createBooking({
      user: session.user,
      eventId,
      peopleCount,
    });
    const allBookings = await fetchActiveBookings(undefined, session.user.priestId ?? null);
    return NextResponse.json({ booking, allBookings }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu s-a putut crea programarea.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
