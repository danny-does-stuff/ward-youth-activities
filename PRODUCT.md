# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: parents and families in Celina Ward opening the site on a phone to see what youth games, concerts, and activities happen this week.

Secondary: the same families (and youth leaders) posting an event when a game or performance is scheduled. Youth may be named on events and added later; they are not a separate logged-in audience.

Occasional: a trusted leader using `/admin` with a password to delete a mistaken event. Nobody is expected to monitor an approval queue.

## Product Purpose

A shared ward schedule for youth activities, games, and performances. Anyone in the ward can add an event; it appears on the public list immediately. Success is a parent glancing at a phone and knowing what is happening this week, then optionally adding an event to their own calendar or posting a new one.

## Positioning

This is Celina Ward’s own youth calendar—named youth, local times and places, posted by people you already know—not a city events feed and not a moderated public forum.

## Operating Context

Used mostly on phones (gym, carpool, church foyer, kitchen). Typical moment: “what is happening this week?” Secondary moment: “put this on the family calendar” or “add tonight’s game.” Admin is rare and unattended. Existing events stay in Cloudflare D1; the `approved` column remains in the database but is not a publishing gate.

## Capabilities and Constraints

- Public home: all upcoming events grouped by week (This week, Next week, then Week of …), then by day. Past events are not the home-page job.
- Submit: title, at least one youth, date, start and end time; optional location, address, contact, notes.
- Add a youth name to an existing event; known names autocomplete.
- Add an event to a personal calendar (.ics and Google Calendar).
- Admin: password sign-in and delete. Approval/unpublish is not part of the product job; leftover `approved` values may remain unused.
- Stack: TanStack Start (React) on Cloudflare Workers, D1, Drizzle, Tailwind. Production deploys from GitHub Actions on `main`.
- Ward display name comes from `WARD_NAME` (Celina Ward).
- Terminology: event, youth, this week, add event, add to calendar, delete.

Undecided: whether past events appear anywhere after they end (home hides them).

## Brand Commitments

Name: Ward Youth Activities / Celina Ward. Voice: warm and neighborly, with the energy of youth games and concerts—not a meeting agenda and not a startup dashboard. Theme follows the phone: light by default, dark when the OS is dark.

## Evidence on Hand

Real event records in D1 (title, youth names, times, optional location and contact). No photography, logo lockup, or testimonials on hand—do not invent ward branding marks, quotes, or attendance numbers.

## Product Principles

1. This week on a phone is the product; posting is close behind.
2. Trust the ward: submissions go live; cleanup is delete, not a review queue.
3. Say what the site is in the home and nav—no extra explainer page.
4. Calendar export is part of usefulness, not a bonus.
5. Keep language a neighbor would use: event, youth, this week.

## Accessibility & Inclusion

Mobile-first, large tap targets, readable in daylight and in dark mode. No product-specific WCAG level was set; meet WCAG AA contrast and do not rely on color or emoji alone.
