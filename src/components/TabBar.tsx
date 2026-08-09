"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { tap } from "@/lib/feedback";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/alphabet", label: "Letters", icon: LettersIcon },
  { href: "/practice", label: "Practice", icon: PracticeIcon },
  { href: "/progress", label: "Progress", icon: ProgressIcon },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-5"
      style={{ paddingBottom: "calc(var(--safe-b) + 10px)" }}
    >
      <div
        className="glass glass-strong flex w-full max-w-[420px] items-stretch gap-1 rounded-[26px] p-1.5"
        style={{ height: "var(--tabbar-h)" }}
      >
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
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
              <span className="text-[10px] font-medium tracking-tight">
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
  width: 19,
  height: 19,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function HomeIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={active ? 2.2 : 1.8}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  );
}

function LettersIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={active ? 2.2 : 1.8}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2.2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2" />
    </svg>
  );
}

function PracticeIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={active ? 2.2 : 1.8}>
      <path d="M12 3.2 14.6 8.6l5.9.85-4.25 4.15 1 5.9L12 16.66 6.75 19.5l1-5.9L3.5 9.45l5.9-.85Z" />
    </svg>
  );
}

function ProgressIcon({ active }: IconProps) {
  return (
    <svg {...S} strokeWidth={active ? 2.2 : 1.8}>
      <path d="M4 20V11" />
      <path d="M10 20V5" />
      <path d="M16 20v-6" />
      <path d="M22 20H2" />
    </svg>
  );
}
