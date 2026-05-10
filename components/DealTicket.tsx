"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Country, Holding } from "@/lib/types";

type Mode = "units" | "value";

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
  const [mode, setMode] = useState<Mode>(side === "buy" ? "value" : "units");
  // Keep the raw input string so partial typing like "1." or "" is preserved.
  const [raw, setRaw] = useState<string>(
    side === "buy"
      ? "" // start empty so the user just types
      : (holding?.units ?? 1).toString(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse the input and derive units + value depending on mode.
  const parsed = parseFloat(raw);
  const validNumber = Number.isFinite(parsed) && parsed > 0;
  const units = useMemo(() => {
    if (!validNumber) return 0;
    if (mode === "units") return roundTo(parsed, 2);
    if (currentPrice <= 0) return 0;
    return roundTo(parsed / currentPrice, 2);
  }, [parsed, mode, currentPrice, validNumber]);
  const value = useMemo(
    () => roundTo(units * currentPrice, 2),
    [units, currentPrice],
  );

  const tooMuchCash = side === "buy" && value > cash + 1e-9;
  const tooManyUnits =
    side === "sell" && (!holding || units > holding.units + 1e-9);
  const invalidQty = !validNumber || units <= 0;
  const disabled = submitting || tooMuchCash || tooManyUnits || invalidQty;

  function adjust(deltaUnits: number) {
    const nextUnits = Math.max(0.01, roundTo(units + deltaUnits, 2));
    if (mode === "units") {
      setRaw(nextUnits.toString());
    } else {
      setRaw(roundTo(nextUnits * currentPrice, 2).toString());
    }
  }

  function setMaxBuy() {
    const maxValue = Math.floor(cash * 100) / 100;
    if (mode === "units") {
      setRaw(roundTo(maxValue / currentPrice, 2).toString());
    } else {
      setRaw(maxValue.toString());
    }
  }

  function setMaxSell() {
    if (!holding) return;
    if (mode === "units") {
      setRaw(holding.units.toString());
    } else {
      setRaw(roundTo(holding.units * currentPrice, 2).toString());
    }
  }

  function changeMode(next: Mode) {
    if (next === mode) return;
    // Convert the current input to the new mode so the displayed amount stays equivalent.
    if (next === "value") {
      setRaw(value > 0 ? value.toString() : "");
    } else {
      setRaw(units > 0 ? units.toString() : "");
    }
    setMode(next);
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

  const cashAfter = side === "buy" ? cash - value : cash + value;
  const inputPrefix = mode === "value" ? "£" : "";
  const inputSuffix = mode === "units" ? "units" : "";
  const placeholder = mode === "value" ? "0.00" : "0";

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

      {/* Mode toggle */}
      <div className="evs-card p-1 flex" role="tablist" aria-label="Order mode">
        <ModePill
          label={`Value (£)`}
          active={mode === "value"}
          onClick={() => changeMode("value")}
        />
        <ModePill
          label="Units"
          active={mode === "units"}
          onClick={() => changeMode("units")}
        />
      </div>

      {/* Amount input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="evs-section-label">
            {mode === "value"
              ? `${side === "buy" ? "Amount to spend" : "Amount to sell"}`
              : `Units to ${side === "buy" ? "buy" : "sell"}`}
          </div>
          <button
            type="button"
            onClick={side === "buy" ? setMaxBuy : setMaxSell}
            className="text-[11px] uppercase tracking-[1px] font-display font-bold text-evs-cyan hover:text-evs-soft"
          >
            Max
          </button>
        </div>
        <div className="evs-card flex items-center justify-between gap-2 p-3">
          <div className="flex items-baseline gap-1 flex-1 min-w-0">
            {inputPrefix && (
              <span className="evs-price text-xl text-evs-muted">{inputPrefix}</span>
            )}
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              value={raw}
              onChange={(e) => {
                // Allow only digits and a single dot.
                const cleaned = e.target.value.replace(/[^0-9.]/g, "");
                const dots = cleaned.split(".").length - 1;
                if (dots > 1) return;
                setRaw(cleaned);
              }}
              placeholder={placeholder}
              autoFocus
              className="bg-transparent text-xl evs-price outline-none flex-1 min-w-0 w-full"
              aria-label={mode === "value" ? "Amount in pounds" : "Number of units"}
            />
            {inputSuffix && (
              <span className="evs-price text-xs text-evs-muted">{inputSuffix}</span>
            )}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={() => adjust(-0.5)}
              className="w-9 h-9 rounded-md bg-white/8 text-evs-soft text-lg font-bold"
              type="button"
              aria-label="Decrease by 0.5 units"
            >
              −
            </button>
            <button
              onClick={() => adjust(0.5)}
              className="w-9 h-9 rounded-md bg-evs-magenta/40 text-white text-lg font-bold"
              type="button"
              aria-label="Increase by 0.5 units"
            >
              +
            </button>
          </div>
        </div>
        {/* Live conversion */}
        {validNumber && (
          <div className="mt-1.5 text-xs text-evs-muted evs-tabular">
            {mode === "value"
              ? `≈ ${units.toFixed(2)} units at £${currentPrice.toFixed(2)} each`
              : `≈ £${value.toFixed(2)} at £${currentPrice.toFixed(2)} per unit`}
          </div>
        )}
      </div>

      <div className="evs-card divide-y divide-white/5">
        <Row label="Units" value={units.toFixed(2)} />
        <Row label="Price per unit" value={`£${currentPrice.toFixed(2)}`} />
        <Row label="Total" value={`£${value.toFixed(2)}`} bold />
        <Row
          label="Cash after"
          value={`£${cashAfter.toFixed(2)}`}
          color={side === "buy" && tooMuchCash ? "danger" : "success"}
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
          : `Confirm ${side === "buy" ? "purchase" : "sale"} — £${value.toFixed(2)}`}
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

function ModePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 py-2 px-3 rounded-md text-xs font-display font-bold uppercase tracking-[1.5px] transition-colors ${
        active
          ? "bg-evs-magenta text-white"
          : "text-evs-muted hover:text-evs-soft"
      }`}
    >
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="evs-card px-3 py-2.5">
      <div className="evs-section-label">{label}</div>
      <div className="evs-price text-lg text-evs-soft">{value}</div>
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

function roundTo(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
