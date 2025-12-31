import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getWriteClient, readClient } from "@/lib/sanity";
import { sendResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = (body?.email as string | undefined)?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Emailul lipsește." }, { status: 400 });
  }

  const user = await readClient.fetch<{ _id: string } | null>(
    `*[_type == "user" && email == $email][0]{_id}`,
    { email },
  );

  // Returnam eroare daca nu exista contul, ca sa afisam mesajul in UI.
  if (!user?._id) {
    return NextResponse.json(
      { error: "Emailul nu este înregistrat." },
      { status: 404 },
    );
  }

  const token = randomBytes(4).toString("hex").toUpperCase();
  const expires = new Date(Date.now() + 1000 * 60 * 30).toISOString(); // 30 min

  const client = getWriteClient();
  await client
    .patch(user._id)
    .set({ resetToken: token, resetTokenExpires: expires })
    .commit();

  const origin = (() => {
    try {
      return new URL(req.url).origin;
    } catch {
      return undefined;
    }
  })();

  const sent = await sendResetEmail({ to: email, token, expires, origin });

  // In dev sau daca email-ul nu e configurat, returnam token-ul pentru debug.
  const includeToken = sent !== "sent";

  return NextResponse.json({
    ok: true,
    token: includeToken ? token : undefined,
    expires,
    note:
      sent === "sent"
        ? "Token trimis pe email."
        : "Email neconfigurat sau esuat; token returnat pentru debug local.",
  });
}
