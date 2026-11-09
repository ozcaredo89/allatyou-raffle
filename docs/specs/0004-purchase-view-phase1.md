# Spec: 0004-purchase-view-phase1

- **Issue:** Closes #5, #7
- **Status:** Completed
- **Created:** 2026-11-09

## 1. Objective
Make the public purchase view (`/` and `/sorteos/[slug]`) sell the raffle instead of opening with a wall of numbers: show the prize and price up front, build trust with real winners, show real progress, explain how to buy in three steps, and make it fast to find a favorite number. All of it uses real data only (no fake counters, no simulated activity) and needs no database changes (phase 2 adds draw date / prize fields and an admin-managed winners table).

## 2. In-Scope Files
*Touch ONLY the files explicitly listed below:*
- `app/MainClientPage.tsx`
- `app/components/raffle/RaffleHero.tsx` (new)
- `app/components/raffle/HowItWorks.tsx` (new)
- `app/components/raffle/RaffleProgress.tsx` (new)
- `app/components/raffle/WinnersStrip.tsx` (new)
- `app/components/raffle/NumberGrid.tsx`
- `app/components/raffle/LuckySlot.tsx`
- `app/globals.css`
- `public/winners/ganadores-1.jpg`, `ganadores-2.jpg`, `ganadores-3.jpg` (new)
- `docs/specs/0004-purchase-view-phase1.md`
- `docs/product.md`

## 3. Acceptance Criteria
- [x] The hero shows the raffle name, description (line breaks preserved), a large cover image, the ticket price and a primary "Elegir mi número" button that scrolls to the lucky generator / grid.
- [x] Only one "Compartir" button exists (top bar). Instagram/Facebook links and "Otros sorteos" move below the grid.
- [x] A 3-step strip explains "Elige → Paga por Nequi → Recibe tu boleta".
- [x] A progress bar shows "X de N números ya tienen dueño" computed from real ticket statuses (available vs reserved/pending/paid) and updates with realtime changes.
- [x] A "Ganadores reales" strip shows real winner photos with captions and a link to Instagram.
- [x] The grid has a number search (partial match, with a clear "no existe / no disponible" message), "termina en" 0–9 chips, an "Solo disponibles" toggle and a "ir a página" control; filters reset the page to 1.
- [x] The Lucky Slot lets the buyer choose 1, 2, 3 or 5 numbers, shows a confetti burst when the reels stop, and respects `prefers-reduced-motion` (no spin/confetti).
- [x] Reserving from the slot adds all drawn numbers (respecting the 30-ticket cap) and opens the checkout.
- [x] Tapping a winner photo opens it enlarged in a lightbox (portal to `body`, previous/next buttons, ← → and Esc keys, backdrop click closes, page scroll locked, focus returns to the photo). (Issue #7)
- [x] `NumberGrid` no longer re-fetches in a loop (parent callback is stable).
- [x] Mobile (375px) has no horizontal scroll and the primary button is visible without scrolling past the hero text.

## 4. Technical Implementation
- `NumberGrid` passes a third argument `stats { total, available, taken }` to `onDataLoaded`; the parent stores it and feeds `RaffleProgress`. The parent callback is wrapped in `useCallback`.
- Filtering/search is computed with `useMemo` before pagination.
- `LuckySlot` prop `onTicketSelect(ticket)` becomes `onTicketsSelect(tickets[])`; extra numbers are picked without repeats from the available list.
- Confetti is pure CSS (keyframes in `globals.css`), disabled under `prefers-reduced-motion`.
- Winner photos are crops of the promo collage supplied by the raffle owner, served from `public/winners/`. Captions live in a typed constant in `WinnersStrip.tsx`. The raffle owner asks each winner for permission before taking the photos.
- Phase 2 (not here): `draw_date` countdown, prize fields and an admin-managed winners table.

## 5. Definition of Done
- [x] `npm run lint` (3 pre-existing errors in CheckoutModal and NumberGrid effect, none added)
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] `npm run test:e2e`
- [x] Acceptance criteria checked in this spec
- [x] `docs/product.md` updated if behavior changed
- [x] Changes committed, pushed to remote, merged to `main`, and linked GitHub issue/ticket closed
