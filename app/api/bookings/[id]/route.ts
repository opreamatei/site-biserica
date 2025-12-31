import { auth } from "@/auth";
import { cancelBooking, fetchActiveBookings } from "@/lib/bookings";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id?: string | string[] }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesară autentificarea." }, { status: 401 });
  }

  const fallbackId = (() => {
    try {
      const url = new URL(_req.url);
      return url.pathname.split("/").pop();
    } catch {
      return null;
    }
  })();

  const resolvedParams = await params;
  const paramId = Array.isArray(resolvedParams.id)
    ? resolvedParams.id[0]
    : resolvedParams.id;
  const id = paramId ?? fallbackId;

  if (!id || id === "[id]") {
    return NextResponse.json({ error: "ID invalid." }, { status: 400 });
  }

  try {
    const booking = await cancelBooking(id, session.user);
    const allBookings = await fetchActiveBookings(undefined, session.user.priestId ?? null);
    return NextResponse.json({ booking, allBookings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu s-a putut anula programarea.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
