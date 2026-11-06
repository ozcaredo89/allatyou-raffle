# Spec: 0001-share-raffle-links

- **Issue:** Closes #1
- **Status:** Completed
- **Created:** 2026-11-06

## 1. Objective
Add quick and intuitive sharing actions for raffles both on the public client page (`/sorteos/[slug]`) and the admin dashboard (`/admin/raffles` and `/admin/raffles/[id]/validate`). This increases ticket dissemination speed by allowing users to share natively or via WhatsApp, and admins to copy the exact public link with one click.

## 2. In-Scope Files
*Touch ONLY the files explicitly listed below:*
- `.gitignore`
- `package.json`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `docs/specs/TEMPLATE.md`
- `docs/specs/0001-share-raffle-links.md`
- `docs/product.md`
- `app/components/raffle/ShareRaffleModal.tsx`
- `app/MainClientPage.tsx`
- `app/sorteos/[slug]/page.tsx`
- `app/admin/raffles/page.tsx`
- `app/admin/raffles/[id]/validate/page.tsx`

## 3. Acceptance Criteria
- [x] Public raffle page has a prominent "Compartir" button that triggers native Web Share if available or opens a dedicated Share Modal.
- [x] Share Modal on public page provides:
  - Direct WhatsApp sharing with pre-formatted message including raffle name and URL.
  - Direct "Copiar Enlace" button with immediate visual feedback ("¡Copiado!").
  - Native Web Share trigger button for supported devices.
- [x] Admin raffles list (`/admin/raffles`) features a quick "Copiar enlace" and "Ver sorteo" action per raffle card with copy feedback.
- [x] Admin payment validation page (`/admin/raffles/[id]/validate`) features a quick link to open/copy the public raffle link.
- [x] Clean, concise, modern UI matching the dark casino/VIP aesthetic of the application.

## 4. Technical Implementation
- Create reusable `ShareRaffleModal.tsx` for client-side sharing interaction.
- Integrate share trigger button in `MainClientPage.tsx` near the social buttons / header.
- Add copy-to-clipboard button and external view button in each raffle card of `app/admin/raffles/page.tsx`.
- Add copy link & view raffle actions in `app/admin/raffles/[id]/validate/page.tsx`.
- Use `navigator.clipboard.writeText` with graceful fallback (`document.execCommand`).

## 5. Definition of Done
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] `npm run build`
- [x] `npm run test:e2e`
- [x] Acceptance criteria checked in this spec
- [x] `docs/product.md` updated if behavior changed
