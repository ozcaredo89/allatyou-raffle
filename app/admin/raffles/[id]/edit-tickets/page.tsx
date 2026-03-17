'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-blue-900 to-zinc-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <p className="text-white mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-blue-900 to-zinc-900 p-6">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/admin/raffles"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Raffles
          </Link>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
            <p>{error || 'Rifa no encontrada'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-blue-900 to-zinc-900 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/raffles"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Raffles
          </Link>

          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl">
            <h1 className="text-3xl font-black text-white mb-2">{raffle.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-zinc-400">Total Tickets</span>
                <p className="text-xl font-bold text-blue-400">{raffle.total_tickets}</p>
              </div>
              {raffle.start_ticket && raffle.end_ticket && (
                <div>
                  <span className="text-zinc-400">Range</span>
                  <p className="text-xl font-bold text-blue-400">
                    {raffle.start_ticket} - {raffle.end_ticket}
                  </p>
                </div>
              )}
              <div>
                <span className="text-zinc-400">Status</span>
                <p className={`text-xl font-bold ${raffle.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {raffle.status.charAt(0).toUpperCase() + raffle.status.slice(1)}
                </p>
              </div>
              <div>
                <span className="text-zinc-400">Tickets Count</span>
                <p className="text-xl font-bold text-purple-400">{tickets.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Manage Tickets</h2>
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
