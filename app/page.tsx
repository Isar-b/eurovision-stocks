import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/markets");

  return (
    <div className="evs-hero-gradient min-h-[calc(100vh-200px)]">
      <div className="max-w-3xl mx-auto px-5 py-16 text-center">
        <div className="inline-block evs-section-label text-evs-magenta border border-evs-magenta/40 rounded-sm px-3 py-1 mb-6">
          Vienna · 16 May 2026
        </div>
        <h1 className="font-display font-extrabold text-5xl sm:text-6xl mb-4 evs-display-gradient">
          Trade Eurovision
          <br />
          like stocks.
        </h1>
        <p className="text-evs-muted text-lg max-w-md mx-auto mb-10">
          £1,000 fictional budget. Real Polymarket prices. One winner. Prove
          your predictions are better than your friends&apos;.
        </p>
        <Link href="/login" className="evs-btn-primary text-base px-7 py-3.5">
          Sign in to start
        </Link>
        <div className="mt-12 grid grid-cols-3 gap-3 text-left max-w-md mx-auto">
          <Feature title="Live prices" body="Polymarket odds update every 60 seconds." />
          <Feature title="No real money" body="Bragging rights only. Hobby project." />
          <Feature title="Leaderboard" body="Beat your friends to the top." />
        </div>
      </div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="evs-card p-3">
      <div className="evs-section-label text-evs-cyan mb-1">{title}</div>
      <div className="text-xs text-evs-muted leading-snug">{body}</div>
    </div>
  );
}
