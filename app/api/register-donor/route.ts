import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getWriteClient, readClient } from "@/lib/sanity";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const nameRaw = (body?.name as string | undefined)?.trim();
  const email = (body?.email as string | undefined)?.toLowerCase();
  const password = body?.password as string | undefined;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Va rugam sa completati emailul si parola." },
      { status: 400 },
    );
  }

  if (password.length < 4) {
    return NextResponse.json(
      { error: "Parola trebuie sa aiba minim 4 caractere." },
      { status: 400 },
    );
  }

  const existing = await readClient.fetch<number>(
    `count(*[_type == "user" && email == $email])`,
    { email },
  );

  if (existing > 0) {
    return NextResponse.json({ error: "Exista deja un cont cu acest email." }, { status: 409 });
  }

  const name =
    nameRaw && nameRaw.length > 0
      ? nameRaw
      : email.split("@")[0]?.slice(0, 50) || "Donator";
  const hash = await bcrypt.hash(password, 10);

  try {
    const client = getWriteClient();
    const created = await client.create({
      _type: "user",
      name,
      email,
      passwordHash: hash,
      role: "user",
      allocatedMinutes: 15,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: created._id, email, name }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nu s-a putut crea contul. Verificati cheile Sanity.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
