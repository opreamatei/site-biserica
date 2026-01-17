import "server-only";
import pr1 from "../data/availability-pr1.json";
import pr2 from "../data/availability-pr2.json";
import pr3 from "../data/availability-pr3.json";
import priests from "../data/priests.json";
import { readClient } from "./sanity";
import type { Priest, SpovEvent } from "@/types/events";

type RawPriest = {
  id: string;
  name: string;
  notificationMode?: string;
  notifyTime?: string;
  bookingCutoffTime?: string;
  notifyEmail?: string | null;
};

type RawEvent = {
  date: string;
  startTime?: string;
  endTime?: string;
  label?: string;
  slots?: string[]; // legacy
  durationMinutes?: number;
};

type AvailabilityDoc = {
  _id: string;
  priestId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  label?: string;
  durationMinutes?: number;
};

const perPriestRaw: Record<string, RawEvent[]> = {
  pr1,
  pr2,
  pr3,
};

const isNotificationMode = (
  value: string | undefined,
): value is Priest["notificationMode"] => value === "flex" || value === "strict";

const normalizedPriests: Priest[] = (priests as RawPriest[]).map((priest) => ({
  ...priest,
  notificationMode: isNotificationMode(priest.notificationMode)
    ? priest.notificationMode
    : undefined,
}));

export function getPriests(): Priest[] {
  return normalizedPriests;
}

async function fetchAvailabilityDocs(priestId?: string): Promise<AvailabilityDoc[]> {
  const filterPriest = priestId ? "&& priestId == $priestId" : "";
  const query = `*[_type == "spovInterval" ${filterPriest}] | order(date asc, startTime asc){
    _id,
    priestId,
    date,
    startTime,
    endTime,
    label,
    durationMinutes
  }`;

  try {
    const params = priestId ? { priestId } : {};
    return await readClient.fetch<AvailabilityDoc[]>(query, params);
  } catch (error) {
    console.error("[events] Failed to fetch availability from Sanity", error);
    return [];
  }
}

export async function getEvents(priestId?: string, daysAhead = 90): Promise<SpovEvent[]> {
  const today = new Date();
  const lower = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // include azi
  const upper = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysAhead);

  const availabilityDocs = await fetchAvailabilityDocs(priestId);
  const hasSanity = availabilityDocs.length > 0;
  const rawSource = (priestId && perPriestRaw[priestId]) || perPriestRaw.pr1 || [];

  const events = (hasSanity
    ? availabilityDocs.map((doc) => ({
        id: doc._id,
        priestId: doc.priestId ?? priestId ?? "pr1",
        date: doc.date ?? "",
        startTime: doc.startTime,
        endTime: doc.endTime,
        label: doc.label,
        durationMinutes: doc.durationMinutes,
      }))
    : rawSource.map((item, index) => ({
        id: `${priestId || "pr1"}-${item.date}-${index}`,
        priestId: priestId || "pr1",
        date: item.date,
        startTime:
          item.startTime ??
          (Array.isArray(item.slots) && item.slots.length > 0
            ? item.slots[0]
            : "08:00"),
        endTime: item.endTime,
        label: item.label,
        durationMinutes: item.durationMinutes,
        slots: item.slots,
      }))) as Array<
    {
      id: string;
      priestId: string;
      date: string;
      startTime?: string;
      endTime?: string;
      label?: string;
      durationMinutes?: number;
      slots?: string[];
    }
  >;

  return events
    .map((item) => {
      if (!item.date || !item.startTime) return null;
      const endTime = item.endTime;
      const parsedDuration =
        endTime != null
          ? (() => {
              const start = new Date(`2000-01-01T${item.startTime}`);
              const end = new Date(`2000-01-01T${endTime}`);
              const diff = (end.getTime() - start.getTime()) / 60000;
              return diff > 0 ? diff : undefined;
            })()
          : undefined;
      const slotDuration =
        Array.isArray(item.slots) ? (item.slots.length || 1) * 30 : undefined;
      const durationMinutes =
        parsedDuration ??
        item.durationMinutes ??
        slotDuration ??
        120;
      return {
        id: item.id,
        priestId: item.priestId,
        date: item.date,
        startTime: item.startTime,
        endTime,
        label: item.label ?? `Sesiune spovedanie ${item.date}`,
        durationMinutes,
      };
    })
    .filter((event): event is SpovEvent => {
      if (!event) return false;
      const d = new Date(event.date);
      return d >= lower && d <= upper;
    })
    .sort((a, b) => {
      if (a.date === b.date) return a.startTime.localeCompare(b.startTime);
      return a.date.localeCompare(b.date);
    });
}
