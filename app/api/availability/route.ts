import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWriteClient, readClient } from "@/lib/sanity";
import { getPriestsConfig } from "@/lib/priests";

type AvailabilityPayload = {
  priestId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  label?: string;
  durationMinutes?: number;
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

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesara autentificarea." }, { status: 401 });
  }

  const isAdmin = isAdminRole(session.user.role);
  const priestIdFromEmail = resolvePriestIdForUser(session.user.email);

  if (!isAdmin && !priestIdFromEmail) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

  const url = new URL(req.url);
  const requestedPriestId = url.searchParams.get("priestId") ?? undefined;
  const priestId = isAdmin ? requestedPriestId : priestIdFromEmail;

  if (!isAdmin && requestedPriestId && requestedPriestId !== priestIdFromEmail) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

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
    const items = await readClient.fetch(
      query,
      priestId ? { priestId } : undefined,
    );
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[availability] Failed to fetch intervals", error);
    return NextResponse.json(
      { error: "Nu s-au putut incarca intervalele." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesara autentificarea." }, { status: 401 });
  }

  const isAdmin = isAdminRole(session.user.role);
  const priestIdFromEmail = resolvePriestIdForUser(session.user.email);

  if (!isAdmin && !priestIdFromEmail) {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as AvailabilityPayload | null;
  if (!body) {
    return NextResponse.json({ error: "Payload invalid." }, { status: 400 });
  }

  const priestId = isAdmin ? body.priestId : priestIdFromEmail;
  if (!priestId) {
    return NextResponse.json({ error: "Preot invalid." }, { status: 400 });
  }

  if (!body.date || !isValidDate(body.date)) {
    return NextResponse.json({ error: "Data este invalida." }, { status: 400 });
  }
  if (!body.startTime || !isValidTime(body.startTime)) {
    return NextResponse.json({ error: "Ora de inceput este invalida." }, { status: 400 });
  }
  if (!body.endTime || !isValidTime(body.endTime)) {
    return NextResponse.json({ error: "Ora de sfarsit este invalida." }, { status: 400 });
  }

  const startMinutes = parseMinutes(body.startTime);
  const endMinutes = parseMinutes(body.endTime);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return NextResponse.json(
      { error: "Interval orar invalid." },
      { status: 400 },
    );
  }

  const durationMinutes =
    typeof body.durationMinutes === "number" && Number.isFinite(body.durationMinutes)
      ? Math.max(1, Math.floor(body.durationMinutes))
      : undefined;

  try {
    const client = getWriteClient();
    const item = await client.create({
      _type: "spovInterval",
      priestId,
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      label: body.label ?? "",
      durationMinutes,
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("[availability] Failed to create interval", error);
    return NextResponse.json(
      { error: "Nu s-a putut salva intervalul." },
      { status: 500 },
    );
  }
}
