"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tap } from "@/lib/feedback";
import { LINK_PREFETCH } from "@/lib/base-path";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/alphabet", label: "Letters", icon: LettersIcon },
  { href: "/study", label: "Study", icon: StudyIcon },
  { href: "/plan", label: "Plan", icon: PlanIcon },
  { href: "/me", label: "Me", icon: MeIcon },
] as const;

/** Routes that belong under a tab but aren't the tab's own href. */
const OWNED: Record<string, string[]> = {
  "/alphabet": ["/practice", "/progress"],
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
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4"
      style={{ paddingBottom: "calc(var(--safe-b) + 10px)" }}
    >
      <div
        className="glass glass-strong flex w-full max-w-[440px] items-stretch gap-0.5 rounded-[26px] p-1.5"
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
              className="press relative flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px]"
              style={{
                background: active ? "rgba(255,255,255,0.10)" : "transparent",
                boxShadow: active
                  ? "0 1px 0 0 rgba(255,255,255,0.16) inset"
                  : "none",
                color: active ? "var(--color-ink)" : "var(--color-ink-faint)",
              }}
            >
              <Icon active={active} />
              <span className="text-[9.5px] font-medium tracking-tight">
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
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const w = (active: boolean) => (active ? 2.2 : 1.8);

function HomeIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={w(active)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  );
}

function LettersIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={w(active)}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2.2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2" />
    </svg>
  );
}

function StudyIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={w(active)}>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.6 1.6 0 0 0-1.6-1.6H4Z" />
      <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.6 1.6 0 0 1 1.6-1.6H20Z" />
    </svg>
  );
}

function PlanIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={w(active)}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3.5V6m8-2.5V6" />
      <path d="m8.5 14 2.2 2.2 4.3-4.3" />
    </svg>
  );
}

function MeIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={w(active)}>
      <circle cx="12" cy="8.2" r="3.7" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  );
}
