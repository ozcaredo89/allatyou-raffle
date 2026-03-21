'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TicketStatus = 'available' | 'reserved' | 'pending' | 'paid';

interface RafleTicket {
  ticket_number: string;
  status: TicketStatus;
}

interface TicketStatusMap {
  [ticket_number: string]: TicketStatus;
}

interface NumberGridProps {
  raffle_id: string;
  start_ticket?: number | null;
  end_ticket?: number | null;
  selectedTickets: string[];
  onTicketSelect?: (ticketNumber: string) => void;
  onDataLoaded?: (availableTickets: string[], ticketDigits: number) => void;
}

// ---------------------------------------------------------------------------
// Supabase client (browser-safe, public anon key)
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Removed helper since we rely on fetched numbers decorators

function statusToStyle(status: TicketStatus | undefined): string {
  switch (status) {
    case 'reserved':
    case 'pending':
      return 'bg-amber-500/20 border border-amber-500/50 text-amber-400 cursor-not-allowed shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    case 'paid':
      return 'bg-red-500/10 border border-red-500/30 text-red-500/50 cursor-not-allowed';
    case 'available':
    default:
      return 'bg-[#0f151f] border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 hover:text-white hover:scale-110 hover:z-10 cursor-pointer shadow-[0_0_15px_rgba(52,211,153,0.05)] hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all duration-200';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NumberGrid({
  raffle_id,
  selectedTickets,
  onTicketSelect,
  onDataLoaded,
}: NumberGridProps) {
  const [statusMap, setStatusMap] = useState<TicketStatusMap>({});
  const [allTicketNumbers, setAllTicketNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  const total_tickets = allTicketNumbers.length || Number.MAX_SAFE_INTEGER; // Will settle after fetch
  const totalPages = Math.ceil(allTicketNumbers.length / itemsPerPage);

  const fetchTickets = useCallback(async () => {
    // Paginate to handle large ticket counts (Supabase default limit = 1000)
    const PAGE_SIZE = 1000;
    let allTickets: RafleTicket[] = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error: fetchError } = await supabase
        .from('rafle_tickets')
        .select('ticket_number, status')
        .eq('raffle_id', raffle_id)
        .range(from, from + PAGE_SIZE - 1);

      if (fetchError) {
        setError('Error loading ticket grid. Please try again.');
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        allTickets = allTickets.concat(data as RafleTicket[]);
        from += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    const map: TicketStatusMap = {};
    const numbers: string[] = [];
    
    for (const ticket of allTickets) {
      map[ticket.ticket_number] = ticket.status;
      numbers.push(ticket.ticket_number);
    }

    // Sort naturally so 01, 02, 10 are in order
    numbers.sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (isNaN(numA) || isNaN(numB)) return a.localeCompare(b);
      return numA - numB;
    });

    setStatusMap(map);
    setAllTicketNumbers(numbers);
    setLoading(false);
    setError(null);

    // Provide available tickets to parent (e.g. for LuckySlot)
    if (onDataLoaded && numbers.length > 0) {
      const available = numbers.filter(n => (map[n] || 'available') === 'available');
      const digits = numbers[0].length;
      onDataLoaded(available, digits);
    }
  }, [raffle_id, onDataLoaded]);

  // Initial fetch + polling every 30 seconds for live updates
  useEffect(() => {
    void fetchTickets();

    const intervalId = setInterval(() => {
      void fetchTickets();
    }, 30_000);

    return () => clearInterval(intervalId);
  }, [fetchTickets]);

  // Real-time subscription via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`rafle_tickets:raffle_id=eq.${raffle_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rafle_tickets',
          filter: `raffle_id=eq.${raffle_id}`,
        },
        (payload) => {
          const updated = payload.new as RafleTicket;
          if (updated?.ticket_number && updated?.status) {
            setStatusMap((prev) => {
              const newMap = {
                ...prev,
                [updated.ticket_number]: updated.status,
              };
              
              // Recalculate and emit available tickets on realtime update
              if (onDataLoaded && allTicketNumbers.length > 0) {
                 const available = allTicketNumbers.filter(n => (newMap[n] || 'available') === 'available');
                 const digits = allTicketNumbers[0].length;
                 onDataLoaded(available, digits);
              }
              
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [raffle_id, allTicketNumbers, onDataLoaded]);

  const handleTicketClick = (ticketNumber: string, status: TicketStatus | undefined) => {
    if (status && status !== 'available') return;
    onTicketSelect?.(ticketNumber);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-b-2 border-teal-400 animate-spin-reverse" />
            <span className="text-xl">💎</span>
          </div>
          <p className="text-sm font-bold tracking-widest text-emerald-500/70 animate-pulse uppercase">Cargando Sorteo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <span className="text-3xl mb-2 block">⚠️</span>
          <p className="font-bold text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-6 text-xs font-bold uppercase tracking-wider">
        <span className="flex items-center gap-2 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Disponible
        </span>
        <span className="flex items-center gap-2 text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
          Reservado
        </span>
        <span className="flex items-center gap-2 text-red-500/50">
          <span className="inline-block h-3 w-3 rounded-full bg-red-500/50" />
          Pagado
        </span>
      </div>

      {/* Grid */}
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
        }}
      >
        {allTicketNumbers
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((ticketNumber) => {
            const status = statusMap[ticketNumber] || 'available';
            const isDisabled = status !== 'available';
            const isSelected = selectedTickets.includes(ticketNumber) && status === 'available';

            return (
              <button
                key={ticketNumber}
                type="button"
                disabled={isDisabled}
                aria-label={`Número ${ticketNumber} — ${status ?? 'available'}`}
                onClick={() => handleTicketClick(ticketNumber, status)}
                className={[
                  'relative rounded-xl px-2 py-4 text-sm md:text-base font-black text-center tracking-wider overflow-hidden group transition-all duration-300',
                  isSelected 
                    ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#0f151f] scale-105 z-20 bg-emerald-500/20 text-white shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                    : statusToStyle(status),
                ].join(' ')}
              >
                <span className="relative z-10">{ticketNumber}</span>
                {status === 'available' && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-white/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                )}
              </button>
            );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d131c] px-5 py-3 text-sm font-bold text-zinc-300 transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>←</span> Anterior
          </button>
          
          <span className="text-sm font-bold text-zinc-500">
            Página <strong className="text-white">{currentPage}</strong> de {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d131c] px-5 py-3 text-sm font-bold text-zinc-300 transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
