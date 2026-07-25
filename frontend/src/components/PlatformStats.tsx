"use client";

import { usePlatformStats } from "@/hooks/useSoroban";
import { fromStroops } from "@/lib/soroban";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, Flame, RotateCw, TrendingUp, Users } from "lucide-react";

// Every state renders inside a row of this height so the hero never shifts
// when stats move from loading to data, error, or the zero-state.
const ROW = "flex flex-wrap items-center justify-center gap-8 pt-6 min-h-[3.5rem]";

export function PlatformStats() {
  const { data: stats, isLoading, isError, refetch, isFetching } = usePlatformStats();

  if (isLoading) {
    return (
      <div className={ROW} aria-busy="true" aria-live="polite">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className={ROW} role="status">
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
            Couldn&apos;t load platform stats.
          </span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RotateCw
              className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            {isFetching ? "Retrying..." : "Retry"}
          </Button>
        </div>
      </div>
    );
  }

  const totalCampaigns = Number(stats.totalCampaigns ?? 0);

  if (totalCampaigns === 0) {
    return (
      <div className={ROW} role="status">
        <p className="text-sm text-muted-foreground">
          No campaigns yet — be the first to start one.
        </p>
      </div>
    );
  }

  const totalRaised = fromStroops(BigInt(stats.totalRaised));

  return (
    <div className={`${ROW} text-sm`} role="status">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" aria-hidden="true" />
        <span className="font-semibold">{totalCampaigns}</span>
        <span className="text-muted-foreground">Total Campaigns</span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" aria-hidden="true" />
        <span className="font-semibold">{Number(totalRaised).toLocaleString()} XLM</span>
        <span className="text-muted-foreground">Total Raised</span>
      </div>
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-primary" aria-hidden="true" />
        <span className="font-semibold">{stats.activeCampaigns ?? 0}</span>
        <span className="text-muted-foreground">Active Campaigns</span>
      </div>
    </div>
  );
}
