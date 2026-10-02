import { Badge, type BadgeTone } from "@/components/kl";
import type { Category, Priority } from "@/lib/contracts";
import { CATEGORY_LABEL, PRIORITY_LABEL } from "@/lib/triage";

/** Urgent reads as danger, high as a warning; normal and low stay quiet. */
const PRIORITY_TONE: Record<Priority, BadgeTone> = { urgent: "danger", high: "warning", normal: "neutral", low: "neutral" };

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABEL[priority]}</Badge>;
}

export function CategoryTag({ category }: { category: Category }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-surface-2 px-2.5 text-xs font-bold text-ink-2">
      {CATEGORY_LABEL[category]}
    </span>
  );
}

/** Two initials on the accent tint: the customer's avatar, never a photo. */
export function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      aria-hidden="true"
      className={
        size === "sm"
          ? "grid size-9 shrink-0 place-items-center rounded-full bg-accent-soft text-[13px] font-extrabold text-accent-text"
          : "grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-[15px] font-extrabold text-accent-text"
      }
    >
      {letters || "?"}
    </span>
  );
}
