import NextAuth, { getServerSession } from "next-auth";
import type { NextAuthOptions, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { readClient } from "./lib/sanity";

type UserRole = "user" | "admin" | "dev";

const parseRole = (value: unknown): UserRole | undefined => {
  return value === "admin" || value === "dev" || value === "user" ? value : undefined;
};

const parseMinutes = (value: unknown): number | undefined => {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const authConfig: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase();
        let user:
          | {
              _id: string;
              name?: string;
              email?: string;
              passwordHash?: string;
              role?: "user" | "admin" | "dev";
              allocatedMinutes?: number;
              priestId?: string;
            }
          | null = null;

        try {
          user = await readClient.fetch(
            `*[_type == "user" && email == $email][0]{_id,name,email,passwordHash,role,allocatedMinutes,priestId}`,
            { email },
          );
        } catch (error) {
          console.error("[auth] Failed to query Sanity for user:", error);
          return null;
        }

        if (!user?.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role ?? "user",
          allocatedMinutes: user.allocatedMinutes ?? 15,
          priestId: user.priestId ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const userRecord = user as unknown as {
          role?: unknown;
          allocatedMinutes?: unknown;
          priestId?: unknown;
        };
        const role = parseRole(userRecord.role);
        const minutes = parseMinutes(userRecord.allocatedMinutes);
        token.role = role ?? "user";
        token.allocatedMinutes = minutes ?? 15;
        token.priestId = typeof userRecord.priestId === "string" ? userRecord.priestId : undefined;
      }
      if (trigger === "update" && session) {
        const nextRole =
          parseRole((session as Record<string, unknown>).role) ??
          parseRole((session as { user?: Record<string, unknown> }).user?.role);
        const nextMinutes =
          parseMinutes((session as Record<string, unknown>).allocatedMinutes) ??
          parseMinutes((session as { user?: Record<string, unknown> }).user?.allocatedMinutes);
        const nextPriestId =
          typeof (session as Record<string, unknown>).priestId === "string"
            ? ((session as Record<string, unknown>).priestId as string)
            : typeof (session as { user?: Record<string, unknown> }).user?.priestId === "string"
              ? ((session as { user?: Record<string, unknown> }).user?.priestId as string)
              : undefined;

        if (nextRole) token.role = nextRole;
        if (typeof nextMinutes === "number") token.allocatedMinutes = nextMinutes;
        if (nextPriestId) token.priestId = nextPriestId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        const role = parseRole((token as Record<string, unknown>).role);
        const minutes = parseMinutes((token as Record<string, unknown>).allocatedMinutes);
        session.user.role = role ?? "user";
        session.user.allocatedMinutes = minutes ?? 15;
        session.user.priestId = (token as Record<string, unknown>).priestId as
          | string
          | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

const nextAuth = NextAuth(authConfig);

// Normalise output for both NextAuth v5 (returns helpers) and v4 (returns a handler function).
export const handlers =
  (nextAuth as { handlers?: { GET: typeof nextAuth; POST: typeof nextAuth } }).handlers ?? {
    GET: nextAuth,
    POST: nextAuth,
  };
export const auth =
  (nextAuth as { auth?: () => Promise<Session | null> }).auth ??
  (() => getServerSession(authConfig));
export const signIn = (nextAuth as { signIn?: unknown }).signIn;
export const signOut = (nextAuth as { signOut?: unknown }).signOut;
