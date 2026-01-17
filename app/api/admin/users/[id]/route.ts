import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteUserAndBookings, fetchUserById } from "@/lib/admin";
import { getPriests } from "@/lib/events";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id?: string | string[] }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesara autentificarea." }, { status: 401 });
  }
  if (session.user.role !== "admin" && session.user.role !== "dev") {
    return NextResponse.json({ error: "Acces interzis." }, { status: 403 });
  }

  const fallbackId = (() => {
    try {
      const url = new URL(req.url);
      return url.pathname.split("/").pop();
    } catch {
      return null;
    }
  })();

  const resolvedParams = await params;
  const paramId = Array.isArray(resolvedParams.id)
    ? resolvedParams.id[0]
    : resolvedParams.id;
  const id = paramId ?? fallbackId;

  if (!id || id === "[id]") {
    return NextResponse.json({ error: "ID invalid." }, { status: 400 });
  }

  const sessionEmail = session.user.email?.toLowerCase();
  const matchedPriest = getPriests().find(
    (priest) => priest.notifyEmail && priest.notifyEmail.toLowerCase() === sessionEmail,
  );
  if (matchedPriest) {
    const targetUser = await fetchUserById(id);
    if (!targetUser || targetUser.priestId !== matchedPriest.id) {
      return NextResponse.json(
        { error: "Nu ai permisiunea sa stergi acest utilizator." },
        { status: 403 },
      );
    }
  }

  try {
    await deleteUserAndBookings(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu s-a putut sterge utilizatorul.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
