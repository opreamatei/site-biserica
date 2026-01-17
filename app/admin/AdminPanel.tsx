"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingRecord } from "@/lib/bookings";
import type { AdminUser } from "@/lib/admin";

type PanelProps = {
  bookings: BookingRecord[];
  users: AdminUser[];
  priestNames: Record<string, string>;
  intervals: AdminInterval[];
  eventLabels: Record<string, string>;
  onUpdate: (formData: FormData) => void;
  priestOptions: PriestOption[];
  canManageAll: boolean;
  managedPriestId?: string | null;
};

type ActiveModal = "bookings" | "users" | "program" | "availability" | null;

type AdminInterval = {
  id: string;
  priestId: string;
  priestName: string;
  label: string;
  date: string;
  startAt: number;
  endAt: number;
  durationMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  peopleCount: number;
};

type PriestOption = {
  id: string;
  name: string;
};

type ProgramActivityState = {
  id: string;
  nume: string;
  ora: string;
};

type ProgramDayState = {
  id: string;
  dayKey: string;
  data: string;
  activitati: ProgramActivityState[];
};

type ProgramPayload = Record<
  string,
  { data?: string; activitati?: { nume?: string; ora?: string }[] }
>;

type AvailabilityItem = {
  id: string;
  priestId: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
};

const BASE_DAY_OPTIONS = [
  { key: "duminică", label: "Duminică" },
  { key: "luni", label: "Luni" },
  { key: "marți", label: "Marți" },
  { key: "miercuri", label: "Miercuri" },
  { key: "joi", label: "Joi" },
  { key: "vineri", label: "Vineri" },
  { key: "sâmbătă", label: "Sâmbătă" },
];

const dayLabelByKey = new Map(BASE_DAY_OPTIONS.map((day) => [day.key, day.label]));

const makeId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildActivityState = (activity?: { nume?: string; ora?: string }) => ({
  id: makeId(),
  nume: typeof activity?.nume === "string" ? activity.nume : "",
  ora: typeof activity?.ora === "string" ? activity.ora : "",
});

const buildDayState = (dayKey: string, day?: ProgramPayload[string]) => ({
  id: makeId(),
  dayKey,
  data: typeof day?.data === "string" ? day.data : "",
  activitati: Array.isArray(day?.activitati)
    ? day.activitati.map(buildActivityState)
    : [],
});

const buildProgramState = (payload: ProgramPayload): ProgramDayState[] => {
  const seen = new Set<string>();
  const days: ProgramDayState[] = [];

  BASE_DAY_OPTIONS.forEach((day) => {
    days.push(buildDayState(day.key, payload[day.key]));
    seen.add(day.key);
  });

  Object.entries(payload).forEach(([dayKey, day]) => {
    if (seen.has(dayKey)) return;
    days.push(buildDayState(dayKey, day));
  });

  return days;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function StatusBadge({ status }: { status: "booked" | "cancelled" }) {
  const label = status === "booked" ? "Confirmată" : "Anulată";
  const styles =
    status === "booked"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
}

const formatRoDate = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const formatted = new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parsed);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export default function AdminPanel({
  bookings,
  users,
  priestNames,
  intervals,
  eventLabels,
  onUpdate,
  priestOptions,
  canManageAll,
  managedPriestId,
}: PanelProps) {
  const [active, setActive] = useState<ActiveModal>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const [deleteUserBusyId, setDeleteUserBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [userQuery, setUserQuery] = useState("");
  const [adminNotice, setAdminNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [programNotice, setProgramNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [programDays, setProgramDays] = useState<ProgramDayState[]>([]);
  const [programLoading, setProgramLoading] = useState(false);
  const [programSaving, setProgramSaving] = useState(false);
  const [availabilityNotice, setAvailabilityNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [availabilityItems, setAvailabilityItems] = useState<AvailabilityItem[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySavingId, setAvailabilitySavingId] = useState<string | null>(null);
  const [availabilityDeletingId, setAvailabilityDeletingId] = useState<string | null>(null);
  const [availabilityPriestId, setAvailabilityPriestId] = useState(
    managedPriestId ?? "",
  );
  const [newInterval, setNewInterval] = useState({
    date: "",
    startTime: "",
    endTime: "",
    label: "",
  });
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const router = useRouter();

  const handlePressStart = (id: string) => {
    setPressedId(id);
  };

  const handlePressEnd = () => {
    setPressedId(null);
  };

  const showNotice = (type: "success" | "error", text: string) => {
    setAdminNotice({ type, text });
    window.setTimeout(() => {
      setAdminNotice(null);
    }, 3200);
  };

  const loadProgram = useCallback(async () => {
    setProgramLoading(true);
    setProgramNotice(null);

    try {
      const res = await fetch("/api/program", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Nu s-a putut incarca programul.",
        );
      }
      const payload = isRecord(data) ? (data as ProgramPayload) : {};
      setProgramDays(buildProgramState(payload));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nu s-a putut incarca programul.";
      setProgramNotice({ type: "error", text: message });
    } finally {
      setProgramLoading(false);
    }
  }, []);

  const handleProgramSave = async () => {
    if (programSaving) return;
    setProgramNotice(null);

    const payload = programDays.reduce<ProgramPayload>((acc, day) => {
      const key = day.dayKey.trim();
      if (!key) return acc;
      acc[key] = {
        data: day.data,
        activitati: day.activitati
          .map((act) => ({
            nume: act.nume.trim(),
            ora: act.ora.trim(),
          }))
          .filter((act) => act.nume.length > 0),
      };
      return acc;
    }, {});

    setProgramSaving(true);
    try {
      const res = await fetch("/api/program", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Nu s-a putut salva programul.",
        );
      }
      setProgramNotice({ type: "success", text: "Program salvat." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nu s-a putut salva programul.";
      setProgramNotice({ type: "error", text: message });
    } finally {
      setProgramSaving(false);
    }
  };

  const loadAvailability = useCallback(
    async (overridePriestId?: string) => {
      setAvailabilityLoading(true);
      setAvailabilityNotice(null);

      const targetPriestId = overridePriestId ?? availabilityPriestId;
      const query = targetPriestId ? `?priestId=${encodeURIComponent(targetPriestId)}` : "";

      try {
        const res = await fetch(`/api/availability${query}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            (data as { error?: string }).error ??
              "Nu s-au putut incarca intervalele.",
          );
        }
        const items = Array.isArray((data as { items?: unknown }).items)
          ? ((data as { items: unknown[] }).items as Array<Record<string, unknown>>)
          : [];
        const mapped = items
          .map((item) => ({
            id: typeof item._id === "string" ? item._id : "",
            priestId: typeof item.priestId === "string" ? item.priestId : targetPriestId,
            date: typeof item.date === "string" ? item.date : "",
            startTime: typeof item.startTime === "string" ? item.startTime : "",
            endTime: typeof item.endTime === "string" ? item.endTime : "",
            label: typeof item.label === "string" ? item.label : "",
          }))
          .filter((item) => item.id && item.priestId);
        setAvailabilityItems(mapped);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Nu s-au putut incarca intervalele.";
        setAvailabilityNotice({ type: "error", text: message });
      } finally {
        setAvailabilityLoading(false);
      }
    },
    [availabilityPriestId],
  );

  const updateAvailabilityField = (
    id: string,
    field: keyof AvailabilityItem,
    value: string,
  ) => {
    setAvailabilityItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const updateNewIntervalField = (
    field: keyof typeof newInterval,
    value: string,
  ) => {
    setNewInterval((current) => ({ ...current, [field]: value }));
  };

  const handleAvailabilityAdd = async () => {
    if (availabilitySavingId) return;
    setAvailabilityNotice(null);

    if (canManageAll && !availabilityPriestId) {
      setAvailabilityNotice({ type: "error", text: "Selectati un preot." });
      return;
    }

    if (!newInterval.date || !newInterval.startTime || !newInterval.endTime) {
      setAvailabilityNotice({
        type: "error",
        text: "Completati data si intervalul orar.",
      });
      return;
    }

    setAvailabilitySavingId("new");
    try {
      const res = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priestId: availabilityPriestId || undefined,
          date: newInterval.date,
          startTime: newInterval.startTime,
          endTime: newInterval.endTime,
          label: newInterval.label,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Nu s-a putut salva intervalul.",
        );
      }
      setNewInterval({
        date: "",
        startTime: "",
        endTime: "",
        label: "",
      });
      setAvailabilityNotice({ type: "success", text: "Interval adaugat." });
      await loadAvailability();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nu s-a putut salva intervalul.";
      setAvailabilityNotice({ type: "error", text: message });
    } finally {
      setAvailabilitySavingId(null);
    }
  };

  const handleAvailabilitySave = async (item: AvailabilityItem) => {
    if (availabilitySavingId) return;
    setAvailabilityNotice(null);
    setAvailabilitySavingId(item.id);

    try {
      const res = await fetch(`/api/availability/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          label: item.label,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Nu s-a putut salva intervalul.",
        );
      }
      setAvailabilityNotice({ type: "success", text: "Interval salvat." });
      await loadAvailability();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nu s-a putut salva intervalul.";
      setAvailabilityNotice({ type: "error", text: message });
    } finally {
      setAvailabilitySavingId(null);
    }
  };

  const handleAvailabilityDelete = async (item: AvailabilityItem) => {
    if (availabilityDeletingId) return;
    setAvailabilityNotice(null);
    setAvailabilityDeletingId(item.id);

    try {
      const res = await fetch(`/api/availability/${item.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "Nu s-a putut sterge intervalul.",
        );
      }
      setAvailabilityNotice({ type: "success", text: "Interval sters." });
      await loadAvailability();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nu s-a putut sterge intervalul.";
      setAvailabilityNotice({ type: "error", text: message });
    } finally {
      setAvailabilityDeletingId(null);
    }
  };

  const handleUpdateSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const result = await onUpdate(formData);
      const ok = (result as { ok?: boolean; error?: string } | undefined)?.ok;
      if (ok) {
        showNotice("success", "Timp salvat cu succes.");
      } else {
        showNotice(
          "error",
          (result as { error?: string } | undefined)?.error ??
            "Nu s-a putut salva timpul.",
        );
      }
    } catch {
      showNotice("error", "Nu s-a putut salva timpul.");
    }

    router.refresh();
  };

  useEffect(() => {
    document.body.style.overflow = active || deleteUserConfirm ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active, deleteUserConfirm]);

  useEffect(() => {
    void loadProgram();
  }, [loadProgram]);

  useEffect(() => {
    if (!managedPriestId) return;
    if (!availabilityPriestId || !canManageAll) {
      setAvailabilityPriestId(managedPriestId);
    }
  }, [managedPriestId, availabilityPriestId, canManageAll]);

  useEffect(() => {
    if (active !== "availability") return;
    void loadAvailability();
  }, [active, availabilityPriestId, loadAvailability]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, 15000);
    return () => {
      window.clearInterval(timer);
    };
  }, [router]);

  useEffect(() => {
    const win = window as typeof window & { ethereum?: { selectedAddress?: unknown } };
    if (!win.ethereum) {
      win.ethereum = { selectedAddress: undefined };
    } else if (typeof win.ethereum === "object" && !("selectedAddress" in win.ethereum)) {
      try {
        win.ethereum.selectedAddress = undefined;
      } catch {
        // ignore
      }
    }

    if (!("clipboard" in navigator)) {
      try {
        Object.defineProperty(navigator, "clipboard", {
          value: { writeText: async () => {} },
          configurable: true,
        });
      } catch {
        // ignore
      }
      return;
    }

    const clipboard = navigator.clipboard as {
      writeText?: (text: string) => Promise<void>;
    } | null;
    if (clipboard && typeof clipboard.writeText !== "function") {
      try {
        clipboard.writeText = async () => {};
      } catch {
        // ignore
      }
    }
  }, []);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort((a, b) =>
        `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
      ),
    [bookings]
  );

  const groupedBookings = useMemo(() => {
    const groups = new Map<
      string,
      { date: string; startTime: string; label: string; items: BookingRecord[] }
    >();
    for (const booking of sortedBookings) {
      const key = `${booking.eventId ?? "event"}-${booking.date}-${booking.startTime}`;
      if (!groups.has(key)) {
      const label = booking.eventId
        ? eventLabels[booking.eventId] ?? booking.eventLabel ?? ""
        : booking.eventLabel ?? "";
      groups.set(key, {
        date: booking.date,
        startTime: booking.startTime,
        label,
        items: [],
      });
      }
      groups.get(key)?.items.push(booking);
    }
    return Array.from(groups.values()).sort((a, b) =>
      `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
    );
  }, [sortedBookings, eventLabels]);

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      (user.name ?? "").toLowerCase().includes(query) ||
      (user.email ?? "").toLowerCase().includes(query),
    );
  }, [users, userQuery]);

  const activeIntervals = useMemo(() => {
    return [...intervals]
      .filter((interval) => interval.endAt > now)
      .sort((a, b) => a.startAt - b.startAt);
  }, [intervals, now]);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("ro-RO", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Bucharest",
      }),
    [],
  );

  const formatTime = (timestamp: number) => timeFormatter.format(new Date(timestamp));

  const closeModal = () => setActive(null);
  const showProgramButton = managedPriestId === "pr1";

  const dayOptions = useMemo(() => {
    const extras = programDays
      .map((day) => day.dayKey)
      .filter((dayKey) => dayKey && !dayLabelByKey.has(dayKey));
    const extraOptions = extras.map((key) => ({ key, label: key }));
    return [...BASE_DAY_OPTIONS, ...extraOptions];
  }, [programDays]);

  const updateDayField = (dayId: string, field: "data" | "dayKey", value: string) => {
    setProgramDays((current) =>
      current.map((day) => (day.id === dayId ? { ...day, [field]: value } : day)),
    );
  };

  const addActivity = (dayId: string) => {
    setProgramDays((current) =>
      current.map((day) =>
        day.id === dayId
          ? { ...day, activitati: [...day.activitati, buildActivityState()] }
          : day,
      ),
    );
  };

  const updateActivity = (
    dayId: string,
    activityId: string,
    field: "nume" | "ora",
    value: string,
  ) => {
    setProgramDays((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          activitati: day.activitati.map((act) =>
            act.id === activityId ? { ...act, [field]: value } : act,
          ),
        };
      }),
    );
  };

  const removeActivity = (dayId: string, activityId: string) => {
    setProgramDays((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          activitati: day.activitati.filter((act) => act.id !== activityId),
        };
      }),
    );
  };

  const requestDeleteUser = (user: AdminUser) => {
    if (deleteUserBusyId) return;
    const label = user.name ?? user.email ?? "utilizatorul";
    setDeleteUserConfirm({ id: user._id, label });
  };

  const handleDeleteUser = async (userId: string) => {
    if (deleteUserBusyId) return;
    setDeleteUserConfirm(null);

    setDeleteUserBusyId(userId);
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showNotice(
        "error",
        data.error ?? "Nu s-a putut șterge utilizatorul.",
      );
      setDeleteUserBusyId(null);
      return;
    }
    setDeleteUserBusyId(null);
    showNotice("success", "Utilizatorul a fost șters.");
    router.refresh();
  };

  return (
    <div className="mt-6">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setActive("bookings")}
          className="rounded-full bg-[#2b220a] px-4 py-2 text-sm font-semibold text-[#f6e8bf] shadow transition-transform duration-150 select-none active:scale-95 cursor-pointer"
        >
          Programări recente
        </button>
        <button
          type="button"
          onClick={() => setActive("users")}
          className="rounded-full bg-[#2b220a] px-4 py-2 text-sm font-semibold text-[#f6e8bf] shadow transition-transform duration-150 select-none active:scale-95 cursor-pointer"
        >
          Utilizatori
        </button>
        {showProgramButton && (
          <button
            type="button"
            onClick={() => setActive("program")}
            className="rounded-full bg-[#2b220a] px-4 py-2 text-sm font-semibold text-[#f6e8bf] shadow transition-transform duration-150 select-none active:scale-95 cursor-pointer"
          >
            Program liturgic
          </button>
        )}
        <button
          type="button"
          onClick={() => setActive("availability")}
          className="rounded-full bg-[#2b220a] px-4 py-2 text-sm font-semibold text-[#f6e8bf] shadow transition-transform duration-150 select-none active:scale-95 cursor-pointer"
        >
          Intervale spovedanie
        </button>
      </div>

      <div className="mt-6 p-4 text-sm text-white/90">
        <div className="flex flex-wrap items-center justify-between gap-2 mt-10 md:mt-6 lg:mt-6">
          <p className="text-base font-semibold text-white/90">Intervale active</p>
        </div>
        <div className="mt-4 grid gap-3">
          {activeIntervals.length === 0 && (
            <div className="rounded-lg border border-white/15 bg-white/15 p-3 text-white/80">
              Nu există intervale active.
            </div>
          )}
          {activeIntervals.map((interval) => {
            const isOngoing = interval.startAt <= now;
            return (
              <div
                key={interval.id}
                className="rounded-xl border border-white/15 bg-white/15 p-3"
              >
                <div className="grid gap-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <div className="text-base font-semibold text-white/90">
                      {formatRoDate(interval.date)}
                    </div>
                    <div className="text-white/70">
                      {formatTime(interval.startAt)} - {formatTime(interval.endAt)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-white/95 break-words">
                    {interval.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/70 sm:grid-cols-3 lg:grid-cols-5 max-[400px]:grid-cols-1 max-[400px]:text-sm">
                    {isOngoing && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-100">
                        Activ acum
                      </span>
                    )}
                    <span className="rounded-full bg-white/15 px-2 py-1 text-white/90">
                      <strong className="font-semibold text-white/95">Persoane:</strong>{" "}
                      {interval.peopleCount}
                    </span>
                    <span className="rounded-full bg-red-500/25 px-2 py-1 text-red-50">
                      <strong className="font-semibold text-red-50">Timp ocupat:</strong>{" "}
                      {interval.usedMinutes} min
                    </span>
                    <span className="rounded-full bg-white/15 px-2 py-1 text-white/90">
                      <strong className="font-semibold text-white/95">Timp liber:</strong>{" "}
                      {interval.remainingMinutes} min
                    </span>
                    <span className="rounded-full bg-white/15 px-2 py-1 text-white/90">
                      <strong className="font-semibold text-white/95">Durata:</strong>{" "}
                      {interval.durationMinutes} min
                    </span>
                  </div>
                </div>
            </div>
            );
          })}
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 select-none"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative mt-16 w-full max-w-5xl rounded-2xl bg-[#fffaf0] shadow-2xl ">
            <div className="flex items-center justify-between border-b border-[#e4d4b0] px-5 py-4">
              <p className="text-lg font-semibold text-[#2b220a] ">
                {active === "bookings"
                  ? "Programări recente"
                  : active === "users"
                    ? "Utilizatori"
                    : active === "program"
                      ? "Program liturgic"
                      : "Intervale spovedanie"}
              </p>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Închide"
                className="rounded-full border border-[#2b220a]/20 bg-[#f6e8bf] px-3 py-1 text-sm font-semibold text-[#2b220a] transition-colors duration-150 active:scale-95 active:bg-[#e4d4b0] cursor-pointer"
              >
                x
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
              {adminNotice && (
                <div
                  className={`mb-4 rounded-lg border px-4 py-2 text-sm ${
                    adminNotice.type === "success"
                      ? "border-emerald-600/40 bg-emerald-500/20 text-emerald-900"
                      : "border-red-600/40 bg-red-500/20 text-red-900"
                  }`}
                >
                  {adminNotice.text}
                </div>
              )}
              {active === "program" ? (
                <div className="grid gap-4">
                  <div className="rounded-xl border border-[#e4d4b0] bg-[#fff6dc] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#2b220a]">
                          Editor program liturgic
                        </p>
    
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={loadProgram}
                          disabled={programLoading || programSaving}
                          className="rounded-md border border-[#e4d4b0] bg-white px-4 py-2 text-sm font-semibold text-[#2b220a] transition-transform duration-150 hover:bg-[#f6e8bf] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {programLoading ? "Se încarcă..." : "Reîncarcă"}
                        </button>
                        <button
                          type="button"
                          onClick={handleProgramSave}
                          disabled={programSaving || programLoading}
                          className="rounded-md bg-[#2b220a] px-4 py-2 text-sm font-semibold text-[#f6e8bf] transition-transform duration-150 hover:bg-[#3a2f12] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {programSaving ? "Se salvează..." : "Salvează program"}
                        </button>
                      </div>
                    </div>
                    {programNotice && (
                      <div
                        className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                          programNotice.type === "success"
                            ? "border-emerald-600/40 bg-emerald-500/20 text-emerald-900"
                            : "border-red-600/40 bg-red-500/20 text-red-900"
                        }`}
                      >
                        {programNotice.text}
                      </div>
                    )}
                  </div>

                  {programLoading && programDays.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white/85 p-4 text-sm text-slate-500">
                      Se incarca programul...
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {programDays.map((day) => {
                      const label = dayLabelByKey.get(day.dayKey) ?? day.dayKey;
                      return (
                        <div
                          key={day.id}
                          className="rounded-xl border border-[#e4d4b0] bg-white/95 p-4 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-[#2b220a] px-2 py-1 text-[10px] font-semibold text-[#f6e8bf]">
                                {label}
                              </span>
                              <span className="text-xs text-[#6b5a2b]">
                                {day.data || "Fara data"}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3">
                            <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-wide text-slate-500">
                                  Zi
                                </span>
                                <select
                                  value={day.dayKey}
                                  onChange={(event) =>
                                    updateDayField(day.id, "dayKey", event.target.value)
                                  }
                                  className="rounded-md border border-[#e4d4b0] bg-white px-3 py-2 text-sm text-[#2b220a] focus:outline-none focus:ring-2 focus:ring-[#2b220a]/20"
                                >
                                  {dayOptions.map((option) => (
                                    <option key={option.key} value={option.key}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-wide text-slate-500">
                                  Data
                                </span>
                                <input
                                  value={day.data}
                                  onChange={(event) =>
                                    updateDayField(day.id, "data", event.target.value)
                                  }
                                  placeholder="ex. 11 ianuarie"
                                  className="rounded-md border border-[#e4d4b0] bg-white px-3 py-2 text-sm text-[#2b220a] focus:outline-none focus:ring-2 focus:ring-[#2b220a]/20"
                                />
                              </div>
                            </div>

                            <div className="grid gap-2">
                              {day.activitati.length === 0 && (
                                <p className="text-xs text-slate-500">
                                  Nu exista activitati pentru aceasta zi.
                                </p>
                              )}
                              {day.activitati.map((act) => (
                                <div
                                  key={act.id}
                                  className="rounded-lg border border-[#e4d4b0]/70 bg-[#fffaf0] p-3"
                                >
                                  <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto] items-end">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] uppercase tracking-wide text-slate-500">
                                        Activitate
                                      </span>
                                      <input
                                        value={act.nume}
                                        onChange={(event) =>
                                          updateActivity(
                                            day.id,
                                            act.id,
                                            "nume",
                                            event.target.value,
                                          )
                                        }
                                        placeholder="ex. Dumnezeiasca Liturghie"
                                        className="rounded-md border border-[#e4d4b0] bg-white px-3 py-2 text-sm text-[#2b220a] focus:outline-none focus:ring-2 focus:ring-[#2b220a]/20"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[10px] uppercase tracking-wide text-slate-500">
                                        Ora (opțional)
                                      </span>
                                      <input
                                        value={act.ora}
                                        onChange={(event) =>
                                          updateActivity(
                                            day.id,
                                            act.id,
                                            "ora",
                                            event.target.value,
                                          )
                                        }
                                        placeholder="HH:mm"
                                        className="rounded-md border border-[#e4d4b0] bg-white px-3 py-2 text-sm text-[#2b220a] focus:outline-none focus:ring-2 focus:ring-[#2b220a]/20"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeActivity(day.id, act.id)}
                                      className="rounded-md border border-red-200 bg-red-300/80 px-3 py-2 text-sm font-semibold text-red-700 transition-transform duration-150 hover:bg-red-100 active:scale-95"
                                    >
                                      Șterge
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => addActivity(day.id)}
                            className="mt-3 rounded-md border border-[#e4d4b0] bg-[#f6e8bf] px-4 py-2 text-sm font-semibold text-[#2b220a] transition-transform duration-150 hover:bg-[#e4d4b0] active:scale-95"
                          >
                            Adaugă activitate
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-500 font-bold">
                    Completează activitățile și orele, apoi salvează programul.
                  </p>
                </div>
              ) : active === "availability" ? (
                <div className="grid gap-4">
                  <div className="rounded-xl border border-[#e4d4b0] bg-[#fff6dc] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#2b220a]">
                          Intervale spovedanie
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void loadAvailability()}
                          disabled={availabilityLoading}
                          className="rounded-md border border-[#e4d4b0] bg-white px-4 py-2 text-sm font-semibold text-[#2b220a] transition-transform duration-150 hover:bg-[#f6e8bf] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {availabilityLoading ? "Se încarcă..." : "Reîncarcă"}
                        </button>
                      </div>
                    </div>
                    {availabilityNotice && (
                      <div
                        className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                          availabilityNotice.type === "success"
                            ? "border-emerald-600/40 bg-emerald-500/20 text-emerald-900"
                            : "border-red-600/40 bg-red-500/20 text-red-900"
                        }`}
                      >
                        {availabilityNotice.text}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[#e4d4b0] bg-white/95 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-[#2b220a]">
                      Adaugă interval
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[160px_120px_120px_1fr_auto]">
                      <input
                        type="date"
                        value={newInterval.date}
                        onChange={(event) => updateNewIntervalField("date", event.target.value)}
                        className="rounded-md border border-[#e4d4b0] bg-white px-3 py-2 text-sm text-[#2b220a]"
                      />
                      <input
                        type="time"
                        value={newInterval.startTime}
                        onChange={(event) =>
                          updateNewIntervalField("startTime", event.target.value)
                        }
                        className="rounded-md border border-[#e4d4b0] bg-white px-3 py-2 text-sm text-[#2b220a]"
                      />
                      <input
                        type="time"
                        value={newInterval.endTime}
                        onChange={(event) =>
                          updateNewIntervalField("endTime", event.target.value)
                        }
                        className="rounded-md border border-[#e4d4b0] bg-white px-3 py-2 text-sm text-[#2b220a]"
                      />
                      <input
                        value={newInterval.label}
                        onChange={(event) => updateNewIntervalField("label", event.target.value)}
                        placeholder="Etichetă (opțional)"
                        className="rounded-md border border-[#e4d4b0] bg-white px-3 py-2 text-sm text-[#2b220a]"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAvailabilityAdd}
                          disabled={availabilitySavingId === "new"}
                          className="rounded-md bg-[#2b220a] px-4 py-2 text-sm font-semibold text-[#f6e8bf] transition-transform duration-150 hover:bg-[#3a2f12] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {availabilitySavingId === "new" ? "Se adaugă..." : "Adaugă"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {availabilityLoading && availabilityItems.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white/85 p-4 text-sm text-slate-500">
                      Se încarcă intervalele...
                    </div>
                  )}

                  {availabilityItems.length === 0 && !availabilityLoading ? (
                    <div className="rounded-lg border border-slate-200 bg-white/85 p-4 text-sm text-slate-500">
                      Nu există intervale salvate.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {availabilityItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-[#e4d4b0]/70 bg-[#fffaf0] p-3"
                        >
                          <div className="grid gap-2 sm:grid-cols-[160px_120px_120px_1fr_auto_auto] items-end">
                            <input
                              type="date"
                              value={item.date}
                              onChange={(event) =>
                                updateAvailabilityField(item.id, "date", event.target.value)
                              }
                              className="rounded-md border border-[#e4d4b0] bg-white px-2 py-1 text-xs text-[#2b220a]"
                            />
                            <input
                              type="time"
                              value={item.startTime}
                              onChange={(event) =>
                                updateAvailabilityField(
                                  item.id,
                                  "startTime",
                                  event.target.value,
                                )
                              }
                              className="rounded-md border border-[#e4d4b0] bg-white px-2 py-1 text-xs text-[#2b220a]"
                            />
                            <input
                              type="time"
                              value={item.endTime}
                              onChange={(event) =>
                                updateAvailabilityField(
                                  item.id,
                                  "endTime",
                                  event.target.value,
                                )
                              }
                              className="rounded-md border border-[#e4d4b0] bg-white px-2 py-1 text-xs text-[#2b220a]"
                            />
                            <input
                              value={item.label}
                              onChange={(event) =>
                                updateAvailabilityField(item.id, "label", event.target.value)
                              }
                              placeholder="Etichetă"
                              className="rounded-md border border-[#e4d4b0] bg-white px-2 py-1 text-xs text-[#2b220a]"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleAvailabilitySave(item)}
                                disabled={availabilitySavingId === item.id}
                                className="rounded-md border border-[#e4d4b0] bg-white px-3 py-1.5 text-sm font-semibold text-[#2b220a] transition-transform duration-150 hover:bg-[#f6e8bf] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {availabilitySavingId === item.id ? "Se salvează..." : "Salvează"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAvailabilityDelete(item)}
                                disabled={availabilityDeletingId === item.id}
                                className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition-transform duration-150 hover:bg-red-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {availabilityDeletingId === item.id ? "Se șterge..." : "Șterge"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : active === "bookings" ? (
                <div className="grid gap-4">
                  {groupedBookings.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white/85 p-4 text-sm text-slate-500">
                      Nu exista programari.
                    </div>
                  )}
                  {groupedBookings.map((group) => (
                    <div
                      key={`${group.date}-${group.startTime}-${group.label}`}
                      className="rounded-xl p-4 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-semibold">{formatRoDate(group.date)}</div>
                        <div className="text-slate-600">{group.startTime}</div>
                        {group.label && (
                          <div className="text-xs text-slate-500">{group.label}</div>
                        )}
                      </div>
                      <div className="mt-3 grid gap-3">
                        {group.items.map((booking) => (
                          <div
                            key={booking._id}
                            className="rounded-lg border border-slate-100 bg-white/80 p-3 text-sm"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-slate-800 font-medium">
                                {booking.userName ?? "-"}
                              </div>
                              <div className="text-slate-500">{booking.userEmail ?? "-"}</div>
                              <div className="ml-auto">
                                <StatusBadge status={booking.status} />
                              </div>
                            </div>
                            <div className="mt-2 grid gap-1 text-slate-700">
                              <div>
                                <span className="font-medium">Persoane:</span> {booking.peopleCount ?? 1}
                              </div>
                              <div>
                                <span className="font-medium">Durata:</span> {booking.durationMinutes} min
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  <div className="rounded-lg border border-slate-200 bg-white/85 p-4 text-sm text-slate-600">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Căutare nume / email
                    </label>
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(event) => setUserQuery(event.target.value)}
                      placeholder="Introduceți numele sau emailul"
                      className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2b220a]/30"
                    />
                  </div>
                  {filteredUsers.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white/85 p-4 text-sm text-slate-500">
                      Nu există utilizatori
                    </div>
                  )}
                  {filteredUsers.map((user) => (
                    <div
                      key={user._id}
                      className="rounded-xl border border-slate-200 bg-white/90 p-4 text-sm shadow-sm"
                    >
                      <div className="text-base font-semibold">{user.name ?? "-"}</div>
                      <div className="text-slate-700">{user.email ?? "-"}</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                              <form
                                onSubmit={handleUpdateSubmit}
                                className="flex items-center gap-2"
                              >
                                <input type="hidden" name="userId" value={user._id} />
                                <input
                                  type="number"
                                  name="allocatedMinutes"
                                  min={1}
                                  defaultValue={user.allocatedMinutes ?? 15}
                                  className="w-20 rounded border border-slate-300 px-2 py-1"
                                />
                                <span className="text-xs font-semibold text-slate-500">min</span>
                                <button
                                  type="submit"
                                  className="rounded bg-[#2b220a] px-3 py-1 text-[#f6e8bf] hover:bg-[#3a2f12] transition-transform duration-150 active:scale-95 cursor-pointer"
                                >
                                  Salvează
                          </button>
                        </form>
                        <button
                          type="button"
                          disabled={deleteUserBusyId === user._id}
                          onClick={() => requestDeleteUser(user)}
                          className={`rounded-md border border-white/20 bg-red-700/60 px-3 py-1 text-sm text-white hover:bg-red-500/60 cursor-pointer transition-transform duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${pressedId === `delete-${user._id}` ? "scale-95" : "scale-100"}`}
                          onTouchStart={() => handlePressStart(`delete-${user._id}`)}
                          onTouchEnd={handlePressEnd}
                          onMouseDown={() => handlePressStart(`delete-${user._id}`)}
                          onMouseUp={handlePressEnd}
                          onMouseLeave={handlePressEnd}
                        >
                          {deleteUserBusyId === user._id ? "Se șterge..." : "Șterge"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {deleteUserConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setDeleteUserConfirm(null);
            }
          }}
        >
          <div className="mt-16 w-full max-w-sm rounded-2xl border border-[#e4d4b0] bg-[#fffaf0] p-5 shadow-2xl">
            <p className="text-lg font-semibold text-[#2b220a]">Ștergere utilizator</p>
            <p className="mt-2 text-sm text-[#4b3b12]">
              Ștergeți utilizatorul{" "}
              <span className="font-semibold">{deleteUserConfirm.label}</span>? Vor fi
              șterse și programările lui.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteUserConfirm(null)}
                className="rounded-md border border-[#2b220a]/20 bg-[#f6e8bf] px-3 py-1 text-sm font-semibold text-[#2b220a] transition-transform duration-150 active:scale-95"
              >
                Renunță
              </button>
              <button
                type="button"
                disabled={deleteUserBusyId === deleteUserConfirm.id}
                onClick={() => void handleDeleteUser(deleteUserConfirm.id)}
                className="rounded-md border border-white/20 bg-red-600/60 px-3 py-1 text-sm font-semibold text-white hover:bg-red-600 transition-transform duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteUserBusyId === deleteUserConfirm.id ? "Se șterge..." : "Șterge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
