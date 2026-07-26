"use client";

import { useMemo, useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddressLink } from "@/components/AddressLink";
import { useEvents } from "@/hooks/useSoroban";
import {
  MISSING_FIELD,
  formatEventAmount,
  formatTxHash,
  getCampaignId,
  getEventField,
} from "@/lib/eventData";
import { RelativeTime } from "@/components/RelativeTime";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Activity, ArrowUpRight, Loader2, Megaphone, Trophy,
  AlertTriangle, RotateCw,
} from "lucide-react";

const HISTORY_LIMIT = 50;
const ZERO_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

type FilterKey = "all" | "created" | "received" | "claimed";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "created", label: "Created" },
  { key: "received", label: "Donated" },
  { key: "claimed", label: "Claimed" },
];

/** Returns a 56-char G-address or null (filtering the contract's zero placeholder). */
function normalizeAddress(value: unknown): string | null {
  if (!value) return null;
  const str = value.toString();
  if (str === ZERO_ADDRESS) return null;
  return str.length === 56 && str.startsWith("G") ? str : null;
}

/** A ledger sequence is metadata, not payload — still guard it for display. */
function ledgerLabel(ledger: unknown): string {
  return ledger === null || ledger === undefined || ledger === "" ? MISSING_FIELD : String(ledger);
}

export default function ActivityPage() {
  const { data: fetchedEvents, isLoading, isError, refetch } = useEvents(HISTORY_LIMIT);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [events, setEvents] = useState<any[]>([]);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (Array.isArray(fetchedEvents)) {
      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        // Drop non-object entries up front so the render path only ever deals
        // with (possibly incomplete) event objects.
        const newEvents = fetchedEvents.filter(
          (e: any) => e && typeof e === "object" && !existingIds.has(e.id),
        );
        if (newEvents.length > 0) {
          if (prev.length > 0) {
            setShowIndicator(true);
            setTimeout(() => setShowIndicator(false), 4000);
          }
          return [...newEvents, ...prev];
        }
        return prev;
      });
    }
  }, [fetchedEvents]);

  const sorted = useMemo(
    () => events.slice().sort((a: any, b: any) => Number(b.ledger) - Number(a.ledger)),
    [events],
  );

  const visible = useMemo(
    () => (filter === "all" ? sorted : sorted.filter((e: any) => e.topic === filter)),
    [sorted, filter],
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-12 space-y-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
          </div>
          <p className="text-muted-foreground">
            The most recent {HISTORY_LIMIT} on-chain events from the StellarGive contract.
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Event type filters">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
              role="tab"
              aria-selected={filter === f.key}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {isLoading && events.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError && events.length === 0 ? (
          <div
            role="alert"
            className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-16 text-center"
          >
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">Unable to load activity</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                We couldn&apos;t fetch on-chain events right now. Check your connection and try
                again.
              </p>
            </div>
            <Button onClick={() => refetch()}>
              <RotateCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No {filter === "all" ? "" : FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}{" "}
            events found yet.
          </div>
        ) : (
          <ErrorBoundary heading="Activity feed">
            <div className="relative hidden md:block overflow-x-auto">
              <div aria-live="polite" aria-atomic="true" className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
                {showIndicator && (
                  <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
                    New activity
                  </div>
                )}
              </div>
              <Card>
                <table className="w-full text-sm text-left">
                  <caption className="sr-only">Recent Transaction History</caption>
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
                    <tr>
                      <th scope="col" className="px-4 py-3 rounded-tl-md">Status</th>
                      <th scope="col" className="px-4 py-3">Action</th>
                      <th scope="col" className="px-4 py-3">Time</th>
                      <th scope="col" className="px-4 py-3 rounded-tr-md text-right">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visible.map((event: any, idx: number) => (
                      <ActivityRowDesktop key={event?.id ?? `event-${idx}`} event={event} />
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            <div className="relative md:hidden space-y-4">
              <div aria-live="polite" aria-atomic="true" className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
                {showIndicator && (
                  <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-medium shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
                    New activity
                  </div>
                )}
              </div>
              {visible.map((event: any, idx: number) => (
                <ActivityRowMobile key={event?.id ?? `event-${idx}`} event={event} />
              ))}
            </div>
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}

function useActivityData(event: any) {
  const id = getCampaignId(event);
  const ledger = ledgerLabel(event?.ledger);
  const createdAt = event?.createdAt ? new Date(event.createdAt) : null;
  const when =
    createdAt && !Number.isNaN(createdAt.getTime()) ? (
      <RelativeTime date={createdAt} fallback={`Ledger ${ledger}`} />
    ) : (
      `Ledger ${ledger}`
    );

  let icon = <Megaphone className="w-4 h-4 text-blue-500" />;
  let iconBg = "bg-blue-500/10";
  let label = event?.topic ?? MISSING_FIELD;
  let body: React.ReactNode = null;

  if (event?.topic === "received") {
    const donor = normalizeAddress(getEventField(event, 1));
    icon = <ArrowUpRight className="w-4 h-4 text-green-500" />;
    iconBg = "bg-green-500/10";
    label = "Donated";
    body = (
      <>
        <span className="font-bold">{formatEventAmount(event, 2)}</span> donated
        {donor ? (
          <>
            {" "}
            by <AddressLink address={donor} className="text-muted-foreground" />
          </>
        ) : (
          <>
            {" "}
            by <span className="text-muted-foreground">Anonymous</span>
          </>
        )}
        {id && <> to Campaign #{id}</>}
      </>
    );
  } else if (event?.topic === "created") {
    label = "Created";
    body = (
      <>
        New campaign{id && <> #{id}</>} created with a target of{" "}
        <span className="font-bold">{formatEventAmount(event, 3)}</span>
      </>
    );
  } else if (event?.topic === "claimed") {
    const beneficiary = normalizeAddress(getEventField(event, 1));
    icon = <Trophy className="w-4 h-4 text-purple-500" />;
    iconBg = "bg-purple-500/10";
    label = "Claimed";
    body = (
      <>
        <span className="font-bold">{formatEventAmount(event, 3)}</span> claimed
        {beneficiary ? (
          <>
            {" "}
            by <AddressLink address={beneficiary} className="text-muted-foreground" />
          </>
        ) : (
          <> by beneficiary</>
        )}
        {id && <> from Campaign #{id}</>}
      </>
    );
  } else {
    body = <span className="text-muted-foreground">{label}</span>;
  }

  return {
    id,
    when,
    ledger,
    icon,
    iconBg,
    label,
    body,
    txHash: event?.txHash,
    txLabel: formatTxHash(event?.txHash),
  };
}

function ActivityRowDesktop({ event }: { event: any }) {
  const { icon, iconBg, label, body, when, ledger, txHash, txLabel } = useActivityData(event);

  return (
    <tr className="hover:bg-muted/10 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full shrink-0 ${iconBg}`}>{icon}</div>
          <span className="uppercase text-[10px] font-bold tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">{body}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {when} <span className="hidden lg:inline-block"> • Ledger {ledger}</span>
      </td>
      <td className="px-4 py-3 text-right">
        {txLabel ? (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs text-primary hover:underline"
          >
            {txLabel}
          </a>
        ) : (
          <span className="text-muted-foreground text-xs">N/A</span>
        )}
      </td>
    </tr>
  );
}

function ActivityRowMobile({ event }: { event: any }) {
  const { icon, iconBg, label, body, when, txHash, txLabel } = useActivityData(event);

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full shrink-0 ${iconBg}`}>{icon}</div>
          <h2 className="uppercase text-[10px] font-bold tracking-wider text-muted-foreground m-0">
            {label}
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">{when}</span>
      </div>
      <p className="text-sm">{body}</p>

      <div className="pt-3 border-t flex justify-between items-center text-xs">
        <span className="text-muted-foreground">Tx Hash</span>
        {txLabel ? (
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-primary hover:underline"
          >
            {txLabel}
          </a>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )}
      </div>
    </div>
  );
}
