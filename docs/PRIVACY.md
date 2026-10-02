# Strawberry Privacy Policy

_Last updated: 2 October 2026_

Strawberry is made by Kitchen Labs. It's a demo support inbox for Larkspur Air, a made-up
airline: it sorts each customer email by topic and urgency, finds the airline policy rules that
apply and drafts a reply you can edit. This page says, in plain English, what happens to your
information.

## The short version

- There are no accounts and no database. Everything you do stays in your own browser.
- The sample tickets and their drafted replies are written ahead of time and ship with the app.
- Only when you press **Triage with AI** on a ticket you wrote is that ticket's text sent to an
  AI service (OpenAI) to draft a triage and a reply.
- No ads, no analytics, no tracking cookies.

## What we handle, and why

**Your inbox.** Tickets you write, the replies you edit and the replies you mark as sent are saved
in your browser's local storage, so they're still there when you come back. They never reach our
server unless you press **Triage with AI**. Clearing your browser's site data, or pressing
**Reset the sample inbox**, removes them.

**Triage with AI.** When you press **Triage with AI** on a ticket you wrote, our server sends the
customer name, subject and message you typed, together with the matching rules from the made-up
airline policy, to OpenAI's API, which returns a suggested category, priority, the rules that
apply and a draft reply. Nothing else is sent: not your other tickets, not your edits, not any
account details (there are none). OpenAI processes this under its API terms, which say API data
isn't used to train its models and may be kept for up to 30 days for abuse monitoring. Our server
does not store the ticket or the answer; it passes the answer back to your browser. **Draft
without AI** never leaves your browser. Please don't type real people's personal details into a
ticket.

**Server logs.** Our host, Vercel, keeps standard request logs (such as the page or address
requested, the time, and your IP address) for a short period. Our own log lines for an AI call
record only token counts and timing, never the ticket text. Your IP address is also used, in
memory only, to limit how many AI triages one visitor can run (5 a minute, 20 a day).

## What we don't do

No advertising, no analytics tools, no cookies for tracking, no selling or sharing of data. We
don't ask for your email, phone number, location or contacts. The "Send reply" button never sends
an email; it only marks the reply as sent in your browser.

## Children

Strawberry is not directed at children under 13 and does not knowingly collect personal
information from them.

## Changes and contact

If this policy changes, we'll update the date above. Questions: use the
[Kitchen Labs contact page](https://kitchenlabs-one.vercel.app/contact).
