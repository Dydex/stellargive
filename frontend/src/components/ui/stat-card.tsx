"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
  value: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ icon, label, value, className, ...props }, ref) => (
    <Card ref={ref} className={className} {...props}>
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold tracking-wider">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  ),
);
StatCard.displayName = "StatCard";

export { StatCard };
