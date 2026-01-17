import { NextResponse } from "next/server";
import { fetchActiveBookings, type BookingRecord } from "@/lib/bookings";
import { getEvents } from "@/lib/events";
import { getPriestsConfig } from "@/lib/priests";
import {
  calculateScheduleTime,
  createNotificationLog,
  getNotificationLog,
  parseEventStart,
  sendPriestNotification,
} from "@/lib/priest-notifications";

type GroupedBooking = Record<
  string,
  {
    totalMinutes: number;
    bookings: BookingRecord[];
  }
>;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const priests = getPriestsConfig();

  for (const priest of priests) {
    if (!priest.notifyTime || !priest.notificationMode) {
      continue;
    }

    const events = await getEvents(priest.id, 2);
    if (events.length === 0) continue;

    const allBookings = await fetchActiveBookings(undefined, priest.id);
    const grouped = allBookings.reduce<GroupedBooking>((acc, booking) => {
      const eventId = booking.eventId ?? "";
      if (!eventId) return acc;
      if (!acc[eventId]) {
        acc[eventId] = { totalMinutes: 0, bookings: [] };
      }
      acc[eventId].totalMinutes += booking.durationMinutes ?? 0;
      acc[eventId].bookings.push(booking);
      return acc;
    }, {});

    for (const event of events) {
      const eventStart = parseEventStart(event.date, event.startTime);
      if (eventStart.getTime() < now.getTime()) {
        continue;
      }

      const scheduleTime = calculateScheduleTime(event.date, priest.notifyTime);
      const groupedData = grouped[event.id];
      const usedMinutes = groupedData?.totalMinutes ?? 0;
      const isFull = usedMinutes >= event.durationMinutes;

      if (isFull) {
        const existingFull = await getNotificationLog(event.id, "full");
        if (!existingFull) {
          try {
            const sent = await sendPriestNotification({
              event,
              type: "full",
              bookings: groupedData?.bookings ?? [],
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
            console.error("[cron] Failed to send full notification", error);
          }
        }
      }

      if (now.getTime() < scheduleTime.getTime()) {
        continue;
      }

      const existingScheduled = await getNotificationLog(event.id, "scheduled");
      if (existingScheduled) {
        continue;
      }

      const shouldSendScheduled =
        priest.notificationMode === "strict" ? true : !isFull;
      if (!shouldSendScheduled) {
        continue;
      }

      try {
        const sent = await sendPriestNotification({
          event,
          type: "scheduled",
          bookings: groupedData?.bookings ?? [],
        });
        if (sent) {
          await createNotificationLog({
            priestId: event.priestId,
            eventId: event.id,
            eventDate: event.date,
            eventStartTime: event.startTime,
            type: "scheduled",
          });
        }
      } catch (error) {
        console.error("[cron] Failed to send scheduled notification", error);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
