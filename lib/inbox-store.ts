"use client";
// The browser side of lib/inbox.ts: one in-memory copy of the inbox, saved to localStorage on
// every change and shared by every component through useSyncExternalStore (no hydration
// mismatch: the server and the first client render both use the sample inbox).
import { useSyncExternalStore } from "react";
import { STORAGE_KEY, inboxReducer, initialInbox, parseSaved, type InboxAction, type InboxState } from "@/lib/inbox";

const listeners = new Set<() => void>();
let current: InboxState | null = null;
const serverSnapshot = initialInbox(new Date());

function read(): InboxState {
  if (!current) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode or blocked storage: the inbox still works, it just won't be remembered.
    }
    current = parseSaved(raw, new Date());
  }
  return current;
}

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the inbox: drop our copy so the next read picks up theirs.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    current = null;
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function dispatch(action: InboxAction) {
  current = inboxReducer(read(), action);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn("[inbox] could not save to localStorage", err);
  }
  notify();
}

export function useInbox(): InboxState {
  return useSyncExternalStore(subscribe, read, () => serverSnapshot);
}

// ---------------------------------------------------------------------------------------------
// The selected ticket lives in the URL hash (#t-1001), so the phone's back button returns to the
// list and a link can open one ticket.

function subscribeHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

export function useHashId(): string {
  return useSyncExternalStore(
    subscribeHash,
    () => decodeURIComponent(window.location.hash.slice(1)),
    () => "",
  );
}

// ---------------------------------------------------------------------------------------------
// A clock that ticks once a minute, for "12 min ago" labels on tickets you wrote.

let minute = 0;
function subscribeMinute(listener: () => void) {
  const id = window.setInterval(() => {
    minute += 1;
    listener();
  }, 60_000);
  return () => window.clearInterval(id);
}

export function useMinuteTick(): number {
  return useSyncExternalStore(subscribeMinute, () => minute, () => 0);
}
