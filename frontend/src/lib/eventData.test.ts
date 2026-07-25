import { describe, it, expect, vi } from "vitest";

// soroban.ts does `new rpc.Server(...)` at module scope; stub it so importing
// fromStroops (used by eventData) is safe under jsdom.
vi.mock("@stellar/stellar-sdk", async (importActual) => {
  const actual = await importActual<typeof import("@stellar/stellar-sdk")>();
  return {
    ...actual,
    rpc: {
      ...actual.rpc,
      Server: vi.fn(function () {
        return {};
      }),
    },
  };
});

import {
  MISSING_FIELD,
  formatEventAmount,
  formatTxHash,
  getAmountStroops,
  getCampaignId,
  getEventField,
  parseBigInt,
} from "@/lib/eventData";

describe("getEventField", () => {
  it("reads a value from a well-formed event", () => {
    expect(getEventField({ data: ["1", "GABC", "500"] }, 2)).toBe("500");
  });

  it("returns undefined for undersized, missing, or non-array data", () => {
    expect(getEventField({ data: ["1"] }, 3)).toBeUndefined();
    expect(getEventField({}, 0)).toBeUndefined();
    expect(getEventField({ data: "not-an-array" }, 0)).toBeUndefined();
    expect(getEventField(null, 0)).toBeUndefined();
    expect(getEventField(undefined, 1)).toBeUndefined();
  });
});

describe("parseBigInt", () => {
  it("parses bigints, numbers, and numeric strings", () => {
    expect(parseBigInt(42n)).toBe(42n);
    expect(parseBigInt(42)).toBe(42n);
    expect(parseBigInt("42")).toBe(42n);
  });

  it("returns null for missing or garbage values", () => {
    expect(parseBigInt(undefined)).toBeNull();
    expect(parseBigInt(null)).toBeNull();
    expect(parseBigInt("")).toBeNull();
    expect(parseBigInt("not-a-number")).toBeNull();
    expect(parseBigInt(1.5)).toBeNull();
    expect(parseBigInt({})).toBeNull();
    expect(parseBigInt([1, 2])).toBeNull();
  });
});

describe("getCampaignId", () => {
  it("returns the id as a decimal string", () => {
    expect(getCampaignId({ data: [7n] })).toBe("7");
  });

  it("returns null for undersized or garbage payloads", () => {
    expect(getCampaignId({ data: [] })).toBeNull();
    expect(getCampaignId({ data: ["oops"] })).toBeNull();
    expect(getCampaignId({})).toBeNull();
    expect(getCampaignId(null)).toBeNull();
  });
});

describe("getAmountStroops", () => {
  it("returns the parsed amount", () => {
    expect(getAmountStroops({ data: ["1", "GABC", "15000000"] }, 2)).toBe(15000000n);
  });

  it("falls back to 0n so aggregations never throw", () => {
    expect(getAmountStroops({ data: ["1"] }, 2)).toBe(0n);
    expect(getAmountStroops({ data: ["1", "GABC", "junk"] }, 2)).toBe(0n);
    expect(getAmountStroops(undefined, 2)).toBe(0n);
  });
});

describe("formatEventAmount", () => {
  it("formats a valid stroop amount", () => {
    expect(formatEventAmount({ data: ["1", "GABC", 15000000] }, 2)).toBe("1.5 XLM");
  });

  it("returns the placeholder when the field is missing or malformed", () => {
    expect(formatEventAmount({ data: ["1"] }, 2)).toBe(MISSING_FIELD);
    expect(formatEventAmount({ data: ["1", "GABC", "junk"] }, 2)).toBe(MISSING_FIELD);
    expect(formatEventAmount({}, 3)).toBe(MISSING_FIELD);
    expect(formatEventAmount(null, 2)).toBe(MISSING_FIELD);
  });
});

describe("formatTxHash", () => {
  it("shortens a full hash", () => {
    const hash = "a".repeat(60) + "bcde";
    expect(formatTxHash(hash)).toBe("aaaaaaaa...bcde");
  });

  it("returns null for missing or too-short hashes", () => {
    expect(formatTxHash(undefined)).toBeNull();
    expect(formatTxHash(null)).toBeNull();
    expect(formatTxHash(123)).toBeNull();
    expect(formatTxHash("abc")).toBeNull();
  });
});
