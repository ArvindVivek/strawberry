import type { Metadata } from "next";
import { AppFooter, AppHeader } from "@/components/inbox/AppChrome";
import { POLICY, policySections } from "@/lib/policy";

export const metadata: Metadata = {
  title: "Larkspur Air policy",
  description: "The made-up airline policy Strawberry cites when it triages a ticket: baggage, delays, refunds and more.",
};

export default function PolicyPage() {
  const sections = policySections();
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader page="policy" />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 pb-12 pt-4">
        <h1 className="font-display text-large font-semibold text-ink">{POLICY.title}</h1>
        <p className="mt-2 text-ink-2">{POLICY.intro}</p>

        <nav aria-label="Sections" className="mt-5 flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.number}
              href={`#section-${s.number}`}
              className="inline-flex min-h-11 items-center rounded-full bg-surface px-3.5 text-sm font-bold text-ink ring-1 ring-line hover:bg-surface-2"
            >
              {s.number}. {s.title}
            </a>
          ))}
        </nav>

        <div className="mt-8 flex flex-col gap-8">
          {sections.map((s) => (
            <section key={s.number} id={`section-${s.number}`} aria-labelledby={`section-${s.number}-title`} className="scroll-mt-4">
              <h2 id={`section-${s.number}-title`} className="font-display text-title2 font-semibold text-ink">
                {s.number}. {s.title}
              </h2>
              <div className="mt-3 flex flex-col gap-2.5">
                {s.clauses.map((c) => (
                  <div
                    key={c.id}
                    id={`clause-${c.id}`}
                    className="scroll-mt-4 rounded-md bg-surface px-4 py-3 shadow-[var(--shadow-card)] target:ring-2 target:ring-accent-text"
                  >
                    <h3 className="text-[15px] font-extrabold text-ink">
                      <span className="text-accent-text">{c.id}</span> {c.title}
                    </h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink">{c.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
