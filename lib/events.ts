import pr1 from "../data/availability-pr1.json";
import pr2 from "../data/availability-pr2.json";
import pr3 from "../data/availability-pr3.json";
import priests from "../data/priests.json";

export type Priest = { id: string; name: string };

export type SpovEvent = {
  id: string;
  priestId: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  label: string;
  durationMinutes: number;
};

type RawEvent = {
  date: string;
  startTime?: string;
  endTime?: string;
  label?: string;
  slots?: string[]; // legacy
  durationMinutes?: number;
};

const perPriestRaw: Record<string, RawEvent[]> = {
  pr1,
  pr2,
  pr3,
};

export function getPriests(): Priest[] {
  return priests;
}

export function getEvents(priestId?: string, daysAhead = 90): SpovEvent[] {
  const today = new Date();
  const lower = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // include azi
  const upper = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysAhead);

  const source = (priestId && perPriestRaw[priestId]) || perPriestRaw.pr1 || [];

  return source
    .map((item, index) => {
      const startTime =
        item.startTime ??
        (Array.isArray(item.slots) && item.slots.length > 0 ? item.slots[0] : "08:00");
      const endTime = item.endTime;
      const parsedDuration =
        endTime != null
          ? (() => {
              const start = new Date(`2000-01-01T${startTime}`);
              const end = new Date(`2000-01-01T${endTime}`);
              const diff = (end.getTime() - start.getTime()) / 60000;
              return diff > 0 ? diff : undefined;
            })()
          : undefined;
      const durationMinutes =
        parsedDuration ??
        item.durationMinutes ??
        (Array.isArray(item.slots) ? (item.slots.length || 1) * 30 : 120);
      return {
        id: `${priestId || "pr1"}-${item.date}-${index}`,
        priestId: priestId || "pr1",
        date: item.date,
        startTime,
        endTime,
        label: item.label ?? `Sesiune spovedanie ${item.date}`,
        durationMinutes,
      };
    })
    .filter((event) => {
      const d = new Date(event.date);
      return d >= lower && d <= upper;
    })
    .sort((a, b) => {
      if (a.date === b.date) return a.startTime.localeCompare(b.startTime);
      return a.date.localeCompare(b.date);
    });
}
