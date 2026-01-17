import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWriteClient, readClient } from "@/lib/sanity";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type ProgramActivity = {
  nume: string;
  ora: string;
};

type ProgramDay = {
  data: string;
  activitati: ProgramActivity[];
};

type ProgramPayload = Record<string, ProgramDay>;

type ProgramActivityInput = {
  nume: string;
  ora?: string | null;
};

type ProgramDayInput = {
  data: string;
  activitati: ProgramActivityInput[];
};

type ProgramPayloadInput = Record<string, ProgramDayInput>;

type ProgramActivityDoc = {
  _key?: string;
  nume?: string;
  ora?: string;
};

type ProgramDayDoc = {
  _key?: string;
  dayKey?: string;
  data?: string;
  activitati?: ProgramActivityDoc[];
};

type ProgramDoc = {
  _id: string;
  _type: "program";
  title?: string;
  days?: ProgramDayDoc[];
};

const PROGRAM_DOC_ID = "program-liturgic";
const programPath = path.join(process.cwd(), "public", "data", "program.json");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isProgramPayload = (value: unknown): value is ProgramPayloadInput => {
  if (!isRecord(value)) return false;
  return Object.values(value).every((day) => {
    if (!isRecord(day)) return false;
    if (typeof day.data !== "string") return false;
    if (!Array.isArray(day.activitati)) return false;
    return day.activitati.every((act) => {
      if (!isRecord(act)) return false;
      if (typeof act.nume !== "string") return false;
      if (act.ora === undefined || act.ora === null) return true;
      if (typeof act.ora !== "string") return false;
      return true;
    });
  });
};

const normalizeProgramPayload = (payload: ProgramPayloadInput): ProgramPayload =>
  Object.fromEntries(
    Object.entries(payload).map(([dayKey, day]) => [
      dayKey,
      {
        data: day.data,
        activitati: day.activitati.map((act) => ({
          nume: act.nume,
          ora: act.ora ?? "",
        })),
      },
    ]),
  );

const normalizeProgramActivity = (value: unknown): ProgramActivity | null => {
  if (!isRecord(value)) return null;
  if (typeof value.nume !== "string") return null;
  return {
    nume: value.nume,
    ora: typeof value.ora === "string" ? value.ora : "",
  };
};

const toPayload = (days: ProgramDayDoc[] | undefined): ProgramPayload => {
  const payload: ProgramPayload = {};
  if (!Array.isArray(days)) return payload;
  for (const day of days) {
    if (!day || typeof day.dayKey !== "string") continue;
    const activitati = Array.isArray(day.activitati)
      ? day.activitati
          .map((act) => normalizeProgramActivity(act))
          .filter((act): act is ProgramActivity => act !== null)
      : [];
    payload[day.dayKey] = {
      data: typeof day.data === "string" ? day.data : "",
      activitati,
    };
  }
  return payload;
};

const toDays = (payload: ProgramPayload): ProgramDayDoc[] =>
  Object.entries(payload).map(([dayKey, day]) => ({
    _key: dayKey,
    dayKey,
    data: day.data,
    activitati: day.activitati.map((act, index) => ({
      _key: `${dayKey}-${index}`,
      nume: act.nume,
      ora: act.ora,
    })),
  }));

async function readProgramFromFile(): Promise<ProgramPayload> {
  const raw = await fs.readFile(programPath, "utf8");
  return JSON.parse(raw) as ProgramPayload;
}

async function readProgramFromSanity(): Promise<ProgramPayload | null> {
  const doc = await readClient.fetch<ProgramDoc | null>(
    `*[_type == "program" && _id == $id][0]{days}`,
    { id: PROGRAM_DOC_ID },
  );
  if (!doc) return null;
  const payload = toPayload(doc.days);
  return Object.keys(payload).length > 0 ? payload : null;
}

async function readProgram(): Promise<ProgramPayload> {
  try {
    const sanityPayload = await readProgramFromSanity();
    if (sanityPayload) return sanityPayload;
  } catch (error) {
    console.error("[program] Failed to read from Sanity", error);
  }

  return readProgramFromFile();
}

async function writeProgram(payload: ProgramPayload): Promise<void> {
  const client = getWriteClient();
  await client.createIfNotExists({
    _id: PROGRAM_DOC_ID,
    _type: "program",
    title: "Program liturgic",
  });
  await client.patch(PROGRAM_DOC_ID).set({ days: toDays(payload) }).commit();
}

export async function GET() {
  try {
    const program = await readProgram();
    return NextResponse.json(program);
  } catch (error) {
    console.error("[program] Failed to read program", error);
    return NextResponse.json(
      { error: "Nu s-a putut citi programul." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Este necesara autentificarea." },
      { status: 401 },
    );
  }
  if (session.user.role !== "admin" && session.user.role !== "dev") {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  if (!isProgramPayload(payload)) {
    return NextResponse.json(
      { error: "Payload invalid pentru program." },
      { status: 400 },
    );
  }

  try {
    const normalizedPayload = normalizeProgramPayload(payload);
    await writeProgram(normalizedPayload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[program] Failed to save program", error);
    return NextResponse.json(
      { error: "Nu s-a putut salva programul." },
      { status: 500 },
    );
  }
}
