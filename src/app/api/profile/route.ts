import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Username-addressed profile storage on Upstash KV.
 *
 * The PIN is deliberately weak by design — four digits, optional, and the
 * username alone is the address. It stops a stray sign-in from clobbering
 * someone's history; it is not authentication and this endpoint must never
 * hold anything sensitive.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

const KEY = (u: string) => `tmd:u:${u}`;
const USERNAME_RE = /^[a-z0-9](?:[a-z0-9_-]{1,18}[a-z0-9])$/;
const PIN_RE = /^\d{4}$/;
/** Guards the KV free tier against a runaway client. */
const MAX_BODY = 512 * 1024;

interface Stored {
  username: string;
  pinHash?: string;
  createdAt: number;
  updatedAt: number;
  data: unknown;
}

function hashPin(username: string, pin: string): string {
  return createHash("sha256").update(`${username}:${pin}`).digest("hex");
}

function pinMatches(stored: Stored, pin?: string): boolean {
  if (!stored.pinHash) return true;
  if (!pin) return false;
  const a = Buffer.from(stored.pinHash, "hex");
  const b = Buffer.from(hashPin(stored.username, pin), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

async function kv(path: string, init?: RequestInit) {
  const res = await fetch(`${KV_URL}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${KV_TOKEN}`, ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`KV ${res.status}`);
  return (await res.json()) as { result: string | null };
}

async function readProfile(username: string): Promise<Stored | null> {
  const { result } = await kv(`get/${encodeURIComponent(KEY(username))}`);
  if (!result) return null;
  try {
    return JSON.parse(result) as Stored;
  } catch {
    return null;
  }
}

async function writeProfile(p: Stored): Promise<void> {
  await kv(`set/${encodeURIComponent(KEY(p.username))}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(p),
  });
}

const bad = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  if (!KV_URL || !KV_TOKEN) {
    return bad("Sync isn't configured on this deployment.", 503);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) return bad("Profile too large.", 413);

  let body: {
    action?: string;
    username?: string;
    pin?: string;
    data?: unknown;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return bad("Malformed request.");
  }

  const username = (body.username ?? "").trim().toLowerCase();
  if (!USERNAME_RE.test(username)) return bad("Invalid username.");
  if (body.pin !== undefined && !PIN_RE.test(body.pin))
    return bad("PIN must be exactly 4 digits.");

  try {
    const existing = await readProfile(username);

    switch (body.action) {
      case "check":
        return NextResponse.json({
          exists: !!existing,
          hasPin: !!existing?.pinHash,
        });

      case "create": {
        if (existing) return bad("That username is taken.", 409);
        const now = Date.now();
        await writeProfile({
          username,
          pinHash: body.pin ? hashPin(username, body.pin) : undefined,
          createdAt: now,
          updatedAt: now,
          data: body.data ?? null,
        });
        return NextResponse.json({ ok: true, hasPin: !!body.pin });
      }

      case "load": {
        if (!existing) return bad("No profile with that username.", 404);
        if (!pinMatches(existing, body.pin))
          return bad("That PIN doesn't match.", 401);
        return NextResponse.json({
          data: existing.data,
          hasPin: !!existing.pinHash,
          updatedAt: existing.updatedAt,
        });
      }

      case "save": {
        if (!existing) return bad("No profile with that username.", 404);
        if (!pinMatches(existing, body.pin))
          return bad("That PIN doesn't match.", 401);
        await writeProfile({
          ...existing,
          updatedAt: Date.now(),
          data: body.data ?? existing.data,
        });
        return NextResponse.json({ ok: true });
      }

      default:
        return bad("Unknown action.");
    }
  } catch {
    return bad("Storage is unavailable right now.", 502);
  }
}
