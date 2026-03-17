'use client';

import { useState, useCallback, useMemo } from 'react';
import { Trash2, Edit2, AlertCircle, CheckCircle2, Clock, CheckSquare, Square } from 'lucide-react';

interface Ticket {
  id: string;
  raffle_id: string;
  ticket_number: string;
  status: 'available' | 'reserved' | 'pending' | 'paid';
  customer_id: string | null;
  payment_proof_url: string | null;
  reserved_at: string | null;
  admin_notes: string | null;
}

interface TicketsTableProps {
  raffleId: string;
  tickets: Ticket[];
  onTicketsUpdated: () => void;
}

export default function TicketsTable({ raffleId, tickets: initialTickets, onTicketsUpdated }: TicketsTableProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ number: string; status: string }>({ number: '', status: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);

  const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
    available: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: <Square className="w-4 h-4" /> },
    reserved: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', icon: <Clock className="w-4 h-4" /> },
    pending: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', icon: <AlertCircle className="w-4 h-4" /> },
    paid: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', icon: <CheckCircle2 className="w-4 h-4" /> },
  };

  const handleSelectAll = () => {
    if (selectedIds.size === tickets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tickets.map((t) => t.id)));
    }
  };

  const handleSelectTicket = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleEditStart = (ticket: Ticket) => {
    setEditingId(ticket.id);
    setEditValues({ number: ticket.ticket_number, status: ticket.status });
    setError(null);
  };

  const handleEditSave = useCallback(
    async (ticketId: string) => {
      if (!editValues.number.trim()) {
        setError('Ticket number is required');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/raffles/${raffleId}/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_number: editValues.number.trim(),
            status: editValues.status,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update ticket');

        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ...data.data } : t))
        );
        setEditingId(null);
        onTicketsUpdated();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [editValues, raffleId, onTicketsUpdated]
  );

  const handleDeleteSingle = useCallback(
    async (ticketId: string) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/raffles/${raffleId}/tickets/${ticketId}`, {
          method: 'DELETE',
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete ticket');

        setTickets((prev) => prev.filter((t) => t.id !== ticketId));
        setDeleteConfirm(null);
        onTicketsUpdated();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [raffleId, onTicketsUpdated]
  );

  const handleDeleteBulk = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/raffles/${raffleId}/tickets`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds: Array.from(selectedIds) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete tickets');

      setTickets((prev) => prev.filter((t) => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
      setDeleteConfirm(null);
      onTicketsUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedIds, raffleId, onTicketsUpdated]);

  const sortedTickets = useMemo(
    () => tickets.sort((a, b) => a.ticket_number.localeCompare(b.ticket_number, undefined, { numeric: true })),
    [tickets]
  );

  return (
    <div className="w-full">
      {/* Error Alert */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            {selectedIds.size} ticket{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={() => setDeleteConfirm({ type: 'bulk' })}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <button
                  onClick={handleSelectAll}
                  className="rounded border border-zinc-300 dark:border-zinc-600 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  title={selectedIds.size === tickets.length ? 'Deselect all' : 'Select all'}
                >
                  {selectedIds.size === tickets.length ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-300">Ticket #</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-300">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700 dark:text-zinc-300">Reserved At</th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-700 dark:text-zinc-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {sortedTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleSelectTicket(ticket.id)}
                    disabled={editingId !== null}
                    className="rounded border border-zinc-300 dark:border-zinc-600 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {selectedIds.has(ticket.id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </td>

                {/* Ticket Number Cell */}
                <td className="px-4 py-3">
                  {editingId === ticket.id ? (
                    <input
                      type="text"
                      value={editValues.number}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, number: e.target.value }))}
                      className="w-full rounded border border-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-sm font-mono font-medium text-zinc-900 dark:text-white"
                      placeholder="Ticket number"
                    />
                  ) : (
                    <span className="font-mono font-semibold text-zinc-900 dark:text-white">{ticket.ticket_number}</span>
                  )}
                </td>

                {/* Status Cell */}
                <td className="px-4 py-3">
                  {editingId === ticket.id ? (
                    <select
                      value={editValues.status}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, status: e.target.value }))}
                      className="rounded border border-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusColors[ticket.status]?.bg} ${statusColors[ticket.status]?.text}`}
                    >
                      {statusColors[ticket.status]?.icon}
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                  )}
                </td>

                {/* Reserved At Cell */}
                <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {ticket.reserved_at ? new Date(ticket.reserved_at).toLocaleString() : '—'}
                </td>

                {/* Actions Cell */}
                <td className="px-4 py-3 text-right">
                  {editingId === ticket.id ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditSave(ticket.id)}
                        disabled={loading}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:bg-green-400"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={loading}
                        className="rounded bg-zinc-400 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-500 disabled:bg-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditStart(ticket)}
                        disabled={selectedIds.size > 0}
                        className="rounded bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:bg-zinc-300"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'single', id: ticket.id })}
                        className="rounded bg-red-600 p-2 text-white hover:bg-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* No Tickets */}
      {tickets.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-8 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No tickets found</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-lg bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Confirm Delete</h3>
            </div>
            <div className="p-6">
              {deleteConfirm.type === 'bulk' ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Are you sure you want to delete <strong>{selectedIds.size}</strong> ticket{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
                </p>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Are you sure you want to delete ticket <strong>{tickets.find((t) => t.id === deleteConfirm.id)?.ticket_number}</strong>? This action cannot be undone.
                </p>
              )}
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 p-6">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'bulk') {
                    handleDeleteBulk();
                  } else {
                    handleDeleteSingle(deleteConfirm.id!);
                  }
                }}
                disabled={loading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-400"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
