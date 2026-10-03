"use client";

import Link from "next/link";
import { CirclePause, Info, ListChecks, RotateCw, Sparkles, Wand2 } from "lucide-react";
import { Button, Icon, SkeletonText } from "@/components/kl";
import type { TicketState, TriageNotice } from "@/lib/contracts";
import { clauseById } from "@/lib/policy";
import { PRIORITY_LABEL } from "@/lib/triage";
import { CategoryTag, PriorityBadge } from "./labels";

export type TriageStatus = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string };

const SOURCE_LINE = {
  sample: "Written ahead of time for this sample ticket.",
  ai: "Drafted by AI from the policy rules above. Check it before you send.",
  rules: "Drafted by Strawberry's built-in rules, without AI. Finish the reply by hand.",
} as const;

export function TriagePanel({
  state,
  status,
  notice,
  canUseAI,
  onTriageAI,
  onTriageRules,
}: {
  state: TicketState;
  status: TriageStatus;
  notice: TriageNotice | null;
  /** Only tickets written here may call the model; samples ship with their triage. */
  canUseAI: boolean;
  onTriageAI: () => void;
  onTriageRules: () => void;
}) {
  const { triage, source } = state;

  return (
    <section aria-labelledby="triage-title" className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <h2 id="triage-title" className="flex items-center gap-2 font-display text-title3 font-semibold text-ink">
          <Icon icon={ListChecks} size={20} className="text-accent-text" />
          Triage
        </h2>
        <p className="text-sm text-ink-2">Topic, urgency and the policy rules that apply.</p>
      </div>

      <div className="pane-scroll -mx-1 mt-3 min-h-0 flex-1 px-1" aria-busy={status.kind === "loading" || undefined}>
        {status.kind === "loading" ? (
          <div className="flex flex-col gap-4" role="status">
            <p className="flex items-center gap-2 text-[15px] font-bold text-ink">
              <Icon icon={Sparkles} size={18} className="animate-pulse text-accent-text" />
              Reading the ticket and the policy…
            </p>
            <SkeletonText lines={3} />
            <SkeletonText lines={4} />
          </div>
        ) : !triage ? (
          <div className="flex flex-col gap-3 rounded-md bg-surface-2 p-4">
            <p className="text-[15px] text-ink">
              This ticket hasn&apos;t been triaged yet. Strawberry will sort it, pick the policy rules that apply and draft a
              reply.
            </p>
            {status.kind === "error" && (
              <p role="alert" className="flex items-start gap-2 text-sm font-bold text-danger-text">
                <Icon icon={Info} size={16} className="mt-0.5 shrink-0" />
                {status.message}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {canUseAI && (
                <Button size="sm" icon={Sparkles} onClick={onTriageAI}>
                  Triage with AI
                </Button>
              )}
              <Button size="sm" variant="secondary" icon={Wand2} onClick={onTriageRules}>
                Draft without AI
              </Button>
            </div>
            {canUseAI && (
              <p className="text-[13px] text-ink-2">
                Triage with AI sends this ticket&apos;s name, subject and message to an AI service. Draft without AI stays in your
                browser.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {notice && <NoticeBanner notice={notice} />}
            {status.kind === "error" && (
              <p role="alert" className="flex items-start gap-2 text-sm font-bold text-danger-text">
                <Icon icon={Info} size={16} className="mt-0.5 shrink-0" />
                {status.message}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5" data-testid="triage-labels">
              <PriorityBadge priority={triage.priority} />
              <CategoryTag category={triage.category} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[15px] font-bold leading-snug text-ink">{triage.summary}</p>
              <p className="text-sm text-ink-2">
                <span className="font-bold">Why {PRIORITY_LABEL[triage.priority].toLowerCase()}:</span> {triage.priorityReason}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.06em] text-ink-2">Policy rules cited</h3>
              {triage.citations.length === 0 && (
                <p className="text-sm text-ink-2">No policy rule matched this ticket. Check the policy before replying.</p>
              )}
              <ol className="flex flex-col gap-2">
                {triage.citations.map((c) => {
                  const clause = clauseById(c.clauseId);
                  if (!clause) return null;
                  return (
                    <li key={c.clauseId} className="rounded-md bg-surface-2 px-3 py-2.5">
                      <Link
                        href={`/policy#clause-${clause.id}`}
                        className="-my-3 flex min-h-11 items-center gap-2 text-sm underline-offset-4 hover:underline"
                      >
                        <span className="font-extrabold text-accent-text">{clause.id}</span>
                        <span className="font-bold text-ink">{clause.title}</span>
                      </Link>
                      <blockquote className="mt-1 border-l-2 border-accent/50 pl-2.5 text-[13px] leading-snug text-ink">
                        {clause.text}
                      </blockquote>
                      <p className="mt-1.5 text-[13px] leading-snug text-ink-2">
                        <span className="font-bold">Why it applies:</span> {c.why}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-1">
              <p className="min-w-0 flex-1 text-[13px] text-ink-2">{source ? SOURCE_LINE[source] : null}</p>
              {canUseAI && source === "rules" && (
                <Button size="sm" variant="secondary" icon={RotateCw} onClick={onTriageAI}>
                  Try AI again
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** Why the AI didn't answer. "Paused" is KL Web's state for an empty AI account balance. */
function NoticeBanner({ notice }: { notice: TriageNotice }) {
  const paused = notice.code === "paused";
  return (
    <div
      role="status"
      data-testid={paused ? "ai-paused" : "ai-notice"}
      className="flex items-start gap-2.5 rounded-md bg-warning-soft px-3 py-2.5 text-sm text-warning-text"
    >
      <Icon icon={paused ? CirclePause : Info} size={18} className="mt-0.5 shrink-0" />
      <p>
        <b>{notice.message}</b> This draft comes from Strawberry&apos;s built-in rules instead.
      </p>
    </div>
  );
}
