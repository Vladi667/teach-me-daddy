"use client";

import { useState } from "react";
import {
  SYNC_ENABLED,
  createProfile,
  signIn,
  useStore,
  validateUsername,
} from "@/lib/store";
import { tap } from "@/lib/feedback";

type Mode = "choose" | "create" | "login";

/**
 * The first one is the flagship and the only one that ever server-renders —
 * see Splash. The rest rotate on the gate, which is client-only.
 */
const TAGLINES = [
  "Cook Hebrew like Daddy.",
  "From alef to oy vey.",
  "Right to left. No going back.",
  "Nikud? Never heard of her.",
  "Low and slow, like a good tsimmes.",
  "Five months. Six thousand words. One Daddy.",
  "22 letters stand between you and shawarma.",
  "Read backwards. Brag forwards.",
  "Your bubbe is watching.",
];

/** Imported rather than inlined so the purity lint rule stays happy. */
function pickTagline(): string {
  return TAGLINES[Math.floor(Math.random() * TAGLINES.length)];
}

/**
 * Nothing in the app is reachable without an account. Until one is active this
 * replaces the whole shell — the tab bar included — so there's no half-signed-in
 * state to reason about downstream.
 */
export default function AccountGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, isGuest } = useStore();

  // `ready` is false on the server and on the first client render, so both
  // agree on the splash and hydration stays quiet.
  if (!ready) return <Splash />;
  if (isGuest) return <Gate />;
  return <>{children}</>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="stage mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-6"
      style={{
        paddingTop: "calc(var(--safe-t) + 24px)",
        paddingBottom: "calc(var(--safe-b) + 24px)",
      }}
    >
      {children}
    </main>
  );
}

function Wordmark({ tagline }: { tagline: string }) {
  return (
    <div className="mb-8 text-center">
      <span className="heb mb-6 block text-[64px] leading-none text-accent">
        א
      </span>
      <h1 className="text-2xl leading-[1.05] font-bold tracking-[-0.03em]">
        Teach me Daddy
      </h1>
      <p className="mt-3 min-h-[22px] text-md text-ink-2">{tagline}</p>
    </div>
  );
}

/** What a friend arriving cold is actually signing up for. */
function Pitch() {
  return (
    <div className="mb-7 flex justify-center gap-1.5">
      {["22 letters", "Spaced repetition", "5-month plan"].map((t) => (
        <span
          key={t}
          className="panel rounded-full px-3 py-1.5 text-xs whitespace-nowrap text-ink-2"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function Splash() {
  return (
    <Shell>
      <div className="anim-fade">
        {/* The flagship line only — this is the one that server-renders. */}
        <Wordmark tagline={TAGLINES[0]} />
      </div>
    </Shell>
  );
}

function Gate() {
  const { data } = useStore();
  const [tagline] = useState(pickTagline);
  const [mode, setMode] = useState<Mode>("choose");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [usePin, setUsePin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Anything done before an account existed shouldn't silently vanish.
  const orphaned =
    Object.keys(data.alphabet).length +
    Object.keys(data.srs).length +
    data.custom.length +
    Object.keys(data.plan.days).length;

  async function go(fn: () => Promise<void>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    const problem = validateUsername(name);
    if (problem) {
      setErr(problem);
      return;
    }
    tap();
    if (mode === "create") {
      if (usePin && pin.length !== 4) {
        setErr("A PIN must be exactly 4 digits.");
        return;
      }
      void go(() => createProfile(name, usePin ? pin : undefined));
    } else {
      void go(() => signIn(name, pin || undefined));
    }
  }

  return (
    <Shell>
      <div>
        <Wordmark tagline={tagline} />

        {mode === "choose" ? (
          <>
            <Pitch />

            <button
              onClick={() => {
                tap();
                setMode("login");
                setName("");
                setErr(null);
              }}
              className="btn btn-primary mb-2.5 w-full"
            >
              Log in
            </button>

            <button
              onClick={() => {
                tap();
                setMode("create");
                setName("");
                setErr(null);
              }}
              className="btn btn-secondary w-full"
            >
              Create an account
            </button>

            <p className="mt-6 px-2 text-center text-sm leading-relaxed text-ink-3">
              {SYNC_ENABLED
                ? "Your username is how your progress finds you. No email, no password — type it on any device and everything is there. This one stays logged in until you log out."
                : "This copy runs without a server, so an account here stays on this device."}
            </p>

            {orphaned > 0 && (
              <p
                className="mt-3 rounded-[14px] px-3.5 py-2.5 text-sm leading-snug"
                style={{
                  background:
                    "color-mix(in oklch, var(--color-warn) 12%, transparent)",
                  color: "var(--color-warn)",
                }}
              >
                There&apos;s progress on this device from before you had an
                account. Creating one keeps it; logging into a different account
                leaves it behind.
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="mb-3 text-center text-md font-semibold">
              {mode === "create" ? "Pick a username" : "Enter your username"}
            </h2>

            <input
              value={name}
              onChange={(e) => setName(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="username"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="field"
            />

            {mode === "create" && (
              <label className="mt-3 flex items-center gap-2.5 px-1 text-sm text-ink-2">
                <input
                  type="checkbox"
                  checked={usePin}
                  onChange={(e) => setUsePin(e.target.checked)}
                  className="size-4 accent-accent"
                />
                Lock it with a 4-digit PIN
              </label>
            )}

            {(usePin || mode === "login") && (
              <input
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder={
                  mode === "login" ? "PIN, if it has one" : "4-digit PIN"
                }
                inputMode="numeric"
                className="field mt-2.5 tracking-[0.3em] placeholder:tracking-normal"
              />
            )}

            {err && (
              <p
                className="anim-fade mt-3 rounded-[14px] px-3.5 py-2.5 text-[12px] leading-snug"
                style={{
                  background:
                    "color-mix(in oklch, var(--color-bad) 14%, transparent)",
                  color: "var(--color-bad)",
                }}
              >
                {err}
              </p>
            )}

            <button
              disabled={busy || name.trim().length < 3}
              onClick={submit}
              className="btn btn-primary mt-4 w-full"
            >
              {busy
                ? "Working…"
                : mode === "create"
                  ? "Create and start"
                  : "Log in"}
            </button>

            <button
              onClick={() => {
                tap();
                setMode("choose");
                setErr(null);
                setPin("");
                setUsePin(false);
              }}
              className="btn btn-quiet mt-1.5 w-full text-sm"
            >
              Back
            </button>

            {mode === "create" && (
              <p className="mt-4 px-2 text-center text-xs leading-relaxed text-ink-3">
                A PIN only stops someone overwriting your progress by accident.
                It isn&apos;t security — don&apos;t keep anything private here.
              </p>
            )}
          </>
        )}
      </div>
    </Shell>
  );
}
