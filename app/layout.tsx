import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { TabBar } from "@/components/TabBar";
import { getCurrentUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { WinnerBanner } from "@/components/WinnerBanner";

export const metadata: Metadata = {
  title: "Eurovision Stocks",
  description:
    "Paper-trade Eurovision 2026 countries like stocks. £1,000 fictional budget, prices from Polymarket.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const contest = await store.getContestState();
  const winnerCountry = contest.winner
    ? await store.getCountry(contest.winner)
    : null;

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {contest.closed && winnerCountry && (
          <WinnerBanner winner={winnerCountry} />
        )}
        <Header user={user} contestClosed={contest.closed} />
        <main className="flex-1 pb-20">{children}</main>
        {user && <TabBar />}
      </body>
    </html>
  );
}
