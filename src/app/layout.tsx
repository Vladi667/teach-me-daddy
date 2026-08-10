import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Noto_Sans_Hebrew } from "next/font/google";
import TabBar from "@/components/TabBar";
import AccountGate from "@/components/AccountGate";
import { asset, SITE_ORIGIN, SITE_URL } from "@/lib/base-path";
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

const TITLE = "Teach me Daddy";
const DESCRIPTION = "Hebrew, one letter at a time.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: TITLE,
  alternates: { canonical: SITE_URL },
  appleWebApp: {
    capable: true,
    title: TITLE,
    statusBarStyle: "black-translucent",
  },
  // Next emits only the modern `mobile-web-app-capable`; iOS before 17 reads
  // the prefixed one, and it's what makes "Add to Home Screen" open without
  // Safari chrome.
  other: { "apple-mobile-web-app-capable": "yes" },
  // iOS ignores SVG for apple-touch-icon, and Android's installer wants
  // raster sizes — hence the PNGs rather than the single vector.
  icons: {
    icon: [
      { url: asset("/favicon-64.png"), sizes: "64x64", type: "image/png" },
      { url: asset("/icon-192.png"), sizes: "192x192", type: "image/png" },
    ],
    apple: [
      {
        url: asset("/apple-touch-icon.png"),
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en",
    images: [
      {
        url: asset("/og.png"),
        width: 1200,
        height: 630,
        alt: "Teach me Daddy — Hebrew, one letter at a time.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [asset("/og.png")],
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
        {/* Nothing below here renders until an account is active. */}
        <AccountGate>
          <main
            className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col"
            style={{
              paddingInline: "var(--gutter)",
              paddingTop: "calc(var(--safe-t) + 20px)",
              paddingBottom: "calc(var(--safe-b) + var(--tabbar-h) + 32px)",
            }}
          >
            {children}
          </main>

          <TabBar />
        </AccountGate>
      </body>
    </html>
  );
}
