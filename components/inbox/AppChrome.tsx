import Link from "next/link";
import { BookOpenText, Plus } from "lucide-react";
import { Button, CONTACT_URL, COPYRIGHT, Icon, ThemeToggle, privacyUrl, supportUrl } from "@/components/kl";
import { site } from "@/lib/site";

/** One 56px bar: the mark and name, the policy, a new ticket, the theme. */
export function AppHeader({ onNewTicket, page = "inbox" }: { onNewTicket?: () => void; page?: "inbox" | "policy" }) {
  return (
    <header className="shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        <Link href="/" className="-ml-1 flex min-h-11 min-w-0 items-center gap-2.5 rounded-sm px-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- a 32px SVG needs no optimising */}
          <img src="/icon.svg" alt="" width={32} height={32} className="shrink-0 rounded-[9px]" />
          <span className="font-display text-title3 font-semibold text-ink">{site.name}</span>
        </Link>
        <p className="hidden min-w-0 truncate text-sm text-ink-2 xl:block">
          Support inbox for Larkspur Air, a made-up airline
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {page === "inbox" ? (
            <Link
              href="/policy"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-[15px] font-bold text-ink-2 hover:bg-surface-2 hover:text-ink sm:px-3"
            >
              <Icon icon={BookOpenText} size={18} />
              <span className="hidden sm:inline">Policy</span>
              <span className="sr-only sm:hidden">Policy</span>
            </Link>
          ) : (
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-md px-3 text-[15px] font-bold text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              Inbox
            </Link>
          )}
          {onNewTicket && (
            <Button size="sm" icon={Plus} onClick={onNewTicket} aria-label="New ticket">
              <span className="max-[399px]:hidden">New ticket</span>
              <span aria-hidden="true" className="min-[400px]:hidden">
                New
              </span>
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

/** The studio footer, one line tall so the inbox keeps the screen. */
export function AppFooter({ className = "" }: { className?: string }) {
  const link = "inline-flex min-h-11 items-center px-2 font-bold text-ink-2 underline-offset-4 hover:text-ink hover:underline";
  return (
    <footer className={`shrink-0 pb-[env(safe-area-inset-bottom)] ${className}`}>
      <div className="flex flex-wrap items-center justify-center gap-x-1 px-3 text-[13px] text-ink-2 sm:justify-between sm:px-4">
        <p className="px-2 py-1">
          {COPYRIGHT}
          <span className="hidden md:inline"> · First built at the Open Source AI Hackathon #16.</span>
        </p>
        <nav aria-label="About this app" className="flex items-center">
          <a href={privacyUrl(site.slug)} className={link}>
            Privacy
          </a>
          <a href={supportUrl(site.slug)} className={link}>
            Support
          </a>
          <a href={CONTACT_URL} className={link}>
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
