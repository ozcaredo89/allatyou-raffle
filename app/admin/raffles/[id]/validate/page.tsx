'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ValidationTicket {
  id: string;
  ticket_number: string;
  status: 'available' | 'reserved' | 'pending' | 'paid';
  reserved_at: string | null;
  payment_proof_url: string | null;
  admin_notes?: string | null;
  customer_id?: string | null;
  customer?: {
    name: string;
    phone: string;
  } | null;
}

export default function ValidationPanelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: raffle_id } = use(params);

  const [tickets, setTickets] = useState<ValidationTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reserved' | 'paid'>('pending');

  const [notesState, setNotesState] = useState<Record<string, string>>({});
  const [editingCustomer, setEditingCustomer] = useState<{ticket_id: string; name: string; phone: string} | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);

    const { data: ticketsData, error: ticketsError } = await supabase
      .from('rafle_tickets')
      .select(`
        id,
        ticket_number,
        status,
        reserved_at,
        payment_proof_url,
        customer_id,
        admin_notes
      `)
      .eq('raffle_id', raffle_id)
      .neq('status', 'available')
      .order('ticket_number', { ascending: true });

    if (ticketsError) {
      setError('Error al cargar tickets');
      setLoading(false);
      return;
    }

    if (!ticketsData || ticketsData.length === 0) {
      setTickets([]);
      setLoading(false);
      return;
    }

    // Fetch customer data manually for the tickets
    const customerIds = Array.from(new Set(ticketsData.map(t => t.customer_id).filter(Boolean)));
    
    let customersMap: Record<string, any> = {};
    if (customerIds.length > 0) {
      const { data: customers } = await supabase
        .from('rafle_customers')
        .select('id, name, phone')
        .in('id', customerIds as string[]);
        
      if (customers) {
        customersMap = customers.reduce((acc, c) => ({ ...acc, [c.id]: c }), {});
      }
    }

    const merged = ticketsData.map(t => ({
      ...t,
      customer: t.customer_id ? customersMap[t.customer_id] : null,
    }));

    // Initialize notes state
    const initialNotes: Record<string, string> = {};
    merged.forEach(t => {
      initialNotes[t.id] = t.admin_notes || '';
    });
    setNotesState(initialNotes);

    setTickets(merged as ValidationTicket[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [raffle_id]);

  const handleAction = async (ticket_id: string, action: 'approve' | 'reject') => {
    if (!window.confirm(`¿Seguro que deseas ${action === 'approve' ? 'APROBAR' : 'RECHAZAR'} este ticket?`)) {
      return;
    }

    try {
      const res = await fetch('/api/raffles/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticket_id, 
          action,
          admin_notes: notesState[ticket_id]
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar la acción.');

      // Refresh list
      fetchTickets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveCustomer = async () => {
    if (!editingCustomer) return;
    
    try {
      const res = await fetch('/api/raffles/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticket_id: editingCustomer.ticket_id, 
          action: 'edit_customer',
          customer_name: editingCustomer.name,
          customer_phone: editingCustomer.phone
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar cliente.');

      setEditingCustomer(null);
      fetchTickets();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredTickets = tickets.filter(t => filter === 'all' ? true : t.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-4">
         <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-b-2 border-teal-400 animate-spin-reverse" />
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f16] p-4 md:p-8 font-sans text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/admin/raffles" className="text-emerald-500 hover:text-emerald-400 text-sm font-bold flex items-center gap-2 mb-2">
              ← Volver al Listado
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
              Panel de Validación
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Revisa comprobantes y aprueba pagos.</p>
          </div>
          
          <div className="flex bg-[#0f151f] border border-white/10 rounded-xl overflow-hidden p-1">
             {['pending', 'reserved', 'paid', 'all'].map(status => (
               <button 
                 key={status}
                 onClick={() => setFilter(status as any)}
                 className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${filter === status ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
               >
                 {status === 'pending' ? 'Por Validar' : status === 'reserved' ? 'Reservados' : status === 'paid' ? 'Pagados' : 'Todos'}
               </button>
             ))}
          </div>
        </div>

        {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 font-medium text-red-400">
              {error}
            </div>
        )}

        <div className="bg-[#0f151f] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-[#141b26] border-b border-white/5 text-xs uppercase tracking-widest text-zinc-500">
                 <tr>
                   <th className="px-6 py-4 font-bold">Ticket #</th>
                   <th className="px-6 py-4 font-bold">Cliente</th>
                   <th className="px-6 py-4 font-bold">Estado</th>
                   <th className="px-6 py-4 font-bold">Comprobante</th>
                   <th className="px-6 py-4 font-bold">Notas</th>
                   <th className="px-6 py-4 font-bold text-right">Acciones</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {filteredTickets.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium tracking-wide">
                       No hay tickets en este estado.
                     </td>
                   </tr>
                 ) : (
                   filteredTickets.map(ticket => (
                     <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors">
                       <td className="px-6 py-4">
                         <span className="font-mono text-lg font-bold text-emerald-400">
                           {ticket.ticket_number}
                         </span>
                       </td>
                       <td className="px-6 py-4">
                         <div className="font-bold text-white">{ticket.customer?.name || 'Desconocido'}</div>
                         <div className="text-zinc-500 text-xs mt-0.5">{ticket.customer?.phone || 'Sin WhatsApp'}</div>
                         <button onClick={() => setEditingCustomer({ticket_id: ticket.id, name: ticket.customer?.name || '', phone: ticket.customer?.phone || ''})} className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block font-semibold">✏️ Editar</button>
                       </td>
                       <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                           ticket.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                           ticket.status === 'reserved' ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' :
                           'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                         }`}>
                           {ticket.status}
                         </span>
                       </td>
                       <td className="px-6 py-4">
                         {ticket.payment_proof_url ? (
                           <a href={ticket.payment_proof_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-xs transition-colors">
                             <span className="text-base">📸</span> Ver Foto
                           </a>
                         ) : (
                           <span className="text-zinc-600 text-xs italic">Sin adjunto</span>
                         )}
                       </td>
                       <td className="px-6 py-4">
                         <input 
                           type="text" 
                           value={notesState[ticket.id] || ''}
                           onChange={(e) => setNotesState(prev => ({...prev, [ticket.id]: e.target.value}))}
                           placeholder="Notas admin..."
                           className="w-full min-w-[120px] bg-[#0a0f16] border border-white/10 rounded-md px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                         />
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           {ticket.status !== 'paid' && (
                             <button
                               onClick={() => handleAction(ticket.id, 'approve')}
                               className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                             >
                               ✓ Aprobar
                             </button>
                           )}
                           {ticket.status !== 'available' && (
                             <button
                               onClick={() => handleAction(ticket.id, 'reject')}
                               className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
                             >
                               ✕ Liberar
                             </button>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))
                 )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Modal de Edición de Cliente en Cascada */}
        {editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#0f151f] border border-white/10 p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Editar Cliente</h3>
              <p className="text-xs text-zinc-400 mb-4">Los cambios se reflejarán en todos los tickets reservados por este usuario.</p>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400">Nombre Completo</label>
                  <input type="text" value={editingCustomer.name} onChange={e => setEditingCustomer({...editingCustomer, name: e.target.value})} className="mt-1 w-full bg-[#0a0f16] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400">WhatsApp</label>
                  <input type="text" value={editingCustomer.phone} onChange={e => setEditingCustomer({...editingCustomer, phone: e.target.value})} className="mt-1 w-full bg-[#0a0f16] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500" />
                </div>
                
                <div className="flex items-center justify-end gap-3 mt-4">
                  <button onClick={() => setEditingCustomer(null)} className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                  <button onClick={handleSaveCustomer} className="px-5 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all">Guardar Cascada</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
