"use client";

import { useMemo, useRef, useState } from "react";
import { useToast } from "@/components/kl";
import type { Ticket, TriageNotice } from "@/lib/contracts";
import { requestTriage } from "@/lib/api";
import { listItems, stateOf, type Filter } from "@/lib/inbox";
import { dispatch, useHashId, useInbox, useMinuteTick } from "@/lib/inbox-store";
import { retrieveClauses } from "@/lib/retrieval";
import { rulesTriage } from "@/lib/triage";
import { AppFooter, AppHeader } from "./AppChrome";
import { NewTicketDialog } from "./NewTicketDialog";
import { TicketDetail } from "./TicketDetail";
import { TicketList } from "./TicketList";
import type { TriageStatus } from "./TriagePanel";

/**
 * The whole app on one screen: the inbox on the left, the selected ticket on the right. Phones
 * show one at a time (the list, then the ticket), driven by the URL hash so Back works.
 */
export function InboxApp() {
  const inbox = useInbox();
  const hashId = useHashId();
  const tick = useMinuteTick();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [composing, setComposing] = useState(false);
  const [status, setStatus] = useState<Record<string, TriageStatus>>({});
  const [notices, setNotices] = useState<Record<string, TriageNotice | null>>({});
  const inFlight = useRef(new Set<string>());
  /** True when the open ticket was opened from the list, so Back can simply go back. */
  const openedFromList = useRef(false);

  // A fresh clock on every change and once a minute (`tick`), for "3 min ago" labels.
  const now = useMemo(() => new Date(), [inbox, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const items = useMemo(() => listItems(inbox, now), [inbox, now]);
  const fromHash = items.find((i) => i.ticket.id === hashId) ?? null;
  // Wide screens always show a ticket: the one in the URL, else the top of the list.
  const selected = fromHash ?? items[0] ?? null;
  const id = selected?.ticket.id ?? null;

  const select = (ticketId: string) => {
    if (ticketId === hashId) return;
    if (!hashId) openedFromList.current = true;
    window.location.hash = ticketId;
  };
  const back = () => {
    if (openedFromList.current) {
      openedFromList.current = false;
      window.history.back();
      return;
    }
    // Opened from a link: there is no list entry behind it, so clear the hash in place.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  const setTicketStatus = (ticketId: string, s: TriageStatus) => setStatus((all) => ({ ...all, [ticketId]: s }));

  const triageWithAI = async (ticket: Ticket) => {
    if (inFlight.current.has(ticket.id)) return;
    inFlight.current.add(ticket.id);
    setTicketStatus(ticket.id, { kind: "loading" });
    const result = await requestTriage({ customerName: ticket.customerName, subject: ticket.subject, body: ticket.body });
    inFlight.current.delete(ticket.id);
    if (!result.ok) {
      setTicketStatus(ticket.id, { kind: "error", message: result.message });
      return;
    }
    dispatch({ type: "triaged", id: ticket.id, triage: result.data.triage, source: result.data.source });
    setNotices((all) => ({ ...all, [ticket.id]: result.data.notice ?? null }));
    setTicketStatus(ticket.id, { kind: "idle" });
  };

  const triageWithRules = (ticket: Ticket) => {
    const matches = retrieveClauses(ticket.subject, ticket.body, 5);
    dispatch({ type: "triaged", id: ticket.id, triage: rulesTriage(ticket, matches), source: "rules" });
    setNotices((all) => ({ ...all, [ticket.id]: null }));
    setTicketStatus(ticket.id, { kind: "idle" });
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <AppHeader onNewTicket={() => setComposing(true)} />

      <main id="main" className="flex min-h-0 flex-1 gap-3 px-3 pb-1 sm:px-4">
        {/* The list: always on wide screens; on phones only when no ticket is open. */}
        <div className={`${fromHash ? "hidden md:flex" : "flex"} min-h-0 w-full flex-col md:w-[17.5rem] md:shrink-0 lg:w-[19rem]`}>
          <TicketList
            items={items}
            filter={filter}
            onFilter={setFilter}
            selectedId={id}
            onSelect={select}
            showIntro={!inbox.introDismissed}
            onDismissIntro={() => dispatch({ type: "dismissIntro" })}
            onReset={() => {
              dispatch({ type: "resetAll", now: new Date() });
              setStatus({});
              setNotices({});
              toast.show("Sample inbox reset. Tickets you wrote were removed.");
            }}
          />
        </div>

        <div className={`${fromHash ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1 flex-col pb-2`}>
          {selected && id ? (
            <TicketDetail
              key={id}
              ticket={selected.ticket}
              age={selected.age}
              now={now}
              state={stateOf(inbox, id)}
              status={status[id] ?? { kind: "idle" }}
              notice={notices[id] ?? null}
              onBack={back}
              onTriageAI={() => triageWithAI(selected.ticket)}
              onTriageRules={() => triageWithRules(selected.ticket)}
              onEdit={(draft) => dispatch({ type: "edit", id, draft })}
              onResetDraft={() => dispatch({ type: "resetDraft", id })}
              onSend={() => dispatch({ type: "send", id, at: new Date().toISOString() })}
              onReopen={() => dispatch({ type: "reopen", id })}
              onDelete={() => {
                dispatch({ type: "remove", id });
                back();
                toast.show("Ticket deleted.");
              }}
            />
          ) : (
            <p className="m-auto text-ink-2">No tickets yet.</p>
          )}
        </div>
      </main>

      <AppFooter className={fromHash ? "hidden md:block" : ""} />

      <NewTicketDialog
        open={composing}
        onClose={() => setComposing(false)}
        onCreate={(ticket) => {
          dispatch({ type: "add", ticket });
          setComposing(false);
          setFilter("all");
          window.location.hash = ticket.id;
        }}
      />
    </div>
  );
}
