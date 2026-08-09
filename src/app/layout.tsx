import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Noto_Sans_Hebrew } from "next/font/google";
import TabBar from "@/components/TabBar";
import { asset } from "@/lib/base-path";
import "./globals.css";

const notoHebrew = Noto_Sans_Hebrew({
  subsets: ["hebrew"],
  weight: ["400", "500", "700"],
  variable: "--font-hebrew",
  display: "swap",
});

// Named "ktav" (Hebrew handwriting), not "cursive": next/font derives the
// @font-face family from this variable, and `cursive` collides with the CSS
// generic keyword.
const ktav = localFont({
  src: "../../public/fonts/gveret-levin.ttf",
  variable: "--font-ktav",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Teach me Daddy",
  description: "Hebrew, one letter at a time.",
  applicationName: "Teach me Daddy",
  appleWebApp: {
    capable: true,
    title: "Teach me Daddy",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: asset("/icon.svg"),
    apple: asset("/icon.svg"),
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${notoHebrew.variable} ${ktav.variable}`}>
      <body className="antialiased">
        <div className="ambient" aria-hidden>
          <span />
          <span />
          <span />
        </div>

        <main
          className="stage mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5"
          style={{
            paddingTop: "calc(var(--safe-t) + 18px)",
            paddingBottom:
              "calc(var(--safe-b) + var(--tabbar-h) + 34px)",
          }}
        >
          {children}
        </main>

        <TabBar />
      </body>
    </html>
  );
}
