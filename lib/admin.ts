import "server-only";
import { readClient, getWriteClient } from "./sanity";

export type AdminUser = {
  _id: string;
  name?: string;
  email?: string;
  role?: "user" | "admin" | "dev";
  allocatedMinutes?: number;
  priestId?: string | null;
  createdAt?: string;
};

export async function fetchAllUsers(): Promise<AdminUser[]> {
  return readClient.fetch(
    `*[_type == "user"] | order(createdAt desc){_id,name,email,role,allocatedMinutes,priestId,createdAt}`,
  );
}

export async function fetchUserById(userId: string): Promise<AdminUser | null> {
  if (!userId) return null;
  return readClient.fetch(
    `*[_type == "user" && _id == $userId][0]{_id,name,email,role,allocatedMinutes,priestId,createdAt}`,
    { userId },
  );
}

export async function updateAllocatedMinutes(userId: string, minutes: number): Promise<void> {
  const client = getWriteClient();
  await client.patch(userId).set({ allocatedMinutes: minutes }).commit();
}

export async function deleteUserAndBookings(userId: string): Promise<void> {
  if (!userId) return;
  const bookingIds: string[] = await readClient.fetch(
    `*[_type == "booking" && user._ref == $userId]._id`,
    { userId },
  );
  const client = getWriteClient();
  const tx = client.transaction();
  bookingIds.forEach((id) => tx.delete(id));
  tx.delete(userId);
  await tx.commit();
}
