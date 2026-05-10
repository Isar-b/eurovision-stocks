"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Country, Holding } from "@/lib/types";

export function DealTicket({
  country,
  side,
  currentPrice,
  cash,
  holding,
}: {
  country: Country;
  side: "buy" | "sell";
  currentPrice: number;
  cash: number;
  holding: Holding | null;
}) {
  const router = useRouter();
  const [units, setUnits] = useState(side === "buy" ? 1 : Math.min(holding?.units ?? 1, 1));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () => Math.round(units * currentPrice * 100) / 100,
    [units, currentPrice],
  );

  const tooMuchCash = side === "buy" && total > cash;
  const tooManyUnits =
    side === "sell" && (!holding || units > holding.units + 1e-9);
  const invalidQty = !Number.isFinite(units) || units <= 0;
  const disabled = submitting || tooMuchCash || tooManyUnits || invalidQty;

  function adjust(delta: number) {
    setUnits((u) => Math.max(0.5, Math.round((u + delta) * 100) / 100));
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: country.code, side, units }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Trade failed");
        return;
      }
      router.push(`/country/${country.code}?traded=${side}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Trade failed");
    } finally {
      setSubmitting(false);
    }
  }

  const remaining =
    side === "buy" ? cash - total : cash + total;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Current price" value={`£${currentPrice.toFixed(2)}`} />
        <Stat
          label={side === "buy" ? "Cash available" : "Units held"}
          value={
            side === "buy"
              ? `£${cash.toFixed(2)}`
              : holding
                ? `${holding.units}`
                : "0"
          }
        />
      </div>

      <div>
        <div className="evs-section-label mb-1.5">
          Units to {side === "buy" ? "buy" : "sell"}
        </div>
        <div className="evs-card flex items-center justify-between p-3">
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={units}
            onChange={(e) => setUnits(parseFloat(e.target.value) || 0)}
            className="bg-transparent text-xl font-display font-extrabold outline-none w-32 evs-tabular"
          />
          <div className="flex gap-2">
            <button
              onClick={() => adjust(-0.5)}
              className="w-9 h-9 rounded-md bg-white/8 text-evs-soft text-lg font-bold"
              type="button"
            >
              −
            </button>
            <button
              onClick={() => adjust(0.5)}
              className="w-9 h-9 rounded-md bg-evs-magenta/40 text-white text-lg font-bold"
              type="button"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="evs-card divide-y divide-white/5">
        <Row label="Units" value={units.toFixed(2)} />
        <Row label="Price per unit" value={`£${currentPrice.toFixed(2)}`} />
        <Row label="Total" value={`£${total.toFixed(2)}`} bold />
        <Row
          label={side === "buy" ? "Cash after" : "Cash after"}
          value={`£${remaining.toFixed(2)}`}
          color={
            side === "buy" && tooMuchCash ? "danger" : "success"
          }
        />
      </div>

      {error && (
        <div className="text-evs-danger text-sm bg-evs-danger/10 border border-evs-danger/30 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {tooMuchCash && !error && (
        <div className="text-evs-danger text-sm">
          Not enough cash for this purchase.
        </div>
      )}
      {tooManyUnits && !error && (
        <div className="text-evs-danger text-sm">
          You only hold {holding?.units ?? 0} units of {country.name}.
        </div>
      )}

      <button
        onClick={submit}
        disabled={disabled}
        className={`w-full ${side === "buy" ? "evs-btn-primary" : "evs-btn-sell"}`}
      >
        {submitting
          ? "Submitting…"
          : `Confirm ${side === "buy" ? "purchase" : "sale"} — £${total.toFixed(2)}`}
      </button>
      <button
        onClick={() => router.back()}
        className="w-full evs-btn-ghost"
        type="button"
      >
        Cancel
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="evs-card px-3 py-2.5">
      <div className="evs-section-label">{label}</div>
      <div className="font-display font-extrabold text-lg evs-tabular text-evs-soft">
        {value}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: "success" | "danger";
}) {
  const valColor =
    color === "success"
      ? "text-evs-success"
      : color === "danger"
        ? "text-evs-danger"
        : "text-evs-soft";
  return (
    <div className="flex justify-between px-3 py-2 text-sm">
      <span className="text-evs-muted">{label}</span>
      <span className={`evs-tabular ${valColor} ${bold ? "font-bold" : ""}`}>
        {value}
      </span>
    </div>
  );
}
