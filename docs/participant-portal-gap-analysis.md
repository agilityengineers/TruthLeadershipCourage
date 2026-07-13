# Participant Portal Home Screen — Gap Analysis & Level of Effort

**Source design:** "TLC Participant Portal — Home Screen Design Review" (Draft v3, July 8, 2026, for review by Tri Nguyen and Jam Bartolo)
**Assessed against:** this repository (`main` @ `bfeb788`), July 13, 2026
**Scope:** the participant-facing experience only, per the design document's own scope

---

## 1. Executive summary

The design document reimagines the participant home screen as a **"mirror, not a scoreboard"** — a single mobile-first screen whose entire content is driven by the program clock and the participant's own written words. The current portal is the opposite animal: a desktop dashboard organized around week-completion progress, with no participant writing captured anywhere in the system.

**Verdict: this is a substantial rebuild of the participant experience, not a restyle.** Roughly 70% of the design has no existing foundation, and the program data model itself must be remodeled before any of the home-screen states can be expressed.

| Measure | Estimate |
|---|---|
| MVP "mirror" home (remodel + anchor + Now card + journey line + reflections + Live It) | **13.5–20 dev-days** |
| Full participant-facing design (adds mirror strip, partners, coaching booking, print request, graduation/close) | **≈ 23–35 dev-days (5–7 weeks)** |
| Same scope, developer new to this codebase | ≈ 35–58 dev-days (7–12 weeks) |

Assumptions: one experienced full-stack developer; estimates include schema/seed rewrites, OpenAPI + codegen loop, the sweep of existing pages that assume the old program shape, and manual verification. The repo currently has no automated test suite; adding one for the date-math state machine is recommended (+0.5–1 day, not included).

The three findings that drive the estimate:

1. **Program-model mismatch (foundational).** The code models 10 modules cycled across a flat 24 weekly sessions with a `before/during/after` phase model. The design requires 8 modules on a two-week heartbeat (lesson session → Live It stretch → practice session), a labeled 8-week Intersession, Session 1/Session 2 segments, graduation, and a 30-day portal close — none of which exist in the schema, seed, API, or UI. Every home-screen state in the design derives from this structure, so it must land first.
2. **Participant writing does not exist.** There is no free-text capture, storage, versioning, or display anywhere in the platform — no seed reflections, I AM statements, Leadership Why, Live It reflections, or module closing reflections. The anchor, the mirror strip, the Live It checklist, and the graduation download all depend on this greenfield capability.
3. **Social and booking features are absent or read-only.** No accountability-partner concept exists in any layer. Coaching supports rescheduling pre-created bookings only — there is no self-serve booking. The invite flow captures only a password, with no onboarding step where the two seed questions could be asked.

What keeps this from being worse: per-cohort session events with dates and join URLs already exist, as do chat threads (reusable for partner notes), in-app notifications, a solid RBAC/tenant-scoping layer (the "only you see this" promise is enforceable server-side), workbook resources and shipment tracking, the EQ/IQ/MQ pillar system with brand tokens, and a clean contract-first API workflow.

---

## 2. What the design specifies (condensed)

One idea governs the design: the home screen reflects the participant's own words back at program-timed moments, and never measures completion.

**Program truth:** Session 1 = Modules 1–6 over 12 weeks, each module a two-week heartbeat (lesson session → "Live It" stretch → practice session); 8-week Intersession carrying the coaching 1:1s; Session 2 = Modules 7–8 over 4 weeks; capstone (Personal Leadership Operating System one-pager + 90-Day Commitment Map); graduation, where the day-one seed reflection returns; portal closes 30 days after the last session with a full download of everything the participant wrote.

**The locked home-screen elements:**

1. **Anchor** — the top of the screen always holds the participant's own words: two seed reflections captured at account creation, replaced by the I AM statement after the Module 1 lesson, joined by the Leadership Why by Module 3. The I AM is refinable at any time with all prior versions retained (no look-back UI yet).
2. **Now card** — exactly one action, state-driven: pre-start = cohort countdown + get the workbook (+ request a printed copy); session day = join button (indigo); Live It stretch = the module's practice checklist (teal outline); Intersession = coaching booking (teal).
3. **Cadence contract** — the screen cycles through exactly four states per module (before lesson → Live It opens → before practice → checklist dissolves), identically for all 8 modules. Nothing accumulates.
4. **Live It checklist** — per-module items from the workbook's Between Sessions page; checking an item opens a one-line reflection ("what did you notice"); the checked state reads "Lived it"; no overdue or guilt styling.
5. **Mirror strip** — resurfaces the participant's earlier structured writing (I AM lines, Live It commitments, Monday Morning Practice answers, module closing reflections) timed to the program; never free-form text; visible "only you see this" privacy promise.
6. **Partner presence** — partner's name, whether they checked in this week, one-tap send-a-note. Shows *that* a partner practiced, never *what* they wrote. No streaks.
7. **Journey line** — a quiet position marker on the EQ → IQ → Intersession → MQ arc, always naming the current module.
8. **Quiet row** — persistent, subdued row: Workbook, Schedule, References, Trainer.
9. **The close** — graduation opens a one-click download of everything written; the portal prompts it again before closing 30 days after the last session.

**Visual language:** participant words in italic serif; portal voice plain; indigo for lesson sessions and teal for Live It/Intersession; mobile-first single column (~450px), designed for a thirty-second phone glance.

The document defers (but the platform should anticipate): the trainer-side view, the graduation moment UI, sponsored-cohort variations, and the post-program 90-day arc. Stage 1 (inquiry → acceptance → payment link → welcome email → invite, with won/loss/wait and prospect notes) is described as journey context; only its tail end — seed questions at account creation — is participant-portal work.

---

## 3. Current state of the platform (verified)

**Stack:** pnpm monorepo. Web app `artifacts/tlc-platform` (Vite + React 19 + wouter + TanStack Query + Tailwind v4 + shadcn/ui). API `artifacts/api-server` (Express 5, one route file per domain, RBAC + tenant scoping in `src/lib/`). Database `lib/db` (Postgres + Drizzle, 34 tables, one per file, idempotent seed). Contract-first API: `lib/api-spec/openapi.yaml` → Orval-generated client hooks and Zod schemas. Payments and email are simulated stubs.

**The participant portal today** (`artifacts/tlc-platform/src/app/portal/`):

- The home page (`portal/page.tsx`) branches on a client-side `derivePhase()` into three hardcoded layouts — **before** (countdown hero, static "while you wait" checklist, workbook shipment stepper, hardcoded "note from Tri"), **during** ("Week N of 24" + progress bar, static weekly checklist, "Mark week complete" button, indigo join-session card, coaching card), and **after** ("Program complete" hero, library tiles).
- Progress is the only participant-writable signal: `POST /enrollments/:id/complete-week` flips week-level `LOCKED/AVAILABLE/COMPLETED` rows. Checklists are decorative — no checkbox state, no text input, no persistence.
- Coaching (`portal/coaching/`) lists two pre-created 1:1 bookings with a reschedule dialog and an `.ics` download; there is no self-serve booking.
- Messages (`portal/messages/`) provide direct participant↔trainer threads plus a cohort channel.
- Settings offer a GDPR-style JSON account export; a printable certificate exists.
- Navigation is a fixed 236px desktop sidebar with nine items; there is no mobile-first shell or bottom row.

**Program structure in code** (`lib/db/src/seed.ts`, `lib/db/src/schema/`): 10 modules (EQ 1–4, IQ 5–8, MQ 9–10; titles like "Self-Awareness", "Hard Conversations") cycled modulo across 24 `WEEKLY_SESSION` events; `event.type` knows only `KICKOFF / WEEKLY_SESSION / COACHING_1ON1`; cohort `endDate = start + 26 weeks`; `totalWeeks` is hardcoded to 24 in `src/lib/cohort.ts` and echoed in trainer/company/admin pages. "Intersession" appears only in marketing copy; "Be Wise" / "Be Bold" appear only inside the brand-model PNG in `attached_assets/`.

**Design-system deltas:** there is no teal token (`src/index.css` defines indigo + EQ/IQ/MQ pillar colors); `--font-serif` aliases the sans display font, so no true serif exists for the "participant voice"; italic emphasis is currently used for Tri's quotes and headings, not reserved for participant words.

**Reusable foundations worth naming:** per-cohort session events with `startAt/endAt/joinUrl`; enrollment shipping address (jsonb); the invite/set-password token flow; chat threads (DIRECT type reusable for partner notes); the in-app notification system; RBAC capabilities + tenant scoping (company viewers already see aggregates only — the privacy promise has an enforcement home); `resource` rows with a `WORKBOOK` type and download URLs; the `coachingBooking` table; pillar colors/badges; `daysUntil`/`derivePhase` utilities as a starting point.

---

## 4. Gap analysis

| # | Design element | Backend today | Frontend today | Verdict |
|---|---|---|---|---|
| 1 | Anchor (seed reflections → I AM versions → Leadership Why) | ❌ none | ❌ none | **Greenfield** |
| 2 | Now card (one action, state-driven) | 🟡 events exist | 🟡 fragments (countdown, join card, coaching card as separate blocks) | **Consolidate + 2 new states** |
| 3 | Cadence state machine (4 states × 8 modules, Intersession, Session 1/2) | ❌ flat 24 weeks | ❌ before/during/after only | **Foundational remodel** |
| 4 | Live It checklist + per-item "what did you notice" | ❌ none | ❌ static/decorative only | **Greenfield** (+ content authoring) |
| 5 | Mirror strip (resurfacing engine + privacy note) | ❌ none | ❌ none | **Greenfield** (depends on 1, 4) |
| 6 | Partner presence (pairing, weekly signal, send-a-note) | ❌ none | ❌ none | **Greenfield** (chat reusable for notes) |
| 7 | Journey line (EQ → IQ → Intersession → MQ, names module) | 🟡 pillars exist | 🟡 progress bar exists | **New component + segment model** |
| 8 | Quiet row (Workbook / Schedule / References / Trainer) | ✅ destinations exist | 🟡 as sidebar nav | **Layout work only** |
| 9 | Graduation download + 30-day close | 🟡 GDPR JSON export | 🟡 after-phase screen | **New writing bundle + access gate** |
| 10 | Seed questions at account creation | ❌ | ❌ invite sets password only | **New onboarding step** |
| 11 | Welcome note from Tri (seed state) | 🟡 hardcoded | 🟡 hardcoded card | **Make data-driven (small)** |
| 12 | Printed workbook request + lead-time cutoff | 🟡 shipment auto-created | 🟡 stepper exists | **New request flow (small)** |
| 13 | Coaching self-serve booking (Intersession) | 🟡 reschedule only | 🟡 list only | **New booking endpoint + UI** |
| 14 | Visual language (teal, serif participant voice, mobile-first column) | — | ❌ | **Tokens + layout work** |

Elements 1, 3, 4, 5, and 6 have essentially zero counterpart in any layer — no table, no endpoint, no component. The platform's entire notion of participant state today is `{before/during/after} × {week 1–24 completion}`.

---

## 5. Level of effort

Phased so each row is independently shippable where possible. Sizing assumes one experienced full-stack dev already familiar with this codebase.

| Phase | Workstream | Depends on | Days |
|---|---|---|---|
| 0 | Design tokens (teal, true serif "participant voice" class) + static mockups of the 4 states for design sign-off | — | 1.5–2.5 |
| 1 | **Program remodel** (foundational): `LESSON_SESSION`/`PRACTICE_SESSION`/`GRADUATION` event types; module `segment` + lesson/practice week fields; 8-module seed rewrite; cohort `welcomeNote` + `portalClosesAt`; server-side `derivePortalState()` + new `GET /portal/home`; sweep of all 24-week assumptions across portal/trainer/company/admin pages | — | 4–6 |
| 2 | **Home rebuild MVP**: mobile-first single-column page; Anchor, NowCard, JourneyLine, QuietRow components; `reflection` table (append-only, versioned) + endpoints; post-login seed-question onboarding gate; I AM capture/refine; data-driven welcome note | 0, 1 | 5–7 |
| 3 | **Live It**: item templates per module + per-participant check state + one-line reflection; checklist component ("Lived it" state, no guilt styling); seeded content (+ minimal admin CRUD) | 1, 2 | 3–4.5 |
| — | **MVP cut line — coherent "mirror" home** | | **13.5–20** |
| 4 | Mirror strip: deterministic timing rules in `derivePortalState()` + component with "only you see this" | 2, 3 | 1.5–2.5 |
| 5 | Accountability partner: pairing flow (deadline = first practice session), weekly check-in signal derived from partner's Live It activity, send-a-note via existing direct threads | 2, 3 | 2.5–4 |
| 6 | Intersession coaching self-booking: slot generation + create endpoint + UI + Now-card integration | 1 | 2–3 |
| 7 | Printed-workbook request: `NOT_REQUESTED` shipment state, lead-time cutoff validation, address confirm, pre-start Now-card link | 1 | 1.5–2.5 |
| 8 | Graduation export bundle (everything written, print-friendly) + graduated home state + 30-day portal-close gate | 2 (richer after 3–5) | 2–3 |
| | **Total — full participant-facing design** | | **≈ 23–35 dev-days (5–7 weeks)** |

Phases 6 and 7 are independent of 2–5 and can be pulled forward or run in parallel.

**Developer new to the codebase:** add 3–5 ramp days (monorepo, Orval codegen loop, Drizzle push/seed cycle, RBAC idioms) and a 1.4–1.7× multiplier → **≈ 35–58 dev-days (7–12 weeks)**.

**Not included (explicit exclusions):** trainer-side view; sponsored-cohort variations; Stage-1 CRM pipeline (prospect notes, won/loss/wait, payment links); making the simulated email/payment stubs real; real calendar/Zoom integration; automated reminder/nudge campaigns (the doc itself assigns Intersession follow-up to the trainer personally); capstone document authoring tools (Personal Leadership Operating System, 90-Day Commitment Map) beyond including them in the export.

---

## 6. What needs to happen (implementation roadmap)

### 6.1 Remodel the program structure (prerequisite for everything)

Keep the existing tables; change their meaning. The new program is still 24 weeks (Session 1 = weeks 1–12, Intersession = 13–20, Session 2 = 21–24), so the week grid survives.

- `lib/db/src/schema/_shared.ts`: extend `eventTypeEnum` with `LESSON_SESSION`, `PRACTICE_SESSION`, `GRADUATION` (additive enum changes are safe; keep `WEEKLY_SESSION` for legacy cohorts). Add `programSegmentEnum` (`SESSION_1 | INTERSESSION | SESSION_2`), `reflectionKindEnum`, `partnerStatusEnum`; extend `shipmentStatusEnum` with `NOT_REQUESTED`.
- `module`: add `segment`, `lessonWeekNo`, `practiceWeekNo`. `cohort`: add `welcomeNote`, `portalClosesAt`.
- `moduleProgress`: 8 rows per enrollment instead of 24; `COMPLETED` = practice session done. The 4-state heartbeat within a module is *derived*, never stored — "nothing accumulates" by construction.
- Rewrite `lib/db/src/seed.ts`: 8 modules (names pending — see decisions), 16 lesson/practice events + kickoff + Intersession coaching windows + graduation event; demo personas positioned mid-Live-It, pre-lesson, and in Intersession so every state is demoable.
- New server-side pure function `derivePortalState()` (`artifacts/api-server/src/lib/portalState.ts`) computing segment, current module, 4-state cycle, the single Now-card payload (discriminated union), journey position, mirror item, and onboarding flag — exposed via a new `GET /portal/home`. Keep the existing `?phase=` preview pattern as a `?preview=` state toggle for demos.
- Compatibility sweep of the 24-week assumption: `src/lib/cohort.ts` (`totalWeeks=24`), portal progress/certificate pages, trainer overview/participant pages, company and admin progress denominators, the `complete-week` endpoint (becomes module-scoped), public cohort copy.

### 6.2 Add the participant-writing spine

One append-only table carries everything the design needs: `reflection` (`enrollmentId`, `kind` = SEED / I_AM / LEADERSHIP_WHY / MODULE_CLOSING / MONDAY_MORNING, `promptKey`, optional `moduleId`, `body`, `createdAt`; no updates — every save is a new row, which *is* the version history the design asks to retain). Endpoints: `POST /portal/reflections`, `GET /portal/reflections` (self-scoped). The anchor, mirror strip, and graduation export all read from here.

### 6.3 Live It

`liveItItem` (per-module checklist templates from the workbook's Between Sessions pages) + `liveItProgress` (per-participant `checkedAt` + one-line `note`). Check/uncheck endpoints. Content must be authored per module — seed-only for MVP or a small admin CRUD (included in the estimate as "minimal").

### 6.4 Partner presence

`partnerLink` (cohort-scoped pairing, chosen before the first practice session). "Checked in this week" is *derived* from the partner's `liveItProgress` activity within the current module window — no check-in table, and the signal exposes only that they practiced, never items or notes. "Send a note" reuses the existing DIRECT thread machinery. The privacy line is enforced in the API layer: reflections and Live It notes are never joined into any trainer, company, or admin read.

### 6.5 The rest

- **Seed questions:** a post-first-login onboarding gate in the portal (two screens, words previewed in the serif "participant voice") writing SEED reflections — works for both invited and self-enrolled users without touching the public invite endpoint.
- **Coaching self-booking:** `GET /portal/coaching/slots` + `POST /portal/coaching/bookings` against the existing `coachingBooking` table; surfaces in the Intersession Now card.
- **Printed workbook:** shipments start `NOT_REQUESTED`; `POST /portal/shipment/request` validates the lead-time cutoff against cohort start and confirms the enrollment address.
- **Graduation & close:** `GET /portal/export` bundles all reflections + Live It notes into a print-friendly keepsake page; a shared guard returns the closed state after `portalClosesAt` (export stays reachable); the graduated home state brings the seed reflection back.
- **Visual language:** add the teal token and a true serif to `src/index.css` / `index.html`; a single `.voice-participant` class makes "their words are always visually theirs" a reusable primitive rather than a convention.

### 6.6 Where deferred scope attaches later

Trainer-side view hangs off the same `derivePortalState()` outputs (minus reflections) in `routes/trainer.ts`; Stage-1 CRM attaches to `company`/`waitlistEntry`/`payment` + admin routes; sponsored-cohort variation branches on `cohort.companyId`/`isPrivate` inside the portal state; the graduation-moment UI drops into the Phase 8 component slot.

---

## 7. Decisions needed before/during build

From the design document's own open questions plus realities discovered in code:

1. **Canonical 8-module list.** The doc names Module 2 "Be Wise" and Module 3 "Be Bold"; the seed has 10 differently-named modules. The full names/order must be settled before the seed rewrite (blocks Phase 1 content, not code).
2. **Where seed questions are asked.** Recommended: a post-first-login portal gate (covers both invite and self-enroll paths, keeps writing off the public token endpoint) — vs. inside the invite-accept step.
3. **"Checked in this week" definition.** Proposed: at least one Live It item checked within the current module's Live It window; alternatives are any portal activity or an explicit "I practiced" tap.
4. **Live It content authoring.** Who enters the per-module items — seed/developer only, or an admin editing UI (small add)?
5. **Mirror timing.** Deterministic rules inside `derivePortalState()` (recommended — no authoring burden) vs. an editable per-cohort resurfacing schedule.
6. **Uncheck affordance.** Recommend allowing correction within the module window, consistent with the no-guilt stance.
7. **Coaching slot source.** MVP-generated slots from trainer hours vs. real calendar integration; also confirm the source of Zoom join links per session (currently a hardcoded example URL in seed — admin-entered per event is the near-term answer).
8. **Print request cutoff.** The exact lead time (e.g., 14 days before kickoff) and the fallback copy for late enrollees.
9. **Trainer visibility of reflections: none.** Worth an explicit sign-off — "reflections feed the Practice Session" means participants bring them, not that trainers read them. The company viewer likewise never sees writing (already structurally true).
10. **Sidebar consolidation.** Whether the nine-item nav slims toward the quiet-row philosophy now or after the trainer-side redesign.

Plus the design doc's own softer questions to settle in review: Leadership Why truncation on small phones, "Lived it" wording, the welcome-note signer for private cohorts, and journey-line label friendliness (EQ/IQ/MQ vs. plainer names).

---

## 8. Risks & assumptions

- **Date math is the product.** The whole home screen is a function of `now` vs. the cohort schedule. `derivePortalState()` should be a pure function, compared in the **cohort's timezone** (events are timestamptz; cohorts carry a timezone string), and is the strongest candidate for the repo's first automated tests.
- **Breaking data-shape change.** `moduleProgress` 24 → 8 rows is fine now (demo data, reseed), but if real cohorts exist at build time a backfill script is needed.
- **Mobile shell check.** The design is phone-first; the current shell is a fixed desktop sidebar. The ~450px column fits inside it, but the shell's true mobile behavior needs an early look (budgeted; ~+1 day if it needs a responsive pass).
- **Enum hygiene.** Adding Postgres enum values is safe; removing `WEEKLY_SESSION` later is the risky direction — don't.
- **Simulated infrastructure.** Email and payments are stubs. Everything in this estimate works with stubs, but "welcome email," real booking confirmations, and Stage-1 payment links will eventually need the real integrations, which are separate infrastructure work.
- **Content dependency.** Live It items, module anchor lines, and welcome-note copy come from the workbook/Tri — engineering can ship the containers, but the program content is an external dependency on the same critical path as module naming.

---

*Prepared as a build-readiness assessment of the uploaded home-screen design; file paths reference this repository at the commit noted above.*

---

## 9. Implementation status (addendum)

All phases (0–8) of Section 5 were subsequently implemented on this branch, participant-facing scope:

- **Phase 0–1:** teal + serif "participant voice" tokens; `LESSON_SESSION`/`PRACTICE_SESSION`/`GRADUATION` event types; module segments + lesson/practice weeks; 8-module seed ("Be You/Be Wise/Be Bold" EQ → "Connect Authentically/Drive Collaboration/Build Unity" IQ → Intersession → "Guide Impact/Inspire Potential" MQ — working names pending the canonical list, decision #1); server-side `derivePortalState()` (`artifacts/api-server/src/lib/portalState.ts`) behind `GET /portal/home` with a `?preview=` state toggle; schedule-synced module progress (the manual "mark week complete" endpoint is gone); 24-week assumptions swept (trainer/company/admin denominators now come from the data).
- **Phase 2:** home screen rebuilt (`src/app/portal/page.tsx` + `src/components/portal/home/*`): Anchor (seeds → I AM versions → Leadership Why), Now card (indigo sessions / teal Intersession), journey line with labeled Intersession, quiet row; post-first-login seed-question onboarding gate; I AM capture + refine (append-only `reflection` table keeps every version); data-driven welcome note (`cohort.welcomeNote`).
- **Phase 3:** `liveItItem`/`liveItProgress` tables + seeded per-module practices; checklist card with per-item "what did you notice" note, "Lived it" state, undo, no guilt styling; lesson-session commitment capture.
- **Phase 4:** mirror strip with deterministic timing (prev-module closing before lesson; commitment during Live It; week-one seed line in Intersession; anchor carries the seed's return at graduation) and the visible "Only you see this" promise.
- **Phase 5:** `partnerLink` pairing (choose flow), practiced-this-week signal derived from Live It activity (Intersession: booking signal), one-tap note via existing direct-message threads. Reflections/notes are never joined into trainer, company, or admin reads.
- **Phase 6:** Intersession coaching self-booking (`GET /coaching/slots`, `POST /coaching/bookings` with clash/2-session validation) + booking UI on the coaching page and Intersession Now card.
- **Phase 7:** printed-workbook request (`NOT_REQUESTED` default, `POST /portal/shipment/request` with lead-time messaging) on the pre-start Now card and workbook page.
- **Phase 8:** `GET /portal/export` + `/portal/keepsake` printable record of everything written, graduated home state, and the 30-day close gate (`cohort.portalClosesAt`; closed screen keeps the download reachable).

Verified end-to-end against a seeded local Postgres: all seven home states via the preview toggle, the onboarding gate (both questions saved as SEED reflections), Live It check/uncheck with notes, I AM versioning, partner notes (lazy direct-thread creation), slot booking + double-book rejection, print-request idempotence, export contents, and that trainer/company payloads contain no participant writing.
