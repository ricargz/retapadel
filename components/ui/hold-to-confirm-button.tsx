"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import type { ButtonProps } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HoldToConfirmButtonProps extends Omit<ButtonProps, "onClick"> {
  onConfirm: () => void | Promise<void>;
  holdMs?: number;
  idleText: string;
  holdingText?: string;
  completeText?: string;
}

export function HoldToConfirmButton({
  onConfirm,
  holdMs = 1200,
  idleText,
  holdingText = "Sigue presionando",
  completeText = "Listo",
  className,
  variant = "destructive",
  disabled,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onKeyDown,
  onKeyUp,
  ...props
}: HoldToConfirmButtonProps) {
  const [state, setState] = React.useState<"idle" | "holding" | "complete">("idle");
  const timeoutRef = React.useRef<number | null>(null);
  const intervalRef = React.useRef<number | null>(null);
  const startRef = React.useRef(0);
  const progress = useMotionValue(0);
  const width = useTransform(progress, (value) => `${Math.round(value * 100)}%`);
  const isDisabled = disabled || state === "complete";

  const clearTimers = React.useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const reset = React.useCallback(() => {
    clearTimers();
    progress.set(0);
    setState("idle");
  }, [clearTimers, progress]);

  const finish = React.useCallback(async () => {
    clearTimers();
    progress.set(1);
    setState("complete");
    vibrate([18, 35, 28]);
    await onConfirm();
  }, [clearTimers, onConfirm, progress]);

  const begin = React.useCallback(() => {
    if (isDisabled || timeoutRef.current) return;

    startRef.current = performance.now();
    progress.set(0);
    setState("holding");
    vibrate(12);

    intervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startRef.current;
      progress.set(Math.min(elapsed / holdMs, 1));
    }, 16);
    timeoutRef.current = window.setTimeout(() => void finish(), holdMs);
  }, [finish, holdMs, isDisabled, progress]);

  const cancel = React.useCallback(() => {
    if (state !== "holding") return;
    reset();
  }, [reset, state]);

  React.useEffect(() => reset, [reset]);

  return (
    <Button
      type="button"
      variant={variant}
      disabled={isDisabled}
      className={cn("relative overflow-hidden select-none touch-none", className)}
      aria-label={`${idleText}. Mantén presionado para confirmar.`}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) begin();
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        cancel();
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        cancel();
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        cancel();
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && (event.key === " " || event.key === "Enter")) {
          event.preventDefault();
          begin();
        }
      }}
      onKeyUp={(event) => {
        onKeyUp?.(event);
        if (event.key === " " || event.key === "Enter") cancel();
      }}
      {...props}
    >
      <motion.span className="absolute inset-y-0 left-0 bg-white/22" style={{ width }} aria-hidden="true" />
      <span className="relative z-10">{state === "complete" ? completeText : state === "holding" ? holdingText : idleText}</span>
    </Button>
  );
}

function vibrate(pattern: VibratePattern) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
