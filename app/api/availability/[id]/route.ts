import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWriteClient, readClient } from "@/lib/sanity";
import { getPriestsConfig } from "@/lib/priests";

type AvailabilityUpdate = {
  date?: string;
  startTime?: string;
  endTime?: string;
  label?: string;
  durationMinutes?: number;
};

type AvailabilityDoc = {
  _id: string;
  priestId?: string;
};

const isAdminRole = (role?: string) => role === "admin" || role === "dev";

const resolvePriestIdForUser = (email?: string | null) => {
  if (!email) return undefined;
  const normalized = email.toLowerCase();
  return getPriestsConfig().find(
    (priest) => priest.notifyEmail && priest.notifyEmail.toLowerCase() === normalized,
  )?.id;
};

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidTime = (value: string) => /^\d{2}:\d{2}$/.test(value);

const parseMinutes = (time: string) => {
  const [h, m] = time.split(":").map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const resolveIdFromParams = async (
  req: Request,
  params: Promise<{ id?: string | string[] }>,
) => {
  const resolvedParams = await params;
  const paramId = Array.isArray(resolvedParams.id)
    ? resolvedParams.id[0]
    : resolvedParams.id;
  if (paramId && paramId !== "[id]") return paramId;

  try {
    const url = new URL(req.url);
    const fallbackId = url.pathname.split("/").pop();
    return fallbackId && fallbackId !== "[id]" ? fallbackId : undefined;
  } catch {
    return undefined;
  }
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id?: string | string[] }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesara autentificarea." }, { status: 401 });
  }

  const isAdmin = isAdminRole(session.user.role);
  const priestIdFromEmail = resolvePriestIdForUser(session.user.email);
  if (!isAdmin && !priestIdFromEmail) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

  const id = await resolveIdFromParams(req, params);
  if (!id) {
    return NextResponse.json({ error: "ID invalid." }, { status: 400 });
  }

  const existing = await readClient.fetch<AvailabilityDoc | null>(
    `*[_type == "spovInterval" && _id == $id][0]{_id,priestId}`,
    { id },
  );
  if (!existing) {
    return NextResponse.json({ error: "Intervalul nu exista." }, { status: 404 });
  }
  if (!isAdmin && existing.priestId && existing.priestId !== priestIdFromEmail) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as AvailabilityUpdate | null;
  if (!body) {
    return NextResponse.json({ error: "Payload invalid." }, { status: 400 });
  }

  const updates: AvailabilityUpdate = {};

  if (body.date !== undefined) {
    if (!body.date || !isValidDate(body.date)) {
      return NextResponse.json({ error: "Data este invalida." }, { status: 400 });
    }
    updates.date = body.date;
  }
  if (body.startTime !== undefined) {
    if (!body.startTime || !isValidTime(body.startTime)) {
      return NextResponse.json({ error: "Ora de inceput este invalida." }, { status: 400 });
    }
    updates.startTime = body.startTime;
  }
  if (body.endTime !== undefined) {
    if (!body.endTime || !isValidTime(body.endTime)) {
      return NextResponse.json({ error: "Ora de sfarsit este invalida." }, { status: 400 });
    }
    updates.endTime = body.endTime;
  }

  if (updates.startTime && updates.endTime) {
    const startMinutes = parseMinutes(updates.startTime);
    const endMinutes = parseMinutes(updates.endTime);
    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return NextResponse.json(
        { error: "Interval orar invalid." },
        { status: 400 },
      );
    }
  }

  if (body.label !== undefined) {
    updates.label = body.label;
  }
  if (body.durationMinutes !== undefined) {
    if (!Number.isFinite(body.durationMinutes)) {
      return NextResponse.json({ error: "Durata este invalida." }, { status: 400 });
    }
    updates.durationMinutes = Math.max(1, Math.floor(body.durationMinutes));
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nu exista modificari." }, { status: 400 });
  }

  try {
    const client = getWriteClient();
    const item = await client.patch(id).set(updates).commit();
    return NextResponse.json({ item });
  } catch (error) {
    console.error("[availability] Failed to update interval", error);
    return NextResponse.json(
      { error: "Nu s-a putut salva intervalul." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id?: string | string[] }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesara autentificarea." }, { status: 401 });
  }

  const isAdmin = isAdminRole(session.user.role);
  const priestIdFromEmail = resolvePriestIdForUser(session.user.email);
  if (!isAdmin && !priestIdFromEmail) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

  const id = await resolveIdFromParams(req, params);
  if (!id) {
    return NextResponse.json({ error: "ID invalid." }, { status: 400 });
  }

  const existing = await readClient.fetch<AvailabilityDoc | null>(
    `*[_type == "spovInterval" && _id == $id][0]{_id,priestId}`,
    { id },
  );
  if (!existing) {
    return NextResponse.json({ error: "Intervalul nu exista." }, { status: 404 });
  }
  if (!isAdmin && existing.priestId && existing.priestId !== priestIdFromEmail) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

  try {
    const client = getWriteClient();
    const bookingIds = await readClient.fetch<string[]>(
      `*[_type == "booking" && eventId == $eventId]._id`,
      { eventId: id },
    );
    const tx = client.transaction();
    bookingIds.forEach((bookingId) => {
      tx.delete(bookingId);
    });
    tx.delete(id);
    await tx.commit();
    return NextResponse.json({ ok: true, deletedBookings: bookingIds.length });
  } catch (error) {
    console.error("[availability] Failed to delete interval", error);
    return NextResponse.json(
      { error: "Nu s-a putut sterge intervalul." },
      { status: 500 },
    );
  }
}
