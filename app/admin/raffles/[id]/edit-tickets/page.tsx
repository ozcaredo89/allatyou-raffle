'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TicketsTable from '@/app/components/admin/TicketsTable';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

interface Raffle {
  id: string;
  name: string;
  total_tickets: number;
  start_ticket: number | null;
  end_ticket: number | null;
  status: string;
}

interface EditTicketsPageProps {
  params: Promise<{ id: string }>;
}

export default function EditTicketsPage({ params }: EditTicketsPageProps) {
  const [raffleId, setRaffleId] = useState<string>('');
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      const { id } = await params;
      setRaffleId(id);

      try {
        // Obtener información de la rifa
        const { data: raffleData, error: raffleError } = await supabase
          .from('rafle_raffles')
          .select('id, name, total_tickets, start_ticket, end_ticket, status')
          .eq('id', id)
          .maybeSingle();

        if (raffleError || !raffleData) {
          setError('Rifa no encontrada');
          return;
        }

        setRaffle(raffleData);

        // Obtener las boletas
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('rafle_tickets')
          .select('id, raffle_id, ticket_number, status, customer_id, payment_proof_url, reserved_at, admin_notes')
          .eq('raffle_id', id)
          .order('ticket_number', { ascending: true });

        if (ticketsError) {
          console.error('Error fetching tickets:', ticketsError);
          setError('Error cargando las boletas');
        } else {
          setTickets(ticketsData || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [params]);

  const handleTicketsUpdated = () => {
    // Recargar las boletas después de una actualización
    const refetchTickets = async () => {
      if (!raffleId) return;
      
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('rafle_tickets')
        .select('id, raffle_id, ticket_number, status, customer_id, payment_proof_url, reserved_at, admin_notes')
        .eq('raffle_id', raffleId)
        .order('ticket_number', { ascending: true });

      if (!ticketsError) {
        setTickets(ticketsData || []);
      }
    };

    refetchTickets();
  };

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

  if (error || !raffle) {
    return (
      <div className="min-h-screen bg-[#0a0f16] p-4 md:p-8 font-sans text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/admin/raffles"
            className="text-emerald-500 hover:text-emerald-400 text-sm font-bold flex items-center gap-2 mb-6"
          >
            ← Volver al Listado
          </Link>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400 font-bold shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <p>{error || 'Rifa no encontrada'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f16] p-4 md:p-8 font-sans text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/raffles"
            className="text-emerald-500 hover:text-emerald-400 text-sm font-bold flex items-center gap-2 mb-4"
          >
            ← Volver al Listado
          </Link>

          <div className="rounded-2xl border border-white/5 bg-[#0f151f] p-6 shadow-xl mb-6">
            <h1 className="text-3xl font-black text-white mb-6 tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">{raffle.name}</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Total Boletas</span>
                <p className="text-xl font-bold text-white mt-1">{raffle.total_tickets}</p>
              </div>
              {raffle.start_ticket !== null && raffle.end_ticket !== null ? (
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Rango Segmentado</span>
                  <p className="font-mono text-xl font-bold text-blue-400 mt-1">
                    {raffle.start_ticket} - {raffle.end_ticket}
                  </p>
                </div>
              ) : (
                <div>
                   <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Tipo de Rifa</span>
                   <p className="text-xl font-bold text-blue-400 mt-1">
                     Núm. Específicos
                   </p>
                 </div>
              )}
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Estado General</span>
                <p className={`text-xl font-bold mt-1 ${raffle.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {raffle.status.charAt(0).toUpperCase() + raffle.status.slice(1)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Boletas Generadas</span>
                <p className="text-xl font-bold text-fuchsia-400 mt-1">{tickets.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="rounded-2xl border border-white/5 bg-[#0f151f] p-6 shadow-xl">
          <h2 className="text-xl font-black text-white mb-6">Administrador Maestro de Boletas</h2>
          <TicketsTable
            raffleId={raffleId}
            tickets={tickets}
            onTicketsUpdated={handleTicketsUpdated}
          />
        </div>
      </div>
    </div>
  );
}
