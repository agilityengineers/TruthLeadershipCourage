# Handoff: TLC Leadership Platform

## Overview
The **TLC (Truth Leadership Courage) Platform** is a multi-tenant leadership-development portal for The Wisdom Tri. It carries a business professional from a public sales page → a diagnostic leadership assessment → enrollment → a participant portal that serves them **before, during, and after** a 6-month cohort, plus operational dashboards for **trainers** and **admins**, and a communications layer.

The first cohort (Fall 2026) is seeded from a printed flyer, but the system is explicitly built as a **series**: every date, price, session, and trainer is data on a `Cohort` (an instance of the reusable `Program` = TLC). Admins create the next cohort by cloning — never by code change.

## About the design files
The files in this bundle are **design references created in HTML** — a prototype showing intended look, copy, and behavior. They are **not production code to copy directly.** The task is to **recreate these designs in the target codebase's environment** (React/Next, Vue, etc.) using its established patterns, component library, and state management. If no codebase exists yet, choose an appropriate stack (React + a component layer such as Tailwind/shadcn is a natural fit) and implement there.

The prototype is authored as a single "Design Component" HTML file driven by a small runtime; ignore that runtime — reproduce the **screens, styling, and interactions** described below.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interactions are intended as shown. Recreate the UI to match, using the target codebase's libraries. Exact tokens are in **Design Tokens** below.

---

## Surfaces / Screens
The prototype has a dark **prototype switcher bar** at the very top (Landing · Participant · Trainer · Admin). **This bar is prototype chrome only — do not ship it.** In production these are separate routes/areas gated by auth + role.

### 1. Landing page (public marketing/sales page)
- **Purpose:** Convert advancing leaders into assessment-takers. Single primary CTA site-wide: **"Start the Assessment."** Secondary transitional CTA: **"Book a call."**
- **Narrative structure (StoryBrand + Hero's Journey):** sticky nav → hero → trust strip → problem ("Why now", 4 numbered challenges) → promise (dark stat band) → meet the guide (Tri) → the plan (3 steps + EQ/IQ/MQ method cards) → what changes (6 outcomes w/ icons) → program at a glance (4-cell spec) → testimonials (3) → final CTA + FAQ accordion → footer.
- **Layout:** centered column, `max-width: 1140px`, side padding `clamp(18px,5vw,40px)`, section rhythm `clamp(56px,7vw,96px)`.
- **Hero:** 2-col grid `1.04fr .96fr`. Left: eyebrow ("An Invitation · Fall 2026 Cohort"), H1 (Newsreader 38–58px, one italic accent word in blue `#024794`), 18px subhead, primary + secondary buttons, microcopy ("Free · 4 minutes · no card required"). Right: brand photo (`tri_T.png`, forest canopy) `border-radius:18px` with a floating white stat card overlay (6 mo / Thu 9–11 PST / EQ·IQ·MQ).
- **Method cards (EQ/IQ/MQ):** 3 equal cards, solid fills — EQ `#024794` "Build the Leader", IQ `#262161` "Build the Team", MQ™ `#662d91` "Build Future Leaders". `border-radius:16px`, hover lift (translateY(-4px) + shadow).
- **FAQ:** accordion; one open at a time; "+" indicator; click toggles. 4 items.
- **CTA wiring:** all three "Start the Assessment" buttons (nav, hero, final band) open the **Assessment** surface.

### 2. Assessment (diagnostic signup quiz)
- **Purpose:** A short self-assessment that qualifies the prospect and, crucially, **mirrors their lower-scored areas back as specific TLC benefits.** This is the conversion moment. It runs **before** the participant lands in the portal.
- **Layout:** full-screen, light bg `#f4f6fb`, centered card `max-width:660px`. Header = logo + "Leadership Assessment" + "Exit".
- **Question state:** one question at a time. Card shows: theme chip (e.g. "Self-leadership"), "Question N of M", a gradient progress bar (`#024794`→`#662d91`, width = (current/total)·100%), the question (Newsreader 23–30px), a helper line, and 4 option buttons (4-point scale: Rarely / Sometimes / Often / Consistently). Selecting an option records the answer and auto-advances; on the last question it goes to results. "← Back" appears after Q1.
- **Option button:** full-width, left-aligned, `border:1.5px solid #e0e4ee`, `border-radius:12px`, radio dot on the left. Hover: border `#9bb4d6`, bg `#f6f9fe`. Selected: border `#024794`, bg `#eaf2fc`, filled dot.
- **Results / mirror screen:** "Your leadership snapshot" → for each answer scored **low (value ≤ 2)**, render a card: pillar badge (colored by EQ/IQ/MQ), theme name, and the mapped benefit sentence. Below: a "Strengths to build on" box listing themes scored ≥ 3. CTAs: **"Continue to your portal →"** (→ Participant/Before) and **"Retake"**.
- **Questions are placeholders.** They are tagged with a `theme` and carry `pillar`, `color`, and `benefit`. Real questions drop in by keeping the same shape.

### 3. Participant portal
- **Purpose:** The member's home across the whole journey. A **Before / During / After** segmented toggle (top-right of the content header) switches the phase. Left sidebar nav (Home, This Week, Materials, Progress, Workbook, Messages [badge], Resource Library, Coaching) on dark indigo `#1b1942`; 236px wide.
- **Before:** indigo→blue hero card "Your cohort begins in 46 days" + kickoff/sessions/coaching stats; "While you wait" checklist; right rail = workbook **shipment tracker** (Ordered → Printing → Shipped stepper) + a note-from-Tri card.
- **During:** "Welcome back" + "Week 7 of 24" + gradient progress bar; main "This Week" card (pillar tag, module title, checklist of pre-work / worksheet [Download PDF + Print] / live session, "Mark week complete"); Up-next & Recently-completed tiles; right rail = live-session join card, workbook status, next 1:1 coaching.
- **After:** purple→indigo "Program complete" hero; **Resource library** grid (stays accessible permanently); right rail = 100% journey card + "Stay connected".

### 4. Trainer
- **Purpose:** Manage one or more assigned cohorts. Dark sidebar `#16142b` (Cohort Overview, Participants, Resources, Events & Sessions, Messages [badge]).
- **Content:** 4 KPI tiles (active participants, avg completion, need-a-nudge, next session); **Participants & progress** table (avatar, name, company, progress bar, status On track/Behind); right rail = **Upcoming events** list (weekly sessions + 1:1 coaching) and **Resources** list (PDF/MP4 with Published/Draft state + "+ Upload").

### 5. Admin (multi-tenant)
- **Purpose:** Top of the hierarchy. Darkest sidebar `#0f0e22` (Overview, Companies, Cohorts, Participants, Trainers, **Assessment**, Resources & Events, Analytics).
- **Content:** 4 KPI tiles (active cohorts, client companies, enrolled participants, trainers); **Access hierarchy** card (4 color-coded tier cards); **Companies** table (logo, cohort, seats X/Y, viewers count); right rail = **Cohorts running now** (Fall 2026, Spring 2027 enrolling, a private company cohort — proving concurrent cohorts) + **Trainers** list.
- **Assessment Builder (functional in the prototype):** a card listing every assessment question with its number, pillar badge, theme, and prompt; each row has a **Delete** button; a **"+ Add question"** button appends a new question. **Admins must be able to add and delete assessment questions**, and the change must flow to the live signup assessment. (In the prototype the question bank lives in component state and both Admin and the Assessment read from it; in production this is a `Question` table scoped to the `Program`/assessment — see Data Model.)

---

## Interactions & behavior
- **Surface routing (prod):** auth + role determine the area; the prototype's top switcher is not shipped.
- **Landing CTAs → Assessment.** Assessment **Continue → Participant portal (Before phase).**
- **Assessment:** select option → record answer + advance; Back; auto-jump to results after last; results computed from answers (low scores → growth/benefit cards; high → strengths).
- **Participant phase toggle:** Before/During/After swaps content.
- **FAQ accordion:** single-open toggle.
- **Admin Assessment Builder:** Add appends a question; Delete removes by index; live assessment reflects the current set.
- **Hover/transition:** method cards lift (`transform .18s`, `translateY(-4px)`, shadow `0 16px 38px rgba(26,24,48,.14)`); buttons darken; sidebar links bg `#eef1fa`/`#f1f3fa`; option buttons border/bg transition `.12s`; progress bars `width .25s`.

## State management
Prototype state (recreate equivalently):
- `surface`: which area is shown (`landing` | `assessment` | `participant` | `trainer` | `admin`) — production = routes/role.
- `phase`: participant journey (`before` | `during` | `after`) — production = derived from cohort dates relative to now.
- `astep`: assessment index (`0..N-1` = questions, `N` = results).
- `answers`: `{ [questionIndex]: 1..4 }`.
- `faq`: open FAQ index or `-1`.
- `questions`: array of `{ theme, pillar, color, prompt, benefit }` — the assessment question bank, **admin-editable** (add/delete). In production this is persisted, not in component state.
Derived: current question, progress %, growth cards (answers ≤ 2 → benefit+pillar), strengths (answers ≥ 3).

## Question → benefit mapping (swap-in contract)
Each question carries a `theme`; the mirror copy/pillar travels with the question. Seed set:

| # | Theme | Pillar | Mirrored benefit |
|---|-------|--------|------------------|
| 1 | Self-leadership | EQ | Lead from a steadier, grounded place; build self-trust. |
| 2 | Communication | IQ | Create clarity and clear expectations so execution holds. |
| 3 | Conflict | IQ | Prepare for and hold hard conversations with ease. |
| 4 | Accountability | IQ | Raise team accountability & engagement — without chasing. |
| 5 | Developing others | MQ™ | Mentor & grow future leaders; build an employee-centered culture. |

All five are **placeholders** to be replaced by client-supplied questions; keep the `{theme, pillar, color, benefit}` shape and the mirror keeps working.

## Design tokens
**Color** (derived from the brand flyer + thewisdomtri.com):
- Indigo (structure/headers, dark surfaces) `#262161`; deepest sidebars `#1b1942`, `#16142b`, `#0f0e22`
- Blue / action / links — EQ `#024794` (hover `#013a7c`)
- Purple / MQ accent `#662d91`
- Sky tint `#b8d8e6`
- Ink (body) `#1c1a33` / `#22223a`; muted `#5a5e72`, `#7a7e92`, `#9498ab`
- Page bg `#eef1f7`; soft sections `#f6f8fc` / `#f8f9fc` / `#f4f6fb`; white `#fff`
- Hairlines `#e7eaf2`, `#eceef4`, `#eef0f5`
- Status: success `#1c7d4d`, warning/behind `#b8860b`/`#e0a32e`, delete/danger `#b03a52`
- Pillar mapping: **EQ → `#024794`, IQ → `#262161`, MQ™ → `#662d91`**

**Typography:**
- Display/headlines/quotes: **Newsreader** (serif), weights 400–600, italic used for accent words.
- UI/body/labels: **Public Sans**, weights 400–700.
- Eyebrows/labels: 11–11.5px, `letter-spacing:.1–.16em`, uppercase.
- Hero H1 `clamp(38px,5vw,58px)`; section H2 `clamp(27px,3.4vw,40px)`; body 14–18px, line-height 1.5–1.65.

**Spacing:** 8px base; section padding `clamp(56px,7vw,96px)`; card padding 18–26px; gaps 12–20px.
**Radius:** buttons 8–10px; cards 13–18px; pills 100px; small badges 6–9px.
**Shadow:** cards `0 12px 34px rgba(26,24,48,.07)`; hero image `0 24px 60px rgba(26,24,48,.18)`; hover `0 16px 38px rgba(26,24,48,.14)`.

## Assets
In `assets/` (pulled from thewisdomtri.com — the production app should use the brand's official source files):
- `wisdomtri-logo.jpg` — primary tree logo (use on light surfaces; white chip behind it on dark).
- `logo.webp` — same logo, transparent (alternative for dark surfaces).
- `tri_T.png` — forest-canopy hero photo.
- `mq_E.png` — photo of Tri Nguyen coaching (use in the "Meet the guide" section).
- `selfdiscovery.png`, `harmony.png`, `trust.png`, `inspire.png`, `buildtrust.png`, `grit.png` — purple line icons for the "What changes" outcomes / resource library.

## Backend & integrations (NOT in the UI)
**Payment is a backend concern and must never surface in the participant/marketing UI.** Checkout/billing runs server-side:
- **Stripe** — primary payment processor; on `checkout.session.completed`/webhook → mark `Payment` paid, activate the cohort seat, trigger welcome email, create the workbook `Shipment` (status `pending`).
- **ThriveCart (optional)** — alternative hosted cart; its purchase-success webhook hits the **same** enrollment endpoint, so the rest is processor-agnostic.
- **SendGrid** — transactional + push email (welcome, reminders, admin/trainer broadcasts segmented by cohort/company/individual).
- Pricing facts (e.g. $5,500) may appear as marketing copy on the sales page, but **no checkout/card UI** lives in the product surfaces shown here.

## Suggested data model
`Company` (tenant) → has many `User`; `User` has a `Role` (participant | company_viewer[read-only] | trainer | admin); `Program` (TLC) → has many `Cohort` (dates, price, capacity, trainer); `Cohort` → has many `Enrollment` (User↔Cohort), `Event` (weekly session / coaching), `Module`/`Resource`; `Assessment` belongs to a Program → has many `Question` (theme, pillar, prompt, benefit) → `AssessmentResponse` per user; plus `Payment`, `Shipment`, `Message`. The **four-tier hierarchy** = Company → Participants → Company Viewers (read-only) → Trainers/Admins.

## Files
- `TLC Platform.dc.html` — the full interactive prototype (all five surfaces + assessment). Open at the project root where its runtime + `assets/` resolve.
- `assets/` — logo + imagery + icons.

> The README is self-sufficient: implement from this document, using the HTML as a visual reference.
