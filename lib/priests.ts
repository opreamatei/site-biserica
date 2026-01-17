import priests from "@/data/priests.json";

export type NotificationMode = "strict" | "flex";

export type PriestConfig = {
  id: string;
  name: string;
  notificationMode?: NotificationMode;
  notifyTime?: string;
  bookingCutoffTime?: string;
  notifyEmail?: string | null;
};

export function getPriestsConfig(): PriestConfig[] {
  return priests as PriestConfig[];
}

export function getPriestConfig(priestId: string): PriestConfig | undefined {
  return getPriestsConfig().find((p) => p.id === priestId);
}
