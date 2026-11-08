# Spec: 0003-ios-ticket-download

- **Issue:** Closes #3
- **Status:** Completed
- **Created:** 2026-11-08

## 1. Objective
Fix the ticket download for iPhone/iPad users, who could not save their ticket image because `<a download>` with a `data:` URL is not honored by iOS Safari and is blocked in in-app browsers (WhatsApp, Instagram, Facebook). Also ship the ticket template for the Suzuki DR-160X raffle, draw the ticket number much larger on every downloaded ticket, and show "Jerson Franco" (instead of "Sorteos Premium VIP"), a ticket-themed icon (instead of the default Vercel/Next one) and a preview image when the link is shared.

## 2. In-Scope Files
*Touch ONLY the files explicitly listed below:*
- `app/components/raffle/TicketDownloadButton.tsx`
- `public/ticket-template-suzuki.png`
- `app/layout.tsx`
- `app/manifest.ts`
- `app/favicon.ico`
- `public/manifest.webmanifest`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/icon-512-maskable.png`
- `public/apple-touch-icon.png`
- `public/icon.svg` (removed)
- `public/og-image.jpg`
- `docs/specs/0003-ios-ticket-download.md`
- `docs/product.md`

## 3. Acceptance Criteria
- [x] On iOS, "Descargar Boleta" opens the native share sheet with the ticket PNG so it can be saved to Photos.
- [x] On iOS without Web Share file support, a modal shows the ticket with a "long-press to save" hint.
- [x] Android and desktop keep downloading `Boleta_Sorteo_<N>.png`.
- [x] The Suzuki template is 1536x2752 and uses the same field coordinates as the default template (no drawing code changes).
- [x] The ticket number is drawn on a plate over the template's "TICKET N°" box at up to 118px (was 70px), shrinking automatically for long numbers; works on the default, Suzuki and older templates.
- [x] Shared links show "Jerson Franco" as title and site name (`<title>`, `og:title`, `og:site_name`).
- [x] Favicon and app icons (favicon.ico, 192/512, maskable, apple-touch) match the ticket art (Suzuki on blue starry sky with gold border) instead of the default Next/Vercel icon; shared links get a 1200x630 preview image (`og-image.jpg`).
- [ ] Verified on a real iPhone (Safari and WhatsApp in-app browser) after deploy.

## 4. Technical Implementation
- Detect iOS in an effect (`iPhone|iPad|iPod` or `MacIntel` with touch points).
- Build the PNG `Blob` when the preview is generated and keep it in a ref, so `navigator.share({ files })` runs inside the user gesture.
- iOS: `navigator.canShare({ files })` then `navigator.share`; ignore `AbortError`; otherwise open the save-help modal.
- Other platforms: download through a `blob:` URL (revoked after 10s) instead of a `data:` URL.
- Template uploaded to R2 under `raffle-templates/{raffle_id}` (served by `/api/raffles/[id]/ticket-template`).

## 5. Definition of Done
- [x] `npm run lint` (13 pre-existing errors on `main`, none added or in touched files)
- [x] `npm run typecheck`
- [x] `npm test` (no unit tests configured)
- [x] `npm run build`
- [x] `npm run test:e2e` (no e2e tests configured)
- [x] Acceptance criteria checked in this spec (real-device check pending)
- [x] `docs/product.md` updated if behavior changed
