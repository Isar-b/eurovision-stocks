import { cookies } from "next/headers";
import { v4 as uuid } from "uuid";
import { store } from "./store";
import type { User, Portfolio } from "./types";
import { STARTING_CASH } from "./dates";
import { auth as nextAuthSession, oauthEnabled } from "@/auth";

const COOKIE_NAME = "evs_user";

const ADMIN_NAMES = (process.env.ADMIN_NAMES ?? "admin")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

async function ensurePortfolio(userId: string): Promise<void> {
  const existing = await store.getPortfolio(userId);
  if (existing) return;
  const fresh: Portfolio = {
    userId,
    cash: STARTING_CASH,
    holdings: {},
    updatedAt: new Date().toISOString(),
  };
  await store.savePortfolio(fresh);
}

export async function getCurrentUser(): Promise<User | null> {
  if (oauthEnabled) {
    const session = await nextAuthSession();
    if (!session?.user?.email) return null;
    const id =
      (session.user as { id?: string }).id ?? `google:${session.user.email}`;
    let user = await store.getUser(id);
    if (!user) {
      user = {
        id,
        displayName: session.user.name ?? session.user.email,
        email: session.user.email,
        avatar: session.user.image ?? undefined,
        createdAt: new Date().toISOString(),
      };
      await store.upsertUser(user);
      await ensurePortfolio(id);
    } else {
      let dirty = false;
      const next = { ...user };
      if (user.email !== session.user.email) {
        next.email = session.user.email;
        dirty = true;
      }
      if (session.user.image && user.avatar !== session.user.image) {
        next.avatar = session.user.image;
        dirty = true;
      }
      if (dirty) {
        await store.upsertUser(next);
        user = next;
      }
    }
    return user;
  }

  const c = await cookies();
  const id = c.get(COOKIE_NAME)?.value;
  if (!id) return null;
  return store.getUser(id);
}

export async function requireUser(): Promise<User> {
  const u = await getCurrentUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}

export function isAdmin(u: User | null): boolean {
  if (!u) return false;
  if (ADMIN_NAMES.includes(u.displayName.toLowerCase())) return true;
  if (u.email && ADMIN_EMAILS.includes(u.email.toLowerCase())) return true;
  return false;
}

// Mock-auth helpers — used only when OAuth is not configured (local dev).
export async function loginAs(displayName: string): Promise<User> {
  const cleaned = displayName.trim();
  if (!cleaned) throw new Error("Display name required");
  if (cleaned.length > 32) throw new Error("Display name too long");

  const existing = await store.getUserByName(cleaned);
  const user: User =
    existing ??
    {
      id: uuid(),
      displayName: cleaned,
      createdAt: new Date().toISOString(),
    };
  if (!existing) {
    await store.upsertUser(user);
    await ensurePortfolio(user.id);
  } else {
    await ensurePortfolio(existing.id);
  }

  const c = await cookies();
  c.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return user;
}

export async function logout(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export { ensurePortfolio };
