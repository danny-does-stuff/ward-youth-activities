---
name: Celina Ward youth schedule
description: Kitchen-fridge calendar for ward youth games, concerts, and activities.
colors:
  enamel: "#e8e0d2"
  ink: "#241c16"
  muted: "#6a5344"
  magnet: "#d4452a"
  magnet-ink: "#fff6ee"
  marker: "#1e4d8c"
  sticky: "#f0d24a"
  sticky-ink: "#241c16"
  pad: "#faf6ee"
  danger: "#b42318"
  enamel-dark: "#1c1812"
  pad-dark: "#3b3228"
typography:
  display:
    fontFamily: "Permanent Marker, cursive"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.01em"
  body:
    fontFamily: "Nunito, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  title:
    fontFamily: "Nunito, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "normal"
rounded:
  sm: "2px"
  none: "0px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-sticky:
    backgroundColor: "{colors.sticky}"
    textColor: "{colors.sticky-ink}"
    typography: "{typography.display}"
    padding: "11px 19px"
    height: "48px"
  magnet-bar:
    backgroundColor: "{colors.magnet}"
    textColor: "{colors.magnet-ink}"
    typography: "{typography.display}"
    padding: "12px 16px"
---

## Overview

The product is a fridge calendar, not an event-card dashboard. A magnet-red bar names the ward. Events live on a cream pad, grouped by week then day, as ruled lines. Light is the only theme.

## Colors

Enamel ground, ink brown (not gray), magnet red, marker blue, sticky yellow. Dark mode uses a warmer enamel and a lifted pad so notes still read as paper on the door.

## Typography

Permanent Marker for the magnet bar, day titles, and the Add event sticky. Nunito extra-bold for event titles and actions; Nunito regular for supporting copy. Times use marker blue, not a second display face.

## Layout

Mobile-first. Thumb nav pinned to the bottom (This week / Add event). The pad is left-aligned, max-width about a phone. Day groups stack; rows expand in place. Do not center a card grid.

## Elevation & Depth

The pad uses a soft offset shadow. The sticky button lifts slightly on hover. No glass, no neon glow.

## Shapes

Near-square corners. Inputs are underlined fields, not pills. The sticky is a rectangular magnet-note.

## Components

- **Magnet bar** — full-width, ward name in marker hand.
- **Sticky button** — primary action (Add event, Add to the schedule).
- **Day pad** — marker-blue wash on the day heading, ruled event rows.
- **Event row** — time, title, youth; tap to peel open calendar export and add youth.
- **Thumb nav** — two equal targets, 48px min height.

## Do's and Don'ts

Do: group by day, hide past events on home, put new events on the public list immediately.

Don't: identical glass cards, approval queues on the public site, emoji as icons, gray text on cream, a fourth explainer page.
