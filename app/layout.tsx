import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Ticker } from "@/components/Ticker";
import { REPO_URL, SITE_URL, TAGLINE } from "@/lib/site";
import "./globals.css";

const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], weight: ["500", "700", "800"] });
const sans = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "RizzWord — which AI has the most rizz?", template: "%s · RizzWord" },
  description: `${TAGLINE} Watch them stream their reasoning, fill the grid, and burn tokens side by side.`,
  openGraph: { type: "website", siteName: "RizzWord", url: "/" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0c0b10",
  colorScheme: "dark",
};

const NAV = [
  { href: "/", label: "Today" },
  { href: "/history", label: "History" },
  { href: "/play", label: "Play" },
  { href: "/live", label: "Live" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-lime focus:px-3 focus:py-2 focus:text-ink">
          Skip to content
        </a>
        <div className="relative z-10 flex min-h-dvh flex-col">
          <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
              <Link href="/" className="group flex items-center gap-2.5" aria-label="RizzWord home">
                <span className="sticker relative grid size-8 place-items-center bg-lime font-display text-lg font-extrabold text-ink transition-transform group-hover:-rotate-6">
                  <span className="absolute left-0.5 top-0 text-[8px] font-bold">1</span>R
                </span>
                <span className="font-display text-xl font-extrabold tracking-tight">
                  Rizz<span className="text-lime">Word</span>
                </span>
              </Link>
              <nav aria-label="Main" className="flex items-center gap-1 text-sm">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-panel-2 hover:text-white">
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>
            <Ticker />
          </header>

          <main id="main" className="flex-1">
            {children}
          </main>

          <footer className="border-t border-line">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>
                Built by{" "}
                <a className="text-muted underline decoration-line underline-offset-4 hover:text-white" href="https://github.com/aaronloh16">
                  Aaron Loh
                </a>
                . Models via Vercel AI Gateway. No skibidi toilets were harmed.
              </p>
              <div className="flex gap-4">
                <Link className="hover:text-white" href="/api/history">Results JSON</Link>
                <a className="hover:text-white" href={REPO_URL}>Source</a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
