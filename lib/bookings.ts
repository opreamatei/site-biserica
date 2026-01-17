import "server-only";
import { getEvents } from "./events";
import { getWriteClient, readClient } from "./sanity";
import { getPriestConfig } from "./priests";
import {
  createNotificationLog,
  sendPriestNotification,
} from "./priest-notifications";
import { getRomaniaEventStart, getRomaniaScheduleTime } from "./time";

export type BookingRecord = {
  _id: string;
  date: string;
  startTime: string; // HH:mm
  durationMinutes: number;
  peopleCount?: number;
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

const MAX_PEOPLE_COUNT = 10;

const bookingProjection =
  `{_id,date,startTime,durationMinutes,peopleCount,status,createdAt,cancelledAt,priestId,eventId,eventLabel,"userId":user._ref,"userName":user->name,"userEmail":user->email}`;

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

function normalizePeopleCount(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 1;
  const normalized = Math.floor(value);
  if (normalized < 1) return 1;
  return normalized > MAX_PEOPLE_COUNT ? MAX_PEOPLE_COUNT : normalized;
}

function validatePeopleCount(value: number | undefined): void {
  if (value === undefined) return;
  if (!Number.isFinite(value)) {
    throw new Error("Numarul de persoane este invalid.");
  }
  const normalized = Math.floor(value);
  if (normalized < 1) {
    throw new Error("Numarul de persoane este invalid.");
  }
  if (normalized > MAX_PEOPLE_COUNT) {
    throw new Error("Numarul maxim de persoane este 10.");
  }
}

function calculateBookingDuration(peopleCount: number, baseMinutes = 15): number {
  const count = normalizePeopleCount(peopleCount);
  const base = Math.max(1, Math.floor(baseMinutes));
  if (count <= 2) return count * base;
  if (count === 3) return base * 2;
  return base * 2 + (count - 3) * 5;
}

function getCutoffDate(eventDate: string, cutoffTime: string): Date {
  return getRomaniaScheduleTime(eventDate, cutoffTime);
}

export async function createBooking(params: {
  user: AuthUser;
  eventId: string;
  peopleCount?: number;
}): Promise<BookingRecord> {
  const { user, eventId } = params;
  validatePeopleCount(params.peopleCount);
  const peopleCount = normalizePeopleCount(params.peopleCount);

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

  // Reincarcam durata curenta a user-ului din Sanity pentru a aplica override-ul adminului.
  const latestUser = await readClient.fetch<{ allocatedMinutes?: number } | null>(
    `*[_type == "user" && _id == $id][0]{allocatedMinutes}`,
    { id: user.id },
  );
  const baseMinutes =
    Math.max(1, Math.floor(latestUser?.allocatedMinutes ?? user.allocatedMinutes ?? 15));
  const durationMinutes = calculateBookingDuration(peopleCount, baseMinutes);

  const events = await getEvents(user.priestId);
  const event = events.find((e) => e.id === eventId);
  if (!event) {
    throw new Error("Evenimentul selectat nu mai este disponibil.");
  }

  const priestConfig = getPriestConfig(user.priestId);
  const now = Date.now();
  const eventStart = getRomaniaEventStart(event.date, event.startTime);
  if (now >= eventStart.getTime()) {
    throw new Error("Înscrierile pentru acest interval s-au Încheiat.");
  }

  const strictCutoff =
    priestConfig && priestConfig.notificationMode === "strict"
      ? priestConfig.notifyTime ?? priestConfig.bookingCutoffTime
      : null;
  if (strictCutoff) {
    const cutoff = getCutoffDate(event.date, strictCutoff);
    if (now >= cutoff.getTime()) {
      throw new Error("Înscrierile pentru acest interval s-au Încheiat.");
    }
  }

  const activeForEvent = await fetchActiveBookings(undefined, user.priestId);
  const eventBookings = activeForEvent.filter((b) => b.eventId === event.id && b.status !== "cancelled");

  const userDuplicate = eventBookings.find((booking) => booking.userId === user.id);
  if (userDuplicate) {
    throw new Error("Sunteți deja înscris la acest interval.");
  }

  const totalUsed = eventBookings.reduce(
    (sum, b) =>
      sum +
      (b.durationMinutes ??
        calculateBookingDuration(
          normalizePeopleCount(b.peopleCount),
          baseMinutes,
        )),
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
    peopleCount,
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

  const newBooking: BookingRecord = {
    _id: created._id,
    date: event.date,
    startTime: event.startTime,
    durationMinutes,
    peopleCount,
    status: "booked",
    priestId: user.priestId ?? undefined,
    eventId: event.id,
    eventLabel: event.label,
    userId: user.id,
    userName: user.name ?? undefined,
    userEmail: user.email ?? undefined,
    createdAt: created.createdAt,
  };
  const summary = [...eventBookings, newBooking];

  const usedAfter = totalUsed + durationMinutes;
  const isFullNow = usedAfter >= event.durationMinutes;
  if (isFullNow) {
    try {
      const sent = await sendPriestNotification({
        event: {
          id: event.id,
          date: event.date,
          startTime: event.startTime,
          label: event.label,
          priestId: event.priestId,
          durationMinutes: event.durationMinutes,
        },
        type: "full",
        bookings: summary,
      });
      if (sent) {
        await createNotificationLog({
          priestId: event.priestId,
          eventId: event.id,
          eventDate: event.date,
          eventStartTime: event.startTime,
          type: "full",
        });
      }
    } catch (error) {
      console.error("[bookings] Failed to send full notification", error);
    }
  }

  return newBooking;
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
