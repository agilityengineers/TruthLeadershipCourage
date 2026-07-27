# TLC Platform — Slack Issue Resolution Plan

_Source: DevOps punch-list captured from Slack (Clarence Williams / Tri Nguyen).
Grounded against the actual codebase — every file/line reference below was read
directly, not inferred. Nothing here is implemented yet; this is the plan._

## Executive summary

Most of these nine items are small, because this platform **already ships an
admin content-editing system** — a per-section visibility toggle
(`siteSection.visible`), a typed content registry (`lib/site-content/src/index.ts`),
a live editor at **`/admin/content`**, and blob-backed image upload. Several
"make X editable / change this button / remove this text" asks are therefore
**registry edits or config**, not new engineering. The genuinely engineering-sized
items are **impersonation (#3)**, the **admin CRM view (#5)**, and making the
**confirmation page fully editable (#6)**. The assessment is **not** forced into
the signup flow today; the work for #4/#9 is repointing the assessment call-to-action
buttons that are scattered across the site.

| # | Ask | Where it lives | Effort | Needs a decision? |
|---|-----|----------------|--------|-------------------|
| 1 | Company = free-form **required** text, not a dropdown | `enroll-form.tsx`, `routes/enrollment.ts`, `CreateEnrollmentBody` (api-zod + `openapi.yaml`) | **M** | Yes — create a company record per name vs store raw text |
| 2 | Login-page logo ~2× larger | `login/page.tsx`, `invite/page.tsx`, `logo.tsx` | **S** | Minor — resize only vs also make uploadable |
| 3 | Impersonation should work for all users; explain **why** first | `routes/users.ts`, `user-dialogs.tsx`, `portal/page.tsx` | **M** | Yes — impersonate admins? show what for empty portals? |
| 4 | Assessment is marketing only — take it out of the process | registry CTAs + `login/page.tsx`, `portal/page.tsx` | **S** | Yes — hide route entirely vs just repoint buttons |
| 5 | User dashboard = CRM for the admin (name/email/phone/cohort) | `admin/users/page.tsx` (+ new detail view + new API) | **M–L** | Yes — extra fields? trainers too? |
| 6 | Confirmation page fully editable (logo/upload, CTA + Calendly, drop Stripe text) | `enroll/confirmation/page.tsx`, `confirmation.main` in registry | **M** | Yes — Calendly URL; drop vs reword disclaimer |
| 7 | Toggle the **Organizations** page on/off + remove its nav link when off | `landing-nav.tsx`, `organizations/page.tsx`, registry `global.nav` | **S–M** | Yes — redirect vs 404 when off (default = OFF now) |
| 9 | Replace the two "Start the Assessment" buttons on About Tri | registry `aboutTri.hero` / `aboutTri.cta` | **S** | No |

_(The Slack thread also has a non-dev note from Tri — the 8/24 8:30 PST "Authority
Desk" interview. Not part of this plan.)_

---

## Leverage: what already exists (read this before estimating anything)

The admin content system does most of the heavy lifting for #2, #6, #7, #9:

- **`lib/db/src/schema/siteSection.ts`** — every marketing section is a row with a
  `visible` boolean, ordered `content` JSON, and an `updatedBy` audit stamp.
- **`lib/site-content/src/index.ts`** — the registry: ~30 sections across Global /
  Home / Organizations / About Tri / Other pages, each with typed editable
  `fields` (`text`, `textarea`, `url`, `image`, `link`, `list`) and a `default`.
  A bad edit always falls back to the default, so the site can't break.
- **`/admin/content` → `content-builder.tsx`** — the editor already supports:
  **toggle visibility**, **reorder**, **edit** every field kind, **image upload**
  (`image-field.tsx` → blob), full-URL **link editor** (label + href, accepts
  `https://…` so Calendly works), list add/remove/reorder, and **reset to
  original**. Only `page:"global"` sections (nav/footer) are "always shown"
  (editable but not toggleable).
- **`routes/content.ts`** — public read (visible sections + globals, merged over
  defaults) and admin write, with blob upload.

**Net-new registry work needed:** a logo/image field for the confirmation page and
(optionally) a global brand logo (#2/#6); CTA link fields on the confirmation
section (#6); a page-level enable flag for Organizations (#7). Everything else is
editing existing defaults.

---

## Issue #3 — Impersonation — **the "why" (read before any change)**

Clarence asked to be told *why* before we touch anything. There are two separate
mechanisms, and both are working as written — this is not a random bug.

### Why can I only impersonate *certain* users?

Impersonation eligibility is gated in two mirrored places:

- **Server:** `routes/users.ts` `POST /admin/users/:id/impersonate` rejects unless
  the target is **`status === "active"`**, **not** an `ADMIN`/`SUPER_ADMIN`, not
  yourself, and you're not already impersonating (`users.ts:186-201`).
- **UI:** `user-dialogs.tsx` `ImpersonateUserButton` hides the button with the
  same rule — `eligible = status==="active" && role!=="ADMIN" && role!=="SUPER_ADMIN"
  && not self && !isImpersonating()` (`user-dialogs.tsx:456-462`).

So the button is **hidden for anyone who isn't an active, non-admin account.** The
important consequence: **every self-service signup is created as
`status:"invited"`** — `routes/enrollment.ts:119` inserts the new participant with
`status:"invited"` and only a placeholder hash; they don't become `active` until
they set a password via the invite flow. **That's almost certainly why "Clarence
Test" and typical new signups can't be impersonated** — they've never activated,
so they're `invited`, so the rule hides the button. (Admins are also excluded by
design.)

### Why can't I see the dashboard of a typical user?

Even when you *can* impersonate someone, the participant portal only renders real
content for a **paid, onboarded** enrollment:

- `portal/page.tsx:24` allows `PARTICIPANT`/`ADMIN`, then calls
  `useGetPortalHome()`.
- If there's no active enrollment, `portal/page.tsx:31-40` renders **only** an empty
  card: *"You don't have an active enrollment yet."* + a "Start the assessment"
  button.
- New signups sit at enrollment `status:"PENDING"` until payment is fulfilled
  (`enrollment.ts:200`), and there's a `needsOnboarding` gate (two seed questions,
  `portal/page.tsx:44`). So a typical test user has an **empty portal** — nothing
  to look at — which reads as "I can't see their dashboard."

**Summary:** you're blocked at two layers — the impersonate button hides
non-active accounts, and the portal is intentionally empty until an enrollment is
paid + onboarded.

### Proposed change (pending sign-off)

1. **Widen eligibility** so invited/pending (and disabled?) accounts can be
   impersonated — relax the `status==="active"` check in both `users.ts` and
   `user-dialogs.tsx`, **keeping** the self / last-admin / audit-logging
   guardrails. Decide whether admins remain non-impersonable.
2. **Make an empty portal useful under impersonation** — instead of the marketing
   "Start the assessment" card, show a clear admin-facing state (e.g. "PENDING
   enrollment — not yet onboarded") or use the existing **`?preview=`** mechanism
   (`portal/page.tsx:26-27`) so the admin can preview the real dashboard states.

**Effort:** M. **Risk:** Medium — session/permission correctness; must not let
impersonation escalate privileges. The "Viewing as … / Exit impersonation" banner
already exists (`impersonation-banner.tsx`).

---

## Issue #1 — Company: dropdown → required free-form field

- **Current:** `enroll-form.tsx:109-123` renders `<select name="companyId">`
  populated from a `companies` list (`enroll/page.tsx:14` ← `GET /enroll/options`,
  `enrollment.ts:34-38`, active companies only). It's **optional** ("Company
  (optional)"). The server threads `companyId` (a real FK) into
  `user.companyId`, `seat.companyId`, `enrollment.companyId`, and
  `payment.companyId` (`enrollment.ts:120,188,198,207`).
- **Root cause:** the field was modeled as a foreign key to an existing `company`
  row, so it can only be a dropdown of companies that already exist.
- **Fix:**
  1. `enroll-form.tsx` — replace the `<select>` with a **required** text
     `<Input name="companyName" required>`.
  2. `CreateEnrollmentBody` (`lib/api-zod` + `lib/api-spec/openapi.yaml`) —
     `companyId?` → `companyName: string` (required); regenerate the client.
  3. `routes/enrollment.ts` — **find-or-create** a `company` row by normalized
     name, then thread its id into the existing FK fields exactly as today. This
     keeps the CRM (#5), company-viewer dashboards, and reporting working, and
     every enrollee gets a real company record.
  4. `enroll/page.tsx` / `/enroll/options` — the `companies` list is no longer
     needed for the form (leave or remove).
- **DB:** none (reuse `company`). **API:** enrollment create body change. **Effort:** M.
  **Risk:** Low–Med (name typos create near-duplicate companies — see open
  questions).

## Issue #2 — Login-page logo ~2× larger

- **Current:** both auth pages render `<Logo size={70} withWordmark
  subtitle="TLC Platform" href="/" />` — `login/page.tsx:22` and
  `invite/page.tsx:46` (the set-password page is also a "login page"). The logo
  image is hardcoded `/brand/wisdomtri-logo.png` in `logo.tsx:31`.
- **Fix (quick):** bump `size={70}` → `size={140}` (~+100%) on both pages.
- **Optional (from #6 "ideal to upload the logo"):** add a `logo` image field to a
  Global/brand registry section and thread it into `logo.tsx` (and the two other
  hardcoded uses: `enroll/page.tsx:28`, `landing-nav.tsx:25`) so one uploaded asset
  drives every surface.
- **DB/API:** none for the resize. **Effort:** S (resize) / M (uploadable).

## Issue #4 — Assessment is a marketing tool: take it out of the process

- **Current:** the assessment is **not** required to sign up — `responseId` is
  optional through the whole flow (`enroll-form.tsx:48`, `enrollment.ts:125`). What
  remains are **assessment call-to-action buttons** scattered around:
  - Registry (already admin-editable): `home.finalCta.primaryCta`
    (`index.ts:567`), `bookACall.main.primaryCta` (`index.ts:1220`),
    `aboutTri.hero.secondaryCta` (`index.ts:954`), `aboutTri.cta.primaryCta`
    (`index.ts:1198`).
  - Hardcoded: `login/page.tsx:41` ("Start the assessment →") and
    `portal/page.tsx:36` (empty-state button).
- **Fix:** since the assessment isn't turned on yet, repoint/remove every
  `/assessment` CTA. The registry ones can be changed via `/admin/content` today
  (or we set new defaults); the two hardcoded ones need code edits (repoint to
  `/cohorts` or remove). #9 handles the two About Tri buttons specifically.
- **Optional:** add a real "assessment on/off" flag later (hide the `/assessment`
  route + all CTAs from one switch). Not needed just to satisfy this ask.
- **Effort:** S.

## Issue #5 — User dashboard as a CRM for the admin

- **Current:** `admin/users/page.tsx` lists name/email/role/status/company + Edit /
  Delete / Impersonate actions. The name is **not** clickable, there is **no**
  `/admin/users/[id]` detail route (confirmed — only `page.tsx` exists), and
  **phone is never captured or shown** anywhere (`grep phone` across the app is
  empty) even though `user.phone` exists in the schema (`schema/user.ts:28`).
- **Fix:**
  1. **Capture phone** — add a phone field to `enroll-form.tsx` (+
     `CreateEnrollmentBody`) and to the admin add/edit user dialogs
     (`user-dialogs.tsx`).
  2. **Detail / CRM view** — add `/admin/users/[id]` (or a drawer) showing name,
     email, **phone**, company, title, role/status, joined date, and the person's
     **enrollments → cohort** + enrollment/payment status; make the list name link
     to it.
  3. **API** — add `GET /admin/users/:id` returning the user with
     enrollments+cohort+payment joined (or extend the list response).
- **DB:** none required (phone exists); optional `notes`/tags if wanted. **Effort:**
  M–L.

## Issue #6 — Confirmation page fully editable

- **Current:** `enroll/confirmation/page.tsx` **already** reads the
  `confirmation.main` registry section (`index.ts:1283`) for heading / body /
  waitlist / disclaimer — so the **Stripe / ThriveCart line is already editable and
  removable today** via `/admin/content → Other pages → Enrollment confirmation →
  Disclaimer` (default at `index.ts:1302`). What's **not** editable: the logo is
  hardcoded `<Logo size={48} withWordmark subtitle="The Wisdom Tri" />`
  (`confirmation/page.tsx:28`), and the buttons ("Sign in to your portal" / "Back
  to home", `:42-47`) are hardcoded — there's no CTA/Calendly field and no logo
  field on the section.
- **Fix:**
  1. **Logo alone + ~2× larger:** `size 48 → 96`, drop `withWordmark` (circle mark
     only).
  2. **Editable CTA + Calendly:** add `primaryCta` (a `link` field) to
     `confirmation.main` fields+default — default label "Book an appointment with
     the trainer", href = a Calendly URL. The admin edits label+href in
     `/admin/content` (the link editor already accepts full `https://` URLs,
     `content-builder.tsx:330-344`).
  3. **Drop Stripe text:** update the `disclaimer` default (`index.ts:1302`) to
     remove "Stripe / ThriveCart" (or blank it).
  4. **Upload the logo:** add a `logo` image field to the section (ImageField →
     blob upload) so it's admin-uploadable.
  5. **"Fully editable":** the page is already a registered section — extending its
     fields to cover logo + CTA makes every visible element admin-editable.
- **DB/API:** none (registry is code; edits live in `siteSection.content`).
  **Effort:** M.

## Issue #7 — Toggle the Organizations page on/off (and drop its nav link)

- **Current:** each `org.*` section is individually toggleable, **but** the nav is
  rendered from `global.nav.links` **unfiltered** on every page (`app/page.tsx:18`,
  `organizations/page.tsx:18`); the "TLC for Organizations" link is a fixed entry
  (`index.ts:122`); and `/organizations` has **no route guard** — it always
  renders. So hiding the sections does **not** remove the link, and there is no
  single on/off switch.
- **Fix (recommended):** add **one page-level "Organizations page" enable toggle**,
  consulted by (a) a nav/footer link filter that drops any href to `/organizations`
  when off, and (b) the `/organizations` route, which redirects to `/` when off.
  Reuse `siteSection`/registry for the flag rather than new schema.
- **Interim (no code):** the admin can already remove the org link from
  `global.nav.links` (editable list) and hide the org sections — but the route
  stays reachable by direct URL. The single toggle is the clean fix.
- **Default:** OFF now (per the request). **Effort:** S–M.

## Issue #9 — Replace the two "Start the Assessment" buttons on About Tri

Both buttons are content-registry `link` fields (already admin-editable); the fix
is to set the correct defaults so it's right out of the box:

| Location | Registry field | Before | After |
|----------|----------------|--------|-------|
| **Meet Your Guide** hero | `aboutTri.hero.secondaryCta` (`index.ts:954`) | `"Start the Assessment →"` → `/assessment` | **`"Return to home"` → `/`** |
| **Let's Talk** closing band | `aboutTri.cta.primaryCta` (`index.ts:1198`) | `"Start the Assessment →"` → `/assessment` | **`"Upcoming Cohort Dates →"` → `/cohorts`** (matches the nav CTA, `index.ts:126`) |

Also tidy the copy that references the assessment (`aboutTri.cta.body`,
`index.ts:1197`). **Effort:** S.

---

## Recommended sequencing

**Batch 1 — quick wins (registry/config + tiny code):**
- #9 the two About Tri buttons (registry defaults).
- #4 repoint the remaining assessment CTAs (registry + `login`/`portal`).
- #6 remove the Stripe/ThriveCart line — **doable immediately** via `/admin/content`.
- #2 login + invite logo `70 → 140`.
- #1 company free-form required field (+ find-or-create).

**Batch 2 — small features:**
- #6 confirmation page: enlarge/isolate logo, add editable CTA (Calendly), add logo
  upload field.
- #7 Organizations page toggle + nav-link filter + route redirect.

**Batch 3 — larger:**
- #5 phone capture + admin CRM detail view (+ detail API). _Depends on #1 (both
  touch the enroll form and enrollment body)._

**Gated on sign-off:**
- #3 impersonation — present the diagnosis above, get direction, then relax
  eligibility + improve the empty-portal state.

---

## Open questions for Clarence / Tri

1. **(#1)** For the free-form company field, do we **create a company record** per
   typed name (find-or-create — keeps the CRM and company dashboards populated) or
   just **store the raw text**? Any de-duplication expectation? Required for
   everyone, including independents?
2. **(#3)** Should **admins** be impersonable too, or keep ADMIN/SUPER_ADMIN
   excluded? Confirm we should allow impersonating **invited / not-yet-activated**
   accounts (this is the main blocker today).
3. **(#3)** When impersonating someone with no active/paid enrollment, what should
   the dashboard show — a real preview of the portal, or a clear "pending / not
   onboarded" state?
4. **(#4)** Turn the assessment **fully off** now (hide the `/assessment` route +
   all buttons), or just repoint the marketing buttons and leave the assessment
   reachable by direct link? Do you want a persistent admin on/off switch for it?
5. **(#6)** What **Calendly URL** should "Book an appointment with the trainer"
   use, and whose calendar (Tri's)? Remove the Stripe/ThriveCart disclaimer
   **entirely**, or reword to a generic "payment handled securely off-site"?
6. **(#2/#6)** Should the logo become **admin-uploadable** (one asset shared across
   nav / login / enroll / confirmation), or just **resized** for now?
7. **(#7)** Confirm Organizations page default = **OFF** now. When off, should
   `/organizations` **redirect home** or return **404**?
8. **(#5)** Beyond name / email / phone / company / cohort, any relationship fields
   you want (free-text **notes**, last-contacted, tags)? Should **trainers** get the
   CRM view too, or admins only?
