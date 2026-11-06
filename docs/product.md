# Product Overview: AllAtYou Raffle

## Core Workflow
1. **Public Catalog (`/sorteos`):**
   - Displays all active raffles.
   - Allows users to choose and enter any active raffle.
2. **Individual Raffle Page (`/sorteos/[slug]`):**
   - Displays raffle details, cover image, ticket price, and dynamic number grid.
   - Allows users to select tickets manually or generate random tickets via Lucky Slot.
   - Provides a checkout modal for reserving tickets and uploading payment proof.
   - Includes sharing tools (Native Web Share, WhatsApp direct message, and copy-link button) to maximize audience reach.
3. **Ticket Verification (`/verify`):**
   - Allows participants to check ticket status and retrieve issued ticket digital passes.
4. **Admin Management (`/admin/raffles`):**
   - List and filter raffles, toggle active/paused/featured states.
   - Direct shortcuts to copy public raffle links, open raffle view, edit tickets, and audit payments.
   - Ticket template management for ticket generation.
5. **Admin Payment Audit (`/admin/raffles/[id]/validate`):**
   - Review pending reservations, examine payment proofs, approve or reject tickets.
   - Access public raffle link for quick reference.
