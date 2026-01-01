import { NextResponse } from "next/server";
import { auth } from "@/auth";
import priests from "@/data/priests.json";
import { getWriteClient } from "@/lib/sanity";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesarŽŸ autentificarea." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const priestId = body?.priestId as string | undefined;

  if (!priestId) {
    return NextResponse.json({ error: "Preotul este obligatoriu." }, { status: 400 });
  }

  const validPriest = priests.find((p) => p.id === priestId);
  if (!validPriest) {
    return NextResponse.json({ error: "Preot invalid." }, { status: 400 });
  }

  const client = getWriteClient();
  await client.patch(session.user.id).set({ priestId }).commit();

  return NextResponse.json({ ok: true, priestId });
}
