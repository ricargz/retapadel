import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "success" | "error" | "ball" | "primary";
}

const tones = {
  neutral: "bg-surface-muted text-text-secondary",
  success: "bg-success/15 text-success",
  error: "bg-error/15 text-error",
  ball: "bg-ball/25 text-text-primary",
  primary: "bg-primary/12 text-primary",
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn("inline-flex items-center rounded px-2 py-1 text-xs font-semibold", tones[tone], className)} {...props} />;
}
