import "server-only";
import { getEvents } from "./events";
import { getWriteClient, readClient } from "./sanity";

export type BookingRecord = {
  _id: string;
  date: string;
  startTime: string; // HH:mm
  durationMinutes: number;
  status: "booked" | "cancelled";
  eventId?: string;
  eventLabel?: string;
  priestId?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  createdAt?: string;
  cancelledAt?: string;
};

export type AuthUser = {
  id: string;
  role?: "user" | "admin" | "dev";
  allocatedMinutes?: number;
  email?: string | null;
  name?: string | null;
  priestId?: string | null;
};

const bookingProjection =
  `{_id,date,startTime,durationMinutes,status,createdAt,cancelledAt,priestId,eventId,eventLabel,"userId":user._ref,"userName":user->name,"userEmail":user->email}`;

const projectionQuery = `*[_type == "booking"] | order(date asc, startTime asc) ${bookingProjection}`;

function thresholdDate(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  t.setDate(t.getDate() - 1); // pastram doar de ieri incolo
  return t;
}

function filterRecent(bookings: BookingRecord[]): BookingRecord[] {
  const limit = thresholdDate().getTime();
  return bookings.filter((b) => new Date(b.date).getTime() >= limit);
}

export async function fetchUserBookings(userId: string): Promise<BookingRecord[]> {
  await cancelExpiredBookings();
  const list = await readClient.fetch(
    `*[_type == "booking" && user._ref == $userId] | order(date asc, startTime asc) ${bookingProjection}`,
    { userId },
  );
  return filterRecent(list);
}

export async function fetchActiveBookings(
  date?: string,
  priestId?: string | null,
): Promise<BookingRecord[]> {
  await cancelExpiredBookings();
  const filter = date
    ? `*[_type == "booking" && status != "cancelled" && date == $date ${priestId ? "&& priestId == $priestId" : ""}] | order(date asc, startTime asc) ${bookingProjection}`
    : `*[_type == "booking" && status != "cancelled" ${priestId ? "&& priestId == $priestId" : ""}] | order(date asc, startTime asc) ${bookingProjection}`;

  const params: Record<string, string> = {};
  if (date) params.date = date;
  if (priestId) params.priestId = priestId;

  const list = await readClient.fetch(filter, params);
  return filterRecent(list);
}

export async function fetchAllBookings(): Promise<BookingRecord[]> {
  const list = await readClient.fetch(projectionQuery);
  return filterRecent(list);
}

export async function cancelExpiredBookings(): Promise<void> {
  const today = new Date().toLocaleDateString("en-CA");
  const booked = await readClient.fetch<
    { _id: string; date: string; startTime: string; durationMinutes?: number }[]
  >(`*[_type == "booking" && status == "booked"]{_id,date,startTime,durationMinutes}`);

  const expired = booked.filter((booking) => booking.date < today);

  if (expired.length === 0) return;

  try {
    const client = getWriteClient();
    await Promise.all(
      expired.map((booking) =>
        client
          .patch(booking._id)
          .set({ status: "cancelled", cancelledAt: new Date().toISOString() })
          .commit(),
      ),
    );
  } catch (error) {
    // Nu blocam fluxul principal daca nu putem anula automat.
    console.error("[bookings] Failed to auto-cancel expired bookings", error);
  }
}

export async function createBooking(params: {
  user: AuthUser;
  eventId: string;
}): Promise<BookingRecord> {
  const { user, eventId } = params;

  if (!user.priestId) {
    throw new Error("Nu aveți un preot selectat. Refaceți contul sau contactați administratorul.");
  }

  const userBookings = await fetchUserBookings(user.id);
  const activeOtherPriest = userBookings.find(
    (booking) =>
      booking.status !== "cancelled" &&
      booking.priestId &&
      booking.priestId !== user.priestId,
  );
  if (activeOtherPriest) {
    throw new Error("Aveți deja o programare activă la alt preot. Anulați-o pentru a continua.");
  }

  // Reincarcam durata curenta a user-ului din Sanity pentru a nu depinde doar de sesiune.
  const latestUser = await readClient.fetch<{ allocatedMinutes?: number } | null>(
    `*[_type == "user" && _id == $id][0]{allocatedMinutes}`,
    { id: user.id },
  );
  const durationMinutes = latestUser?.allocatedMinutes ?? user.allocatedMinutes ?? 30;

  const events = getEvents(user.priestId);
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    throw new Error("Evenimentul selectat nu mai este disponibil.");
  }

  const activeForEvent = await fetchActiveBookings(undefined, user.priestId);
  const eventBookings = activeForEvent.filter((b) => b.eventId === event.id && b.status !== "cancelled");

  const userDuplicate = eventBookings.find((booking) => booking.userId === user.id);
  if (userDuplicate) {
    throw new Error("Sunteți deja înscris la acest interval.");
  }

  const totalUsed = eventBookings.reduce(
    (sum, b) => sum + (b.durationMinutes ?? durationMinutes),
    0,
  );
  const remaining = event.durationMinutes - totalUsed;
  if (remaining < durationMinutes) {
    throw new Error("Nu mai este timp disponibil la acest interval.");
  }

  const client = getWriteClient();
  const created = await client.create({
    _type: "booking",
    date: event.date,
    startTime: event.startTime,
    durationMinutes,
    status: "booked",
    priestId: user.priestId,
    eventId: event.id,
    eventLabel: event.label,
    createdAt: new Date().toISOString(),
    user: {
      _type: "reference",
      _ref: user.id,
      _weak: false,
    },
  });

  return {
    _id: created._id,
    date: event.date,
    startTime: event.startTime,
    durationMinutes,
    status: "booked",
    priestId: user.priestId ?? undefined,
    eventId: event.id,
    eventLabel: event.label,
    userId: user.id,
    userName: user.name ?? undefined,
    userEmail: user.email ?? undefined,
    createdAt: created.createdAt,
  };
}

export async function cancelBooking(id: string, user: AuthUser): Promise<BookingRecord> {
  const existing = await readClient.fetch<BookingRecord | null>(
    `*[_type == "booking" && _id == $id][0] ${bookingProjection}`,
    { id },
  );
  if (!existing) {
    throw new Error("Programarea nu există.");
  }

  const allowedToCancel =
    existing.userId === user.id || user.role === "admin" || user.role === "dev";
  if (!allowedToCancel) {
    throw new Error("Nu aveți permisiunea să anulați această programare.");
  }

  const client = getWriteClient();
  await client
    .patch(id)
    .set({
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    })
    .commit();

  return { ...existing, status: "cancelled", cancelledAt: new Date().toISOString() };
}
