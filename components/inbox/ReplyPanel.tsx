"use client";

import { CircleCheck, Copy, PenLine, Send, Undo2 } from "lucide-react";
import { Button, Icon, useToast } from "@/components/kl";
import type { Ticket, TicketState } from "@/lib/contracts";
import { agoLabel, currentReply } from "@/lib/inbox";
import { firstName } from "@/lib/triage";

const CONTROL =
  "w-full rounded-sm bg-surface-2 px-3 text-[15px] text-ink ring-1 ring-inset ring-line placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-accent-text";

export function ReplyPanel({
  ticket,
  state,
  now,
  busy,
  onEdit,
  onResetDraft,
  onSend,
  onReopen,
}: {
  ticket: Ticket;
  state: TicketState;
  now: Date;
  /** True while a triage is being drafted: the editor waits for it. */
  busy: boolean;
  onEdit: (draft: { subject: string; body: string }) => void;
  onResetDraft: () => void;
  onSend: () => void;
  onReopen: () => void;
}) {
  const toast = useToast();
  const reply = currentReply(state);

  const header = (
    <h2 className="flex items-center gap-2 font-display text-title3 font-semibold text-ink">
      <Icon icon={PenLine} size={20} className="text-accent-text" />
      Reply
    </h2>
  );

  if (state.sent) {
    const minutes = Math.max(0, Math.round((now.getTime() - Date.parse(state.sent.at)) / 60_000));
    return (
      <section aria-label="Reply" className="flex min-h-0 flex-1 flex-col gap-2.5">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          {header}
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-success-soft px-3 text-[13px] font-extrabold text-success-text">
            <Icon icon={CircleCheck} size={16} />
            <span suppressHydrationWarning>Sent {agoLabel(minutes).toLowerCase()}</span>
          </span>
        </div>
        <div className="pane-scroll min-h-0 flex-1 rounded-sm bg-surface-2 px-3 py-2.5 ring-1 ring-inset ring-line">
          <p className="text-[15px] font-bold text-ink">{state.sent.subject}</p>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{state.sent.body}</p>
        </div>
        <div className="flex shrink-0 justify-end">
          <Button size="sm" variant="secondary" icon={PenLine} onClick={onReopen}>
            Edit and send again
          </Button>
        </div>
      </section>
    );
  }

  if (!reply) {
    return (
      <section aria-label="Reply" className="flex min-h-0 flex-1 flex-col gap-2.5">
        {header}
        <div className="flex flex-1 flex-col items-start justify-center gap-3 rounded-md bg-surface-2 p-4">
          <p className="text-[15px] text-ink-2">
            {busy ? "The drafted reply will appear here in a moment." : "The drafted reply appears here after triage."}
          </p>
          {!busy && (
            <Button
              size="sm"
              variant="secondary"
              icon={PenLine}
              onClick={() =>
                onEdit({ subject: `Re: ${ticket.subject}`, body: `Hi ${firstName(ticket.customerName)},\n\n\n\nLarkspur Air Support` })
              }
            >
              Write it yourself
            </Button>
          )}
        </div>
      </section>
    );
  }

  const edited = state.draft !== null && state.triage !== null;
  const empty = !reply.body.trim();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${reply.subject}\n\n${reply.body}`);
      toast.show("Reply copied.", { tone: "success" });
    } catch (err) {
      console.error("[reply] copy failed", err);
      toast.show("Couldn't copy. Select the text and copy it by hand.", { tone: "danger" });
    }
  };

  return (
    <section aria-label="Reply" className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="min-w-0">
          {header}
          <p className="text-sm text-ink-2">Edit it, then send. This demo never emails anyone.</p>
        </div>
        {edited && (
          <button
            type="button"
            onClick={onResetDraft}
            className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-bold text-ink-2 hover:text-ink"
          >
            <Icon icon={Undo2} size={16} />
            Undo my edits
          </button>
        )}
      </div>
      <label className="sr-only" htmlFor="reply-subject">
        Subject
      </label>
      <input
        id="reply-subject"
        value={reply.subject}
        onChange={(e) => onEdit({ subject: e.target.value, body: reply.body })}
        className={`${CONTROL} h-11 shrink-0 font-bold`}
      />
      <label className="sr-only" htmlFor="reply-body">
        Reply to {ticket.customerName}
      </label>
      <textarea
        id="reply-body"
        value={reply.body}
        onChange={(e) => onEdit({ subject: reply.subject, body: e.target.value })}
        className={`${CONTROL} pane-scroll min-h-28 flex-1 resize-none py-2.5 leading-relaxed`}
      />
      <div className="flex shrink-0 items-center justify-end gap-2 pt-1">
        <Button size="sm" variant="secondary" icon={Copy} onClick={copy}>
          Copy
        </Button>
        <Button
          size="sm"
          icon={Send}
          disabled={empty}
          onClick={() => {
            onSend();
            toast.show(`Reply to ${firstName(ticket.customerName)} marked as sent.`, { tone: "success" });
          }}
        >
          Send reply
        </Button>
      </div>
    </section>
  );
}
