'use client';

import { useState } from 'react';
import NumberGrid from './components/raffle/NumberGrid';
import CheckoutModal from './components/raffle/CheckoutModal';

interface MainClientPageProps {
  raffleId: string;
  raffleName: string;
  raffleDesc: string;
  price: number;
  startTicket: number;
  endTicket: number;
}

export default function MainClientPage({
  raffleId,
  raffleName,
  raffleDesc,
  price,
  startTicket,
  endTicket,
}: MainClientPageProps) {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  const handleTicketSelect = (ticket: string) => {
    setSelectedTicket(ticket);
  };

  const closeModal = () => {
    setSelectedTicket(null);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] font-sans selection:bg-emerald-500/30 text-white relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />

      {/* Header Premium Casino Style */}
      <header className="sticky top-0 z-30 flex flex-col items-center justify-center border-b border-white/5 bg-[#0a0f16]/80 px-4 py-8 text-center backdrop-blur-xl supports-[backdrop-filter]:bg-[#0a0f16]/60">
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-emerald-500/50"></span>
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Sorteo Activo</span>
          <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-emerald-500/50"></span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
          {raffleName}
        </h1>
        
        {raffleDesc && (
          <p className="max-w-md text-sm md:text-base font-medium text-zinc-400 mb-5">
            {raffleDesc}
          </p>
        )}
        
        <div className="relative group cursor-default">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 opacity-30 group-hover:opacity-50 blur transition duration-500"></div>
          <div className="relative inline-flex items-center rounded-full bg-[#111823] border border-white/10 px-6 py-2.5 text-sm md:text-base font-bold text-emerald-300 shadow-2xl">
            <span className="mr-2 text-lg">💎</span> Valor del Ticket: {formatPrice(price)}
          </div>
        </div>
      </header>

      {/* Main Grid Area */}
      <main className="relative mx-auto w-full max-w-4xl px-4 py-8 md:py-12 z-10">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-8 backdrop-blur-sm shadow-2xl shadow-black/50">
          <NumberGrid
            raffle_id={raffleId}
            start_ticket={startTicket}
            end_ticket={endTicket}
            onTicketSelect={handleTicketSelect}
          />
        </div>
      </main>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={selectedTicket !== null}
        onClose={closeModal}
        ticketNumber={selectedTicket || ''}
        raffleId={raffleId}
        onSuccess={() => {
          // Success action handled in modal
        }}
      />
    </div>
  );
}
