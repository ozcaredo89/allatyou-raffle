# Tickets Management Features

## Overview
This feature allows administrators to manage and edit specific raffle tickets (boletas) in the admin panel.

## Features

### 1. **Editar Boletas** (Edit Tickets)
- View all tickets in a table format
- **Edit individual tickets**:
  - Change ticket number
  - Change ticket status (available, reserved, pending, paid)
- **Delete individual tickets**:
  - Remove a single ticket with confirmation
- **Bulk delete tickets**:
  - Select multiple tickets using checkboxes
  - Delete all selected tickets at once
  - Confirmation modal to prevent accidental deletions

## UI/UX Highlights

### Tickets Table
- Clean, modern table with alternating row colors
- Status badges with color coding:
  - 🔵 **Available** (Blue)
  - 🟡 **Reserved** (Yellow)
  - 🟠 **Pending** (Orange)
  - 🟢 **Paid** (Green)
- Checkbox selection for bulk operations
- Inline editing with save/cancel buttons
- Edit and delete action buttons

### Bulk Actions
- Select all / deselect all functionality
- Selected count indicator
- Bulk delete button that appears when items are selected
- Confirmation modal for bulk deletions

### Edit Modal
- Inline editing in the table
- Validation for ticket number (required)
- Status dropdown with 4 options
- Save and cancel buttons
- Error handling with user-friendly messages

## File Structure

```
app/
├── api/
│   └── raffles/
│       └── [id]/
│           ├── tickets/
│           │   ├── route.ts              # DELETE bulk tickets
│           │   └── [ticketId]/
│           │       └── route.ts          # PATCH and DELETE single ticket
│           └── ...
├── admin/
│   └── raffles/
│       ├── [id]/
│       │   ├── edit-tickets/
│       │   │   └── page.tsx              # Edit tickets page
│       │   ├── validate/
│       │   └── ...
│       ├── page.tsx                      # Updated with link button
│       └── ...
├── components/
│   └── admin/
│       └── TicketsTable.tsx              # Tickets management UI component
└── ...
```

## API Endpoints

### PATCH `/api/raffles/[id]/tickets/[ticketId]`
Edit a single ticket

**Request Body:**
```json
{
  "ticket_number": "123",
  "status": "paid"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "ticket_number": "123",
    "status": "paid",
    ...
  },
  "message": "Ticket updated successfully"
}
```

### DELETE `/api/raffles/[id]/tickets/[ticketId]`
Delete a single ticket

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "ticket_number": "123"
  },
  "message": "Ticket deleted successfully"
}
```

### DELETE `/api/raffles/[id]/tickets`
Delete multiple tickets

**Request Body:**
```json
{
  "ticketIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "data": [
    { "id": "uuid1", "ticket_number": "123" },
    { "id": "uuid2", "ticket_number": "124" }
  ],
  "message": "2 ticket(s) deleted successfully"
}
```

## How to Use

1. **Access Admin Panel**: Navigate to `/admin/raffles`
2. **Select a Raffle**: Find the raffle you want to manage
3. **Click "🎫 Editar Boletas"**: Opens the ticket management page
4. **Edit or Delete**:
   - **Individual Edit**: Click the edit icon (pencil), modify values, click save
   - **Individual Delete**: Click the delete icon (trash)
   - **Bulk Delete**: Select tickets with checkboxes, click "Delete Selected", confirm

## Notes

- ✅ No restrictions: Admins can edit/delete any ticket, even if reserved or paid
- ✅ Only applies to "specific" type raffles (not range-based)
- ✅ Inline editing for better UX
- ✅ Confirmation modals prevent accidental deletions
- ✅ Real-time UI updates after operations
- ✅ Error handling with user-friendly messages

## Technologies Used

- **React 19** - UI component library
- **Next.js 16** - Full-stack framework
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **Supabase** - Database
