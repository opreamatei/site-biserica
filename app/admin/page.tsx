import { auth } from "@/auth";
import { fetchAllBookings } from "@/lib/bookings";
import { fetchAllUsers, updateAllocatedMinutes } from "@/lib/admin";
import { getEvents, getPriests } from "@/lib/events";
import { getRomaniaEventStart } from "@/lib/time";
import { revalidatePath } from "next/cache";
import AdminPanel from "./AdminPanel";
import Logo from "@/components/optimized/components/Logo";
import YellowTexture from "@/components/yellowbg";

export default async function AdminPage() {
  const session = await auth();
  const role = session?.user?.role;
  const priests = getPriests();
  const sessionEmail = session?.user?.email?.toLowerCase();
  const matchedPriest = sessionEmail
    ? priests.find(
        (priest) => priest.notifyEmail && priest.notifyEmail.toLowerCase() === sessionEmail,
      )
    : undefined;
  const isAdmin = role === "admin" || role === "dev";
  const isPriest = Boolean(matchedPriest);

  if (!session?.user || (!isAdmin && !isPriest)) {
    return (
      <div className="min-h-screen flex flex-col p-6 text-center">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md space-y-3">
            <p className="text-2xl font-semibold text-white/80">Acces restricționat</p>
            <p className="text-sm text-slate-600">
              Această pagină este disponibilă doar pentru administratori.
            </p>
          </div>
        </div>
        <div className="pb-15 mb-10 flex justify-center">
          <Logo theme="light" />
        </div>
      </div>
    );
  }

  const [bookings, users] = await Promise.all([fetchAllBookings(), fetchAllUsers()]);

  const priestNameById = Object.fromEntries(priests.map((p) => [p.id, p.name]));
  const sessionUserId = session.user.id;
  const visibleBookings = matchedPriest
    ? bookings.filter((booking) => booking.priestId === matchedPriest.id)
    : bookings;
  const activeBookings = visibleBookings.filter((booking) => booking.status !== "cancelled");
  const usedMinutesByEvent = activeBookings.reduce<Map<string, number>>((acc, booking) => {
    if (!booking.eventId) return acc;
    const current = acc.get(booking.eventId) ?? 0;
    acc.set(booking.eventId, current + (booking.durationMinutes ?? 0));
    return acc;
  }, new Map());
  const peopleCountByEvent = activeBookings.reduce<Map<string, number>>((acc, booking) => {
    if (!booking.eventId) return acc;
    const current = acc.get(booking.eventId) ?? 0;
    acc.set(booking.eventId, current + (booking.peopleCount ?? 1));
    return acc;
  }, new Map());
  const baseUsers = matchedPriest
    ? users.filter((user) => user.priestId === matchedPriest.id)
    : users;
  const visibleUsers = baseUsers.filter((user) => {
    if (sessionUserId && user._id === sessionUserId) return false;
    if (sessionEmail && user.email?.toLowerCase() === sessionEmail) return false;
    return true;
  });
  const eventLabelsById = new Map<string, string>();
  const eventsByPriest = await Promise.all(
    priests.map(async (priest) => ({
      priest,
      events: await getEvents(priest.id),
    })),
  );
  const intervals = eventsByPriest.flatMap(({ priest, events }) => {
    events.forEach((event) => {
      eventLabelsById.set(event.id, event.label);
    });
    return events.map((event) => {
      const startAt = getRomaniaEventStart(event.date, event.startTime).getTime();
      const endAt = startAt + event.durationMinutes * 60_000;
      const durationMinutes = Math.max(0, Math.round((endAt - startAt) / 60000));
      const usedMinutes = usedMinutesByEvent.get(event.id) ?? 0;
      const remainingMinutes = Math.max(0, durationMinutes - usedMinutes);
      const peopleCount = peopleCountByEvent.get(event.id) ?? 0;
      return {
        id: event.id,
        priestId: event.priestId,
        priestName: priest.name,
        label: event.label,
        date: event.date,
        startAt,
        endAt,
        durationMinutes,
        usedMinutes,
        remainingMinutes,
        peopleCount,
      };
    });
  });
  const visibleIntervals = matchedPriest
    ? intervals.filter((interval) => interval.priestId === matchedPriest.id)
    : intervals;
  const visibleEventLabels = matchedPriest
    ? Object.fromEntries(
        (eventsByPriest.find((item) => item.priest.id === matchedPriest.id)?.events ?? []).map(
          (event) => [event.id, event.label],
        ),
      )
    : Object.fromEntries(eventLabelsById.entries());
  const priestOptions = priests.map((priest) => ({ id: priest.id, name: priest.name }));
  const managedPriestId = matchedPriest?.id ?? priests[0]?.id ?? null;


  async function handleUpdate(formData: FormData) {
    "use server";
    const authSession = await auth();
    const authRole = authSession?.user?.role;
    if (!authSession?.user || (authRole !== "admin" && authRole !== "dev")) {
      return { ok: false, error: "Nu ai permisiunea de a face modificări." };
    }

    const userId = String(formData.get("userId") || "");
    const rawMinutes = Number(formData.get("allocatedMinutes"));
    const minutes = Number.isFinite(rawMinutes) ? Math.max(1, Math.floor(rawMinutes)) : 15;

    if (!userId) {
      return { ok: false, error: "Utilizator invalid." };
    }

    try {
      await updateAllocatedMinutes(userId, minutes);
      revalidatePath("/admin");
      return { ok: true };
    } catch {
      return { ok: false, error: "Nu s-a putut salva timpul." };
    }
  }

  return (
    <YellowTexture>
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6 rounded-2xl">
        <div className="mx-auto w-full max-w-4xl grid gap-6 rounded-2xl p-4 md:p-6 select-text">
          <div className="text-center">
            <p className="mt-8 md:mt-4 lg:mt-4 text-sm uppercase tracking-wide text-white/60 select-none">Pagină administrare</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white/90 mt-3">
              {session.user.name ?? "Fără nume"}

            </h1>
            <p className="mt-3 text-sm text-white/70 select-none">
            Email: {session.user.email ?? "-"}
            </p>
          </div>
          <div className="mt-6 md:mt-10">
            <AdminPanel
              bookings={visibleBookings}
              users={visibleUsers}
              priestNames={priestNameById}
              intervals={visibleIntervals}
              eventLabels={visibleEventLabels}
              onUpdate={handleUpdate}
              priestOptions={priestOptions}
              canManageAll={isAdmin}
              managedPriestId={managedPriestId}
            />
          </div>
          <div className="mt-16 flex justify-center">
            <Logo />
          </div>
        </div>
      </div>
    </YellowTexture>
  );
}
