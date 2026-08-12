"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tap } from "@/lib/feedback";
import { LINK_PREFETCH } from "@/lib/base-path";

/**
 * §10 — two screens and a settings page. Study, Letters and the deck browser
 * were peers of TODAY, which made the programme one option among several;
 * everything the syllabus issues now runs from TODAY and returns there.
 */
const TABS = [
  { href: "/", label: "Today", icon: TodayIcon },
  { href: "/plan", label: "Record", icon: PlanIcon },
  { href: "/me", label: "You", icon: YouIcon },
] as const;

/** Routes that belong under a tab but aren't the tab's own href. */
const OWNED: Record<string, string[]> = {
  "/": ["/learn", "/review", "/shadow", "/produce", "/assess"],
  "/me": ["/notes", "/alphabet", "/practice", "/progress"],
};

export default function TabBar() {
  const pathname = usePathname();

  const activeHref =
    TABS.map((t) => t.href).find(
      (href) =>
        href !== "/" &&
        (pathname.startsWith(href) ||
          (OWNED[href] ?? []).some((p) => pathname.startsWith(p))),
    ) ?? "/";

  return (
    <nav
      // §12 — a translucent layer the page passes under, with a scroll edge
      // instead of a rule.
      className="chrome chrome-edge fixed inset-x-0 bottom-0 z-50"
      style={{ paddingBottom: "var(--safe-b)" }}
    >
      <div
        className="mx-auto flex w-full max-w-[480px] items-stretch"
        style={{ height: "var(--tabbar-h)" }}
      >
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === activeHref;
          return (
            <Link
              key={href}
              href={href}
              prefetch={LINK_PREFETCH}
              onClick={tap}
              aria-current={active ? "page" : undefined}
              className="tap flex flex-1 flex-col items-center justify-center gap-1"
              style={{
                color: active ? "var(--color-accent)" : "var(--color-ink-2)",
              }}
            >
              <Icon active={active} />
              <span
                className="chrome-label text-xs"
                style={{ fontWeight: active ? 620 : 550 }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type IconProps = { active: boolean };

const S = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const w = (active: boolean) => (active ? 2.1 : 1.7);

function TodayIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={w(active)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}



function PlanIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={w(active)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5V6m8-2.5V6" />
      <path d="m8.8 14 2.1 2.1 4.3-4.3" />
    </svg>
  );
}

function YouIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={w(active)}>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}
