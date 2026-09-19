import { cn } from "@/lib/utils";

export function PadelBall({ className, spin = false }: { className?: string; spin?: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-7 w-7 shrink-0 rounded-full bg-ball shadow-[inset_-4px_-5px_0_rgb(0_0_0_/_0.12)]",
        spin && "animate-[padel-bounce_1.2s_ease-in-out_infinite]",
        className,
      )}
      aria-hidden="true"
    >
      <span className="absolute left-1/2 top-0 h-full w-px -rotate-[24deg] bg-text-primary/20" />
      <span className="absolute left-1/2 top-0 h-full w-px rotate-[24deg] bg-text-primary/16" />
    </span>
  );
}
