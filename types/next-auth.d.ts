import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: "user" | "admin" | "dev";
      allocatedMinutes?: number;
      priestId?: string | null;
    };
  }

  interface User {
    id: string;
    role?: "user" | "admin" | "dev";
    allocatedMinutes?: number;
    priestId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "user" | "admin" | "dev";
    allocatedMinutes?: number;
    priestId?: string | null;
  }
}
