# The Bold Life Coach — Platform Acceptance & Go-Live

*Prepared by the HumanData desk · Client: The Bold Life (Jamesyn Snitker) · 2026-10-17*

This is the staging hand-off for **BLC's own coaching platform** — the member app she
runs coaching on (recorded-video curriculum + live video), built in her brand. The
flow is **stage → she accepts → we deploy for BLC**.

---

## 1. What is staged

The browser build of the platform (the Electron app's renderer, no desktop shell)
deployed to a review URL:

- **Staging URL:** `https://designresearchgroup.github.io/boldlife-coach-app/` — **LIVE**
- **Source:** `designresearchgroup/boldlife-coach-app`, auto-rebuilt on every push by
  `.github/workflows/deploy-web.yml`.
- **Desktop installers** (Mac `.dmg` / Windows `.exe`) build separately via
  `build.yml` — the native apps for the app stores come later (see `SHIP.md`).

---

## 2. What to review (acceptance checklist)

Open the staging URL and confirm each is right for The Bold Life:

- [ ] **Brand** — burgundy (#DC343B) + black, Poppins/Montserrat, the real logo,
      no-fill outline buttons. No HumanData blue, no pink.
- [ ] **Sales is light** — the **Enroll** screen renders in light mode (so people can
      see it to buy); member screens stay dark.
- [ ] **Dashboard** — the landing/overview reads as hers.
- [ ] **Learn / Academy** — the curriculum library layout and module design.
- [ ] **Lesson + video player** — a recorded lesson plays; scrubber, speed, resume,
      and auto-complete on finish all work. *(Shows the bundled sample video until
      real lesson videos are loaded.)*
- [ ] **Quiz / Certificate** — the completion path.
- [ ] **Session (live video)** — the live-coaching screen UI. *(Local camera preview
      works in-browser; remote peering is wired in production — see note below.)*
- [ ] **Pricing / Coach console** — copy and numbers match the plan
      ($9/mo · $99/yr · $299 forever).
- [ ] **Voice** — anything with words sounds like Jamesyn, not generic.

Send me anything that's off and I'll turn it on the staged URL before go-live.

---

## 3. What "staged" does and doesn't prove

- **Does:** the full UI, navigation, recorded-curriculum player, progress/resume,
  and brand — everything she'd demo or hand a client.
- **Doesn't yet:** real per-lesson videos (placeholder in use), and **live-video
  remote peering** (needs a provider — Daily — keyed in production; the UI and local
  camera are there, the two-way call is the one production wire-up).

---

## 4. Deploy for BLC (go-live) — what it takes

Once accepted, production is these steps (the ones needing her accounts are marked):

1. **Custom domain** — point BLC's domain (e.g. `app.theboldlifecoaching.com`) at
   Pages; add the `CNAME`. *(needs her DNS)*
2. **Live video provider** — a Daily (or equivalent) API key for real two-way calls.
   *(needs an account — small/free tier to start)*
3. **Real curriculum videos** — load her lesson videos (hosted URLs) in place of the
   placeholder. *(needs her content)*
4. **Paid path** — Stripe for the subscription/forever tiers if members pay here.
   *(needs her Stripe — see `../coach-platform/SETUP-SELLING.md`)*
5. **Native apps** (optional, later) — code-signing + app-store submission per
   `SHIP.md`. *(needs Apple Developer + MS Partner Center)*

Steps 1–3 are enough to **run coaching for BLC**. 4 adds payments; 5 adds the stores.

---

## 5. Status

> **Deployed.** `designresearchgroup/boldlife-coach-app` is live (public, same as the
> bold-life and coach-platform sites), GitHub Pages is on via Actions, and every push
> to `main` auto-rebuilds and republishes the staging URL above. Ready for her review.
