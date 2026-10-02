"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Trash2 } from "lucide-react";
import { Icon } from "@/components/kl";
import { cn } from "@/lib/kl/cn";
import type { Ticket, TicketState, TriageNotice } from "@/lib/contracts";
import { agoLabel } from "@/lib/inbox";
import { CategoryTag, Initials, PriorityBadge } from "./labels";
import { ReplyPanel } from "./ReplyPanel";
import { TriagePanel, type TriageStatus } from "./TriagePanel";

type Tab = "message" | "triage" | "reply";
const TABS: { key: Tab; label: string }[] = [
  { key: "message", label: "Message" },
  { key: "triage", label: "Triage" },
  { key: "reply", label: "Reply" },
];

const CARD = "rounded-lg bg-surface p-4 shadow-[var(--shadow-card)]";

/**
 * One ticket. From 1024px wide: the message and the reply on the left, the triage on the right,
 * all on screen at once. Narrower: a back link, the subject and three tabs, one panel at a time.
 */
export function TicketDetail({
  ticket,
  age,
  now,
  state,
  status,
  notice,
  onBack,
  onTriageAI,
  onTriageRules,
  onEdit,
  onResetDraft,
  onSend,
  onReopen,
  onDelete,
}: {
  ticket: Ticket;
  age: number;
  now: Date;
  state: TicketState;
  status: TriageStatus;
  notice: TriageNotice | null;
  onBack: () => void;
  onTriageAI: () => void;
  onTriageRules: () => void;
  onEdit: (draft: { subject: string; body: string }) => void;
  onResetDraft: () => void;
  onSend: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<Tab>("message");
  const custom = ticket.origin === "custom";

  return (
    <article aria-label={`Ticket from ${ticket.customerName}`} className="flex min-h-0 flex-1 flex-col">
      {/* Narrow screens: back to the list, then the tabs. */}
      <div className="flex shrink-0 flex-col gap-2 pb-2 lg:hidden">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 inline-flex min-h-11 w-fit cursor-pointer items-center gap-1.5 rounded-md px-1 text-[15px] font-bold text-accent-text md:hidden"
        >
          <Icon icon={ArrowLeft} size={18} />
          Inbox
        </button>
        <div role="tablist" aria-label="Ticket sections" className="grid grid-cols-3 gap-1 rounded-md bg-surface-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              onClick={() => setTab(t.key)}
              className={cn(
                "min-h-11 cursor-pointer rounded-sm text-[15px] font-bold transition-colors duration-75",
                tab === t.key ? "bg-surface text-ink shadow-[var(--shadow-card)]" : "text-ink-2 hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-2 lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-3">
        {/* The customer's email */}
        <div
          id="panel-message"
          role="tabpanel"
          aria-labelledby="tab-message"
          className={cn(CARD, "min-h-0 flex-col lg:col-start-1 lg:row-start-1 lg:flex lg:max-h-[min(46vh,26rem)]", tab === "message" ? "flex flex-1 lg:flex-none" : "hidden")}
        >
          <div className="flex shrink-0 items-start gap-3">
            <Initials name={ticket.customerName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-extrabold text-ink">{ticket.customerName}</p>
              <p className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink-2">
                <span className="inline-flex items-center gap-1">
                  <Icon icon={Mail} size={14} />
                  <span suppressHydrationWarning>{agoLabel(age)}</span>
                </span>
                {ticket.bookingRef && (
                  <span>
                    Booking <b className="font-extrabold tracking-wide text-ink">{ticket.bookingRef}</b>
                  </span>
                )}
                {custom && <span className="font-bold">Written by you</span>}
              </p>
            </div>
            {custom && (
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete this ticket"
                className="-mr-2 -mt-1 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-danger-text"
              >
                <Icon icon={Trash2} size={18} />
              </button>
            )}
          </div>
          <h1 className="mt-2.5 shrink-0 text-title3 font-bold leading-snug text-ink">{ticket.subject}</h1>
          {state.triage && (
            <p className="mt-1.5 flex shrink-0 flex-wrap gap-1.5 lg:hidden">
              <PriorityBadge priority={state.triage.priority} />
              <CategoryTag category={state.triage.category} />
            </p>
          )}
          <p className="pane-scroll mt-2 min-h-0 flex-1 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{ticket.body}</p>
        </div>

        {/* The reply */}
        <div
          id="panel-reply"
          role="tabpanel"
          aria-labelledby="tab-reply"
          className={cn(CARD, "min-h-0 flex-col lg:col-start-1 lg:row-start-2 lg:flex", tab === "reply" ? "flex flex-1" : "hidden")}
        >
          <ReplyPanel
            ticket={ticket}
            state={state}
            now={now}
            busy={status.kind === "loading"}
            onEdit={onEdit}
            onResetDraft={onResetDraft}
            onSend={onSend}
            onReopen={onReopen}
          />
        </div>

        {/* The triage */}
        <div
          id="panel-triage"
          role="tabpanel"
          aria-labelledby="tab-triage"
          className={cn(CARD, "min-h-0 flex-col lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:flex", tab === "triage" ? "flex flex-1" : "hidden")}
        >
          <TriagePanel
            state={state}
            status={status}
            notice={notice}
            canUseAI={custom}
            onTriageAI={() => {
              setTab("triage");
              onTriageAI();
            }}
            onTriageRules={onTriageRules}
          />
        </div>
      </div>
    </article>
  );
}
