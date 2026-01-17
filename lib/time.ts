import "server-only";

const RO_TIME_ZONE = "Europe/Bucharest";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function parseDateParts(value: string): { year: number; month: number; day: number } | null {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return { year, month, day };
}

function parseTimeParts(value: string): { hour: number; minute: number } | null {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }
  return { hour, minute };
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const values: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  const asUtc = Date.UTC(
    values.year ?? date.getUTCFullYear(),
    (values.month ?? date.getUTCMonth() + 1) - 1,
    values.day ?? date.getUTCDate(),
    values.hour ?? 0,
    values.minute ?? 0,
    values.second ?? 0,
  );

  return asUtc - date.getTime();
}

function zonedTimeToUtc(parts: DateParts, timeZone: string): Date {
  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second),
  );
  const offset = getTimeZoneOffset(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset);
}

export function getRomaniaEventStart(eventDate: string, startTime: string): Date {
  const dateParts = parseDateParts(eventDate) ?? {
    year: new Date().getUTCFullYear(),
    month: new Date().getUTCMonth() + 1,
    day: new Date().getUTCDate(),
  };
  const timeParts = parseTimeParts(startTime) ?? { hour: 0, minute: 0 };

  return zonedTimeToUtc(
    {
      year: dateParts.year,
      month: dateParts.month,
      day: dateParts.day,
      hour: timeParts.hour,
      minute: timeParts.minute,
      second: 0,
    },
    RO_TIME_ZONE,
  );
}

export function getRomaniaScheduleTime(eventDate: string, notifyTime: string): Date {
  const baseDate = parseDateParts(eventDate);
  if (!baseDate) {
    return getRomaniaEventStart(eventDate, notifyTime);
  }

  const utcBase = new Date(Date.UTC(baseDate.year, baseDate.month - 1, baseDate.day));
  utcBase.setUTCDate(utcBase.getUTCDate() - 1);

  const timeParts = parseTimeParts(notifyTime) ?? { hour: 0, minute: 0 };

  return zonedTimeToUtc(
    {
      year: utcBase.getUTCFullYear(),
      month: utcBase.getUTCMonth() + 1,
      day: utcBase.getUTCDate(),
      hour: timeParts.hour,
      minute: timeParts.minute,
      second: 0,
    },
    RO_TIME_ZONE,
  );
}
