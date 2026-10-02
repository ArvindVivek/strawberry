"use client";

import { CircleCheck, Sparkles, X } from "lucide-react";
import { Chip, Icon } from "@/components/kl";
import { cn } from "@/lib/kl/cn";
import { agoLabel, filterItems, type Filter, type ListItem } from "@/lib/inbox";
import { CategoryTag, PriorityBadge } from "./labels";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "replied", label: "Replied" },
];

export function TicketList({
  items,
  filter,
  onFilter,
  selectedId,
  onSelect,
  showIntro,
  onDismissIntro,
  onReset,
}: {
  items: ListItem[];
  filter: Filter;
  onFilter: (f: Filter) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  showIntro: boolean;
  onDismissIntro: () => void;
  onReset: () => void;
}) {
  const shown = filterItems(items, filter);
  const count = (f: Filter) => filterItems(items, f).length;

  return (
    <section aria-label="Inbox" className="flex min-h-0 flex-1 flex-col">
      {showIntro && (
        <div className="mb-2 flex shrink-0 items-start gap-2 rounded-md bg-accent-soft py-2.5 pl-3 pr-1 text-sm text-ink">
          <Icon icon={Sparkles} size={18} className="mt-0.5 shrink-0 text-accent-text" />
          <p className="min-w-0 flex-1">
            Strawberry sorts each email by topic and urgency (<b>triage</b>), finds the policy rules that apply and
            drafts a reply you can edit.
          </p>
          <button
            type="button"
            onClick={onDismissIntro}
            aria-label="Hide this note"
            className="-my-1 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink-2 hover:bg-surface/60"
          >
            <Icon icon={X} size={18} />
          </button>
        </div>
      )}

      <div role="group" aria-label="Show" className="flex shrink-0 flex-wrap gap-2 pb-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} selected={filter === f.key} onClick={() => onFilter(f.key)}>
            {f.label} <span className="tabular font-extrabold opacity-80">{count(f.key)}</span>
          </Chip>
        ))}
      </div>

      <ul className="pane-scroll -mx-1 flex min-h-0 flex-1 flex-col gap-1.5 px-1 pb-2">
        {shown.map(({ ticket, state, age }) => {
          const selected = ticket.id === selectedId;
          return (
            <li key={ticket.id}>
              <button
                type="button"
                onClick={() => onSelect(ticket.id)}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "flex w-full cursor-pointer flex-col gap-1 rounded-md px-3 py-2.5 text-left transition-colors duration-75",
                  selected ? "bg-surface ring-2 ring-accent-text" : "bg-surface/70 ring-1 ring-line hover:bg-surface",
                )}
              >
                <span className="flex w-full items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-ink">{ticket.customerName}</span>
                  <span className="shrink-0 text-xs font-bold text-ink-2" suppressHydrationWarning>
                    {agoLabel(age)}
                  </span>
                </span>
                <span className="line-clamp-2 text-sm leading-snug text-ink">{ticket.subject}</span>
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  {state.triage ? (
                    <>
                      <PriorityBadge priority={state.triage.priority} />
                      <CategoryTag category={state.triage.category} />
                    </>
                  ) : (
                    <span className="inline-flex h-6 items-center rounded-full bg-accent-soft px-2.5 text-xs font-extrabold text-accent-text">
                      Needs triage
                    </span>
                  )}
                  {state.sent && (
                    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-success-soft px-2.5 text-xs font-extrabold text-success-text">
                      <Icon icon={CircleCheck} size={14} />
                      Replied
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="rounded-md px-3 py-6 text-center text-sm text-ink-2">
            {filter === "replied" ? "No replies sent yet." : "Every ticket has a reply. Nice work."}
          </li>
        )}
        <li className="pt-1 text-center">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 cursor-pointer items-center rounded-md px-3 text-sm font-bold text-ink-2 underline-offset-4 hover:text-ink hover:underline"
          >
            Reset the sample inbox
          </button>
        </li>
      </ul>
    </section>
  );
}
