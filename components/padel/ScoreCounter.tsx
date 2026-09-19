"use client";

import { motion, AnimatePresence } from "motion/react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScoreCounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function ScoreCounter({ label, value, onChange, disabled }: ScoreCounterProps) {
  return (
    <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2 rounded-md border border-border bg-surface-muted p-2">
      <Button type="button" variant="secondary" size="icon" disabled={disabled || value <= 0} aria-label={`Restar ${label}`} onClick={() => onChange(Math.max(0, value - 1))}>
        <Minus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-normal text-text-secondary">{label}</div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={value}
            initial={{ opacity: 0, y: value === 0 ? 0 : -8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.16 }}
            className="font-mono text-4xl font-bold tabular-nums text-text-primary"
          >
            {value}
          </motion.div>
        </AnimatePresence>
      </div>
      <Button type="button" variant="secondary" size="icon" disabled={disabled} aria-label={`Sumar ${label}`} onClick={() => onChange(value + 1)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
