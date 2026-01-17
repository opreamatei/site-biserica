import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { getWriteClient, readClient } from "@/lib/sanity";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.toLowerCase();
  const rawToken = body?.token as string | undefined;
  const token = rawToken?.replace(/[\s-]/g, "").toUpperCase();
  const password = body?.password as string | undefined;

  if (!email || !token || !password) {
    return NextResponse.json(
      { error: "Emailul, tokenul ?i parola noua sunt obligatorii." },
      { status: 400 },
    );
  }

  if (password.length < 4) {
    return NextResponse.json(
      { error: "Parola trebuie sa aiba minim 4 caractere." },
      { status: 400 },
    );
  }

  const user = await readClient.fetch<{
    _id: string;
    resetToken?: string;
    resetTokenExpires?: string;
  } | null>(
    `*[_type == "user" && email == $email][0]{_id,resetToken,resetTokenExpires}`,
    { email },
  );

  if (!user?._id || !user.resetToken || !user.resetTokenExpires) {
    return NextResponse.json({ error: "Token invalid sau expirat." }, { status: 400 });
  }

  const normalize4 = (v: string) =>
    v.replace(/[\s-]/g, "").toUpperCase().slice(0, 4);

  if (normalize4(user.resetToken) !== normalize4(token)) {
    return NextResponse.json({ error: "Token invalid." }, { status: 400 });
  }

  if (new Date(user.resetTokenExpires).getTime() < Date.now()) {
    return NextResponse.json({ error: "Token expirat." }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const client = getWriteClient();

  await client
    .patch(user._id)
    .set({
      passwordHash: hash,
    })
    .unset(["resetToken", "resetTokenExpires"])
    .commit();

  return NextResponse.json({ ok: true });
}


