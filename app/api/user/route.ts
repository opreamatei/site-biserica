import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWriteClient, readClient } from "@/lib/sanity";

type BookingId = { _id: string };

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Este necesara autentificarea." }, { status: 401 });
  }

  const userId = session.user.id;
  const client = getWriteClient();

  try {
    const bookings = await readClient.fetch<BookingId[]>(
      `*[_type == "booking" && user._ref == $userId]{_id}`,
      { userId },
    );

    if (bookings.length > 0) {
      const tx = client.transaction();
      bookings.forEach((booking) => {
        tx.delete(booking._id);
      });
      await tx.commit();
    }

    await client.delete(userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu s-a putut sterge contul.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
