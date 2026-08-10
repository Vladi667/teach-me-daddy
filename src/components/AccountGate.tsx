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
 * Nothing in the app is reachable without an account. Until one is active this
 * replaces the whole shell — the tab bar included — so there's no half-signed-in
 * state to reason about downstream.
 */
export default function AccountGate({ children }: { children: React.ReactNode }) {
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

function Wordmark() {
  return (
    <div className="mb-8 text-center">
      <div
        className="mx-auto mb-5 grid size-[68px] place-items-center rounded-[22px]"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 1px 0 0 rgba(255,255,255,0.18) inset",
        }}
      >
        <span
          className="heb text-[34px] leading-none"
          style={{
            fontFamily: "var(--font-hebrew)",
            background: "linear-gradient(135deg, #a8b6ff, #d3b0ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          א
        </span>
      </div>
      <h1 className="text-[30px] leading-[1.1] font-bold tracking-[-0.03em]">
        Teach me{" "}
        <span
          style={{
            background:
              "linear-gradient(100deg, var(--color-accent), var(--color-accent-2))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Daddy
        </span>
      </h1>
      <p className="mt-2 text-[13px] text-(--color-ink-dim)">
        Hebrew, one letter at a time.
      </p>
    </div>
  );
}

function Splash() {
  return (
    <Shell>
      <div className="anim-fade">
        <Wordmark />
      </div>
    </Shell>
  );
}

function Gate() {
  const { data } = useStore();
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
      <div className="anim-rise">
        <Wordmark />

        {mode === "choose" ? (
          <>
            <button
              onClick={() => {
                tap();
                setMode("login");
                setName("");
                setErr(null);
              }}
              className="press mb-2.5 min-h-[52px] w-full rounded-full text-[15px] font-semibold"
              style={{
                background:
                  "linear-gradient(100deg, var(--color-accent), var(--color-accent-2))",
                boxShadow: "0 8px 26px -10px rgba(111,139,255,0.9)",
              }}
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
              className="glass press min-h-[52px] w-full rounded-full text-[15px] font-semibold"
            >
              Create an account
            </button>

            <p className="mt-6 px-2 text-center text-[11.5px] leading-relaxed text-(--color-ink-faint)">
              {SYNC_ENABLED
                ? "Your username is how your progress finds you. No email, no password — type it on any device and everything is there. This one stays logged in until you log out."
                : "This copy runs without a server, so an account here stays on this device."}
            </p>

            {orphaned > 0 && (
              <p
                className="mt-3 rounded-[14px] px-3.5 py-2.5 text-[11.5px] leading-snug"
                style={{
                  background: "rgba(255,183,77,0.10)",
                  color: "var(--color-amber)",
                }}
              >
                There&apos;s progress on this device from before you had an
                account. Creating one keeps it; logging into a different
                account leaves it behind.
              </p>
            )}
          </>
        ) : (
          <>
            <h2 className="mb-3 text-center text-[15px] font-semibold">
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
              className="w-full rounded-[16px] bg-white/6 px-4 py-3.5 text-[16px] outline-none placeholder:text-(--color-ink-faint)"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            />

            {mode === "create" && (
              <label className="mt-3 flex items-center gap-2.5 px-1 text-[12.5px] text-(--color-ink-dim)">
                <input
                  type="checkbox"
                  checked={usePin}
                  onChange={(e) => setUsePin(e.target.checked)}
                  className="size-4 accent-[var(--color-accent)]"
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
                placeholder={mode === "login" ? "PIN, if it has one" : "4-digit PIN"}
                inputMode="numeric"
                className="mt-2.5 w-full rounded-[16px] bg-white/6 px-4 py-3.5 text-[16px] tracking-[0.3em] outline-none placeholder:tracking-normal placeholder:text-(--color-ink-faint)"
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              />
            )}

            {err && (
              <p
                className="anim-fade mt-3 rounded-[14px] px-3.5 py-2.5 text-[12px] leading-snug"
                style={{
                  background: "rgba(255,107,122,0.12)",
                  color: "var(--color-coral)",
                }}
              >
                {err}
              </p>
            )}

            <button
              disabled={busy || name.trim().length < 3}
              onClick={submit}
              className="press mt-4 min-h-[52px] w-full rounded-full text-[15px] font-semibold"
              style={{
                background:
                  "linear-gradient(100deg, var(--color-accent), var(--color-accent-2))",
                opacity: busy || name.trim().length < 3 ? 0.45 : 1,
              }}
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
              className="press mt-2 min-h-[44px] w-full rounded-full text-[13px] font-medium text-(--color-ink-dim)"
            >
              Back
            </button>

            {mode === "create" && (
              <p className="mt-4 px-2 text-center text-[11px] leading-relaxed text-(--color-ink-faint)">
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
