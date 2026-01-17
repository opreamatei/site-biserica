import { Resend } from "resend";
import { readClient, getWriteClient } from "./sanity";
import { PriestNotificationEmail } from "./emails/priest-notification";
import type { BookingRecord } from "./bookings";
import { getPriestConfig } from "./priests";
import { getRomaniaEventStart, getRomaniaScheduleTime } from "./time";

type NotificationType = "scheduled" | "full";

type NotificationLog = {
  _id: string;
  type: NotificationType;
  sentAt?: string;
};

type EventInfo = {
  id: string;
  date: string;
  startTime: string;
  label: string;
  priestId: string;
  durationMinutes: number;
};

const formatSummary = (bookings: BookingRecord[]) => {
  const items = bookings.map((booking) => ({
    name: booking.userName ?? "Utilizator",
    email: booking.userEmail ?? undefined,
    peopleCount: booking.peopleCount ?? 1,
    durationMinutes: booking.durationMinutes,
  }));
  const totalPeople = items.reduce((sum, item) => sum + item.peopleCount, 0);
  const totalMinutes = items.reduce((sum, item) => sum + item.durationMinutes, 0);
  return { items, totalPeople, totalMinutes };
};

export async function getNotificationLog(
  eventId: string,
  type: NotificationType,
): Promise<NotificationLog | null> {
  return readClient.fetch(
    `*[_type == "priestNotification" && eventId == $eventId && type == $type] | order(sentAt desc)[0]{_id,type,sentAt}`,
    { eventId, type },
  );
}

export async function createNotificationLog(params: {
  priestId: string;
  eventId: string;
  eventDate: string;
  eventStartTime: string;
  type: NotificationType;
  recipient?: string | null;
}): Promise<void> {
  const client = getWriteClient();
  await client.create({
    _type: "priestNotification",
    priestId: params.priestId,
    eventId: params.eventId,
    eventDate: params.eventDate,
    eventStartTime: params.eventStartTime,
    type: params.type,
    recipient: params.recipient ?? undefined,
    sentAt: new Date().toISOString(),
  });
}

export async function sendPriestNotification(params: {
  event: EventInfo;
  type: NotificationType;
  bookings: BookingRecord[];
}): Promise<boolean> {
  const config = getPriestConfig(params.event.priestId);
  const email = config?.notifyEmail ?? null;
  if (!email) return false;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[priest-notifications] Missing RESEND_API_KEY");
    return false;
  }

  const { items, totalPeople, totalMinutes } = formatSummary(params.bookings);
  const resend = new Resend(apiKey);
  const message = PriestNotificationEmail({
    priestName: config?.name ?? "Parinte",
    eventDate: params.event.date,
    eventStartTime: params.event.startTime,
    eventLabel: params.event.label,
    type: params.type,
    bookings: items,
    totalPeople,
    totalMinutes,
  });

  await resend.emails.send({
    from: "Biserica Foișor <noreply@bisericafoisor.ro>",
    to: email,
    subject:
      params.type === "full"
        ? `Interval complet: ${params.event.date} ${params.event.startTime}`
        : `Programari: ${params.event.date} ${params.event.startTime}`,
    react: message,
  });
  return true;
}

export function calculateScheduleTime(eventDate: string, time: string): Date {
  return getRomaniaScheduleTime(eventDate, time);
}

export function parseEventStart(eventDate: string, startTime: string): Date {
  return getRomaniaEventStart(eventDate, startTime);
}
