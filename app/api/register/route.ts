import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getWriteClient, readClient } from "@/lib/sanity";
import priests from "@/data/priests.json";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = (body?.name as string | undefined)?.trim();
  const email = (body?.email as string | undefined)?.toLowerCase();
  const password = body?.password as string | undefined;
  const priestId = body?.priestId as string | undefined;

  if (!name || !email || !password || !priestId) {
    return NextResponse.json(
      { error: "Vă rugăm să completați numele, emailul, parola și să alegeți un preot." },
      { status: 400 },
    );
  }

  const validPriest = priests.find((p) => p.id === priestId);
  if (!validPriest) {
    return NextResponse.json({ error: "Preot invalid." }, { status: 400 });
  }

  const existing = await readClient.fetch<number>(
    `count(*[_type == "user" && email == $email])`,
    { email },
  );

  if (existing > 0) {
    return NextResponse.json({ error: "Există deja un cont cu acest email." }, { status: 409 });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const client = getWriteClient();
    const created = await client.create({
      _type: "user",
      name,
      email,
      passwordHash: hash,
      role: "user",
      allocatedMinutes: 30,
      priestId,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: created._id, email, name }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nu s-a putut crea contul. Verificați cheile Sanity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
