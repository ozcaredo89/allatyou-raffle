'use client';

import { useState, useEffect } from 'react';
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

  // Ocultar el botón global de WhatsApp cuando hay tickets seleccionados
  useEffect(() => {
    if (selectedTickets.length > 0) {
      document.body.classList.add('hide-whatsapp');
    } else {
      document.body.classList.remove('hide-whatsapp');
    }
    return () => document.body.classList.remove('hide-whatsapp');
  }, [selectedTickets.length]);

  const handleDataLoaded = (tickets: string[], digits: number) => {
    setAvailableTickets(tickets);
    setTicketDigits(digits);
  };

  const handleTicketSelect = (ticket: string) => {
    setSelectedTickets(prev => {
      if (prev.includes(ticket)) return prev.filter(t => t !== ticket);
      if (prev.length >= 30) {
        alert('Solo puedes seleccionar un máximo de 30 tickets a la vez.');
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
            <span className="mr-2 text-lg">💎</span> Valor de la Boleta: {formatPrice(price)}
          </div>
        </div>

        {/* Dynamic Inline WhatsApp Button */}
        <div className={`transition-all duration-500 flex justify-center ${selectedTickets.length > 0 ? 'opacity-100 max-h-20 mt-6' : 'opacity-0 max-h-0 overflow-hidden'}`}>
           <a
              href="https://wa.me/573147369247?text=Quiero%20comprar%20la%20rifa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 text-sm font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
           >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              Soporte por WhatsApp
           </a>
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
        <div id="checkout-bar" className="fixed bottom-0 left-0 right-0 z-40 bg-[#141b26]/90 backdrop-blur-xl border-t border-emerald-500/20 p-4 md:p-6 shadow-[0_-10px_40px_rgba(52,211,153,0.1)] animate-[fadeInUp_0.3s_ease-out]">
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
