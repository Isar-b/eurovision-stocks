import { describe, it, expect } from "vitest";
import { probabilityToPrice, pctChange, roundCurrency } from "../lib/pricing";

describe("probabilityToPrice", () => {
  it("converts probabilities to two-decimal £ prices", () => {
    expect(probabilityToPrice(0.44)).toBe(44);
    expect(probabilityToPrice(0.4835)).toBe(48.35);
    expect(probabilityToPrice(0.001)).toBe(0.1);
    expect(probabilityToPrice(1)).toBe(100);
  });

  it("clamps invalid input to zero", () => {
    expect(probabilityToPrice(-0.5)).toBe(0);
    expect(probabilityToPrice(NaN)).toBe(0);
  });
});

describe("pctChange", () => {
  it("returns percent change vs baseline", () => {
    expect(pctChange(110, 100)).toBe(10);
    expect(pctChange(80, 100)).toBe(-20);
    expect(pctChange(100, 0)).toBe(0);
  });
});

describe("roundCurrency", () => {
  it("rounds to two decimals", () => {
    expect(roundCurrency(1.234)).toBe(1.23);
    expect(roundCurrency(1.236)).toBe(1.24);
    expect(roundCurrency(1.999)).toBe(2);
  });
});
