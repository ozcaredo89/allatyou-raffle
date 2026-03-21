'use client';

import { useState } from 'react';
import NumberGrid from './components/raffle/NumberGrid';
import CheckoutModal from './components/raffle/CheckoutModal';
import LuckySlot from './components/raffle/LuckySlot';

interface MainClientPageProps {
  raffleId: string;
  raffleName: string;
  raffleDesc: string;
  price: number;
  startTicket?: number | null;
  endTicket?: number | null;
}

export default function MainClientPage({
  raffleId,
  raffleName,
  raffleDesc,
  price,
  startTicket,
  endTicket,
}: MainClientPageProps) {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [availableTickets, setAvailableTickets] = useState<string[]>([]);
  const [ticketDigits, setTicketDigits] = useState<number>(0);

  const handleDataLoaded = (tickets: string[], digits: number) => {
    setAvailableTickets(tickets);
    setTicketDigits(digits);
  };

  const handleTicketSelect = (ticket: string) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticket)) return prev.filter(t => t !== ticket);
      if (prev.length >= 10) {
        alert('Solo puedes seleccionar un máximo de 10 tickets a la vez.');
        return prev;
      }
      return [...prev, ticket];
    });
  };

  const closeModal = () => {
    setIsCheckoutOpen(false);
  };

  const onSuccess = () => {
    setSelectedTickets([]);
    setIsCheckoutOpen(false);
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
      <main className="relative mx-auto w-full max-w-4xl px-4 py-8 md:py-12 z-10 mb-20">
        
        {/* Lucky Slot Machine Area */}
        {ticketDigits > 0 && availableTickets.length > 0 && (
          <div className="mb-12 animate-[fadeIn_0.5s_ease-out]">
            <LuckySlot 
              availableTickets={availableTickets} 
              ticketDigits={ticketDigits} 
              onTicketSelect={(ticket) => {
                if (!selectedTickets.includes(ticket)) {
                   handleTicketSelect(ticket);
                }
                setIsCheckoutOpen(true);
              }} 
            />
          </div>
        )}

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-8 backdrop-blur-sm shadow-2xl shadow-black/50">
          <NumberGrid
            raffle_id={raffleId}
            start_ticket={startTicket}
            end_ticket={endTicket}
            selectedTickets={selectedTickets}
            onTicketSelect={handleTicketSelect}
            onDataLoaded={handleDataLoaded}
          />
        </div>
      </main>

      {/* Floating Checkout Bar */}
      {selectedTickets.length > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#141b26]/90 backdrop-blur-xl border-t border-emerald-500/20 p-4 md:p-6 shadow-[0_-10px_40px_rgba(52,211,153,0.1)] animate-[fadeInUp_0.3s_ease-out]">
           <div className="mx-auto max-w-4xl flex justify-between items-center px-2">
             <div className="flex flex-col">
               <span className="text-[10px] md:text-sm text-zinc-400 uppercase tracking-widest font-bold">{selectedTickets.length} Seleccionado(s)</span>
               <span className="text-xl md:text-2xl font-black text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{formatPrice(selectedTickets.length * price)}</span>
             </div>
             <button 
               onClick={() => setIsCheckoutOpen(true)} 
               className="px-6 py-3 md:px-8 md:py-4 bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)] rounded-xl font-black tracking-wide text-white scale-95 hover:scale-100 active:scale-95"
             >
                Comprar Ahora →
             </button>
           </div>
        </div>
      )}

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={closeModal}
        ticketNumbers={selectedTickets}
        raffleId={raffleId}
        raffleName={raffleName}
        totalPrice={selectedTickets.length * price}
        onSuccess={onSuccess}
      />
    </div>
  );
}
