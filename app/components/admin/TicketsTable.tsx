'use client';

import { useState, useCallback, useMemo } from 'react';

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

  const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
    available: { bg: 'bg-zinc-500/10 border border-zinc-500/20', text: 'text-zinc-400', icon: '🎫' },
    reserved: { bg: 'bg-yellow-500/10 border border-yellow-500/20', text: 'text-yellow-400', icon: '⏳' },
    pending: { bg: 'bg-amber-500/10 border border-amber-500/20', text: 'text-amber-500', icon: '⚠️' },
    paid: { bg: 'bg-emerald-500/10 border border-emerald-500/20', text: 'text-emerald-400', icon: '💎' },
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
        <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
          <span className="text-sm font-bold text-blue-400">
            {selectedIds.size} boleta{selectedIds.size !== 1 ? 's' : ''} seleccionada{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setDeleteConfirm({ type: 'bulk' })}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all shadow-[0_0_10px_rgba(220,38,38,0.3)] hover:bg-red-500 hover:scale-105 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:scale-100"
          >
            🗑️ Eliminar Seleccionadas
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0f151f] shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#141b26] border-b border-white/5 text-xs uppercase tracking-widest text-zinc-500">
            <tr>
              <th className="w-12 px-6 py-4">
                <button
                  onClick={handleSelectAll}
                  className="rounded border border-white/20 p-1 hover:bg-white/10 transition-colors flex items-center justify-center w-6 h-6"
                  title={selectedIds.size === tickets.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                >
                  {selectedIds.size === tickets.length ? (
                    <span className="text-blue-400 font-bold text-xs">✓</span>
                  ) : null}
                </button>
              </th>
              <th className="px-6 py-4 font-bold">Ticket #</th>
              <th className="px-6 py-4 font-bold">Estado</th>
              <th className="px-6 py-4 font-bold">Reserva En</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedTickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleSelectTicket(ticket.id)}
                    disabled={editingId !== null}
                    className="rounded border border-white/20 p-1 hover:bg-white/10 disabled:opacity-50 transition-colors flex items-center justify-center w-6 h-6"
                  >
                    {selectedIds.has(ticket.id) ? (
                      <span className="text-blue-400 font-bold text-xs">✓</span>
                    ) : null}
                  </button>
                </td>

                {/* Ticket Number Cell */}
                <td className="px-6 py-4">
                  {editingId === ticket.id ? (
                    <input
                      type="text"
                      value={editValues.number}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, number: e.target.value }))}
                      className="w-full rounded-lg border border-blue-500/50 bg-[#0a0f16] px-3 py-1.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-400"
                      placeholder="Número"
                    />
                  ) : (
                    <span className="font-mono text-lg font-bold text-emerald-400">{ticket.ticket_number}</span>
                  )}
                </td>

                {/* Status Cell */}
                <td className="px-6 py-4">
                  {editingId === ticket.id ? (
                    <select
                      value={editValues.status}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, status: e.target.value }))}
                      className="rounded-lg border border-blue-500/50 bg-[#0a0f16] px-2 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="available">Disponible</option>
                      <option value="reserved">Reservado</option>
                      <option value="pending">Auditoría</option>
                      <option value="paid">Pagado</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColors[ticket.status]?.bg} ${statusColors[ticket.status]?.text}`}
                    >
                      <span className="text-sm">{statusColors[ticket.status]?.icon}</span>
                      {ticket.status === 'pending' ? 'Auditoría' : ticket.status === 'paid' ? 'Pagado' : ticket.status === 'reserved' ? 'Reservado' : 'Disponible'}
                    </span>
                  )}
                </td>

                {/* Reserved At Cell */}
                <td className="px-6 py-4 text-xs font-medium text-zinc-500">
                  {ticket.reserved_at ? new Date(ticket.reserved_at).toLocaleString('es-CO') : '—'}
                </td>

                {/* Actions Cell */}
                <td className="px-6 py-4 text-right">
                  {editingId === ticket.id ? (
                    <div className="flex justify-end gap-2">
                       <button
                        onClick={() => setEditingId(null)}
                        disabled={loading}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleEditSave(ticket.id)}
                        disabled={loading}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_10px_rgba(5,150,105,0.3)] hover:bg-emerald-500 hover:scale-105 transition-all disabled:bg-zinc-800 disabled:text-zinc-500 disabled:scale-100"
                      >
                        Guardar
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditStart(ticket)}
                        disabled={selectedIds.size > 0}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-colors disabled:opacity-50"
                        title="Editar"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'single', id: ticket.id })}
                        className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                        title="Eliminar"
                      >
                        🗑️ Borrar
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
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-12 text-center shadow-inner mt-4">
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No hay boletas disponibles</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f151f] shadow-[0_0_50px_rgba(220,38,38,0.2)] border border-red-500/20 overflow-hidden">
            <div className="border-b border-white/5 bg-red-500/10 p-5">
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span className="text-red-500">⚠️</span> Confirmar Eliminación
              </h3>
            </div>
            <div className="p-6">
              {deleteConfirm.type === 'bulk' ? (
                <p className="text-sm text-zinc-300 font-medium">
                  ¿Estás seguro de que deseas eliminar permanentemente <strong>{selectedIds.size}</strong> boleta{selectedIds.size !== 1 ? 's' : ''}? Esta acción <strong className="text-red-400">no se puede deshacer</strong>.
                </p>
              ) : (
                <p className="text-sm text-zinc-300 font-medium">
                  ¿Estás seguro de que deseas eliminar la boleta <strong className="text-white text-base">#{tickets.find((t) => t.id === deleteConfirm.id)?.ticket_number}</strong>? Esta acción <strong className="text-red-400">no se puede deshacer</strong>.
                </p>
              )}
            </div>
            <div className="border-t border-white/5 bg-[#141b26] flex justify-end gap-3 p-5">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancelar
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
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] hover:bg-red-500 hover:scale-[1.02] transition-all disabled:scale-100 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
              >
                {loading ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
