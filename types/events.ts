export type Priest = {
  id: string;
  name: string;
  notificationMode?: "strict" | "flex";
  notifyTime?: string;
  bookingCutoffTime?: string;
  notifyEmail?: string | null;
};

export type SpovEvent = {
  id: string;
  priestId: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  label: string;
  durationMinutes: number;
};
