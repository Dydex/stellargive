import { fromStroops } from "@/lib/soroban";

/** Rendered wherever an on-chain event is missing a field we expected. */
export const MISSING_FIELD = "—";

/**
 * Contract events arrive as a loosely-typed `data` array straight off the RPC
 * response, so a malformed, truncated, or re-shaped payload must never take a
 * page down. Everything below reads defensively and degrades to a placeholder.
 */
export function getEventField(event: unknown, index: number): unknown {
  const data = (event as { data?: unknown })?.data;
  if (!Array.isArray(data)) return undefined;
  return data[index];
}

/** Parses a scalar into a bigint, or null when it is missing/garbage. */
export function parseBigInt(value: unknown): bigint | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object" && typeof (value as any).toString !== "function") return null;
  try {
    return BigInt(value as any);
  } catch {
    return null;
  }
}

/** Campaign id at `data[index]` as a decimal string, or null when unusable. */
export function getCampaignId(event: unknown, index = 0): string | null {
  const parsed = parseBigInt(getEventField(event, index));
  return parsed === null ? null : parsed.toString();
}

/** Stroop amount at `data[index]` as a bigint, defaulting to 0n. */
export function getAmountStroops(event: unknown, index: number): bigint {
  return parseBigInt(getEventField(event, index)) ?? 0n;
}

/** Human amount at `data[index]`, e.g. "12.5 XLM", or "—" when unusable. */
export function formatEventAmount(event: unknown, index: number): string {
  const parsed = parseBigInt(getEventField(event, index));
  if (parsed === null) return MISSING_FIELD;
  try {
    return `${fromStroops(parsed)} XLM`;
  } catch {
    return MISSING_FIELD;
  }
}

/** Shortened tx hash for display, or null when the hash is missing/too short. */
export function formatTxHash(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 12) return null;
  return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
}
