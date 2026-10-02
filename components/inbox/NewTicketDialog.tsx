"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import { Button, Dialog, Field, Input, Textarea } from "@/components/kl";
import type { Ticket } from "@/lib/contracts";
import { newTicketId } from "@/lib/inbox";
import { BODY_MAX, NAME_MAX, SUBJECT_MAX, triageInput } from "@/lib/triage";

/** Ready-made customer emails, so trying the AI takes one tap. All invented. */
const EXAMPLES = [
  {
    customerName: "Noah Fischer",
    bookingRef: "WT5J9C",
    subject: "Suitcase arrived with a broken wheel",
    body: "Hi, I flew Boston to Denver yesterday and my suitcase came off the belt with one wheel snapped off and a crack in the shell. I took photos at the airport. Can you repair or replace it?",
  },
  {
    customerName: "Mei Chen",
    bookingRef: "LQ3V8D",
    subject: "Flight delayed 4 hours, stuck in Chicago tonight",
    body: "My connection to Portland was delayed four hours because of a broken part on the plane, and now the last flight has left. I'm stuck at O'Hare overnight with my two kids. Where do we sleep, and who pays for it?",
  },
  {
    customerName: "Jonas Berg",
    bookingRef: "XF2R6P",
    subject: "Can I bring my service dog?",
    body: "I'm flying to Seattle in two weeks with my trained service dog, Juno. What do I need to do before the flight, and is there a fee?",
  },
];

type Draft = { customerName: string; bookingRef: string; subject: string; body: string };
const EMPTY: Draft = { customerName: "", bookingRef: "", subject: "", body: "" };

export function NewTicketDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (ticket: Ticket) => void }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [example, setExample] = useState(0);

  const set = (key: keyof Draft) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const close = () => {
    setErrors({});
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = triageInput.safeParse(draft);
    if (!parsed.success) {
      const next: Partial<Record<keyof Draft, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Draft;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    const ref = draft.bookingRef.trim().toUpperCase();
    const now = new Date();
    onCreate({
      id: newTicketId(now),
      ...parsed.data,
      bookingRef: /^[A-Z0-9]{5,8}$/.test(ref) ? ref : null,
      createdAt: now.toISOString(),
      origin: "custom",
    });
    setDraft(EMPTY);
    setErrors({});
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="New ticket"
      description="Write a customer email the way it would arrive. It stays in this browser until you triage it."
      className="max-w-lg"
      actions={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="new-ticket">
            Add to inbox
          </Button>
        </>
      }
    >
      <form id="new-ticket" onSubmit={submit} noValidate className="flex flex-col gap-3.5">
        <button
          type="button"
          onClick={() => {
            const ex = EXAMPLES[example % EXAMPLES.length];
            setDraft(ex);
            setErrors({});
            setExample((i) => i + 1);
          }}
          className="inline-flex min-h-11 w-fit cursor-pointer items-center gap-1.5 rounded-md bg-accent-soft px-3 text-sm font-bold text-accent-text"
        >
          <Shuffle size={16} aria-hidden="true" />
          Fill in an example
        </button>
        <div className="grid gap-3.5 sm:grid-cols-[1fr_9rem]">
          <Field label="Customer name" error={errors.customerName}>
            <Input value={draft.customerName} onChange={set("customerName")} maxLength={NAME_MAX} autoComplete="off" />
          </Field>
          <Field label="Booking" optional>
            <Input value={draft.bookingRef} onChange={set("bookingRef")} maxLength={8} autoComplete="off" className="uppercase" />
          </Field>
        </div>
        <Field label="Subject" error={errors.subject}>
          <Input value={draft.subject} onChange={set("subject")} maxLength={SUBJECT_MAX} autoComplete="off" />
        </Field>
        <Field label="Message" error={errors.body} hint={`Up to ${BODY_MAX.toLocaleString("en-US")} characters. Please don't use real personal details.`}>
          <Textarea value={draft.body} onChange={set("body")} maxLength={BODY_MAX} rows={5} />
        </Field>
      </form>
    </Dialog>
  );
}
