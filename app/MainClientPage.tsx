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
          <p className="max-w-md text-sm md:text-base font-medium text-zinc-400 mb-4">
            {raffleDesc}
          </p>
        )}

        {/* Social Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-7">
          <a href="https://www.instagram.com/jersonfranco_?igsh=a3RsamZqcHVtMG9y&utm_source=qr" target="_blank" rel="noopener noreferrer" 
             className="flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 px-4 py-2 text-sm font-bold text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.15)] hover:from-pink-500 hover:to-purple-600 hover:text-white transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(236,72,153,0.4)]" aria-label="Instagram">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
            </svg>
            <span>Instagram</span>
          </a>
          <a href="https://www.facebook.com/share/1Bbt45tAXQ/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" 
             className="flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/30 px-4 py-2 text-sm font-bold text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:bg-blue-600 hover:text-white transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]" aria-label="Facebook">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
            </svg>
            <span>Facebook</span>
          </a>
        </div>
        
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
