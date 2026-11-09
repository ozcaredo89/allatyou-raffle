'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import NumberGrid from './components/raffle/NumberGrid';
import CheckoutModal from './components/raffle/CheckoutModal';
import LuckySlot from './components/raffle/LuckySlot';
import RaffleHero from './components/raffle/RaffleHero';
import HowItWorks from './components/raffle/HowItWorks';
import RaffleProgress, { type TicketStats } from './components/raffle/RaffleProgress';
import WinnersStrip from './components/raffle/WinnersStrip';
import PwaInstallButton from './components/PwaInstallButton';
import ShareRaffleModal from './components/raffle/ShareRaffleModal';

export interface ActiveRaffleSummary {
  id: string;
  name: string;
  slug: string | null;
  price_per_ticket: number;
  cover_image_url?: string | null;
  is_featured?: boolean | null;
}

interface MainClientPageProps {
  raffleId: string;
  raffleName: string;
  raffleDesc: string;
  price: number;
  startTicket?: number | null;
  endTicket?: number | null;
  coverImageUrl?: string;
  allRaffles?: ActiveRaffleSummary[];
  raffleSlug?: string | null;
}

export default function MainClientPage({
  raffleId,
  raffleName,
  raffleDesc,
  price,
  startTicket,
  endTicket,
  coverImageUrl,
  allRaffles,
  raffleSlug,
}: MainClientPageProps) {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [availableTickets, setAvailableTickets] = useState<string[]>([]);
  const [ticketDigits, setTicketDigits] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [stats, setStats] = useState<TicketStats | null>(null);

  const activeSlug = raffleSlug ?? allRaffles?.find(r => r.id === raffleId)?.slug ?? null;

  // Ocultar el botón global de WhatsApp cuando hay tickets seleccionados
  useEffect(() => {
    if (selectedTickets.length > 0) {
      document.body.classList.add('hide-whatsapp');
    } else {
      document.body.classList.remove('hide-whatsapp');
    }
    return () => document.body.classList.remove('hide-whatsapp');
  }, [selectedTickets.length]);

  // Stable identity: NumberGrid's fetch effect depends on this callback, so a new
  // function on every render would re-fetch in a loop.
  const handleDataLoaded = useCallback((tickets: string[], digits: number, ticketStats: TicketStats) => {
    setAvailableTickets(tickets);
    setTicketDigits(digits);
    setStats(ticketStats);
  }, []);

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

  // Add several numbers at once (Lucky Slot), skipping duplicates and respecting the cap.
  const handleTicketsAdd = (tickets: string[]) => {
    setSelectedTickets(prev => {
      const merged = [...prev];
      for (const t of tickets) {
        if (!merged.includes(t) && merged.length < 30) merged.push(t);
      }
      return merged;
    });
  };

  const closeModal = () => {
    setIsCheckoutOpen(false);
  };

  const onSuccess = () => {
    setSelectedTickets([]);
    setRefreshKey(prev => prev + 1);
    setIsCheckoutOpen(false);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const hasMultipleRaffles = Boolean(allRaffles && allRaffles.length > 1);
  const otherRaffles = allRaffles?.filter(r => r.id !== raffleId) ?? [];

  return (
    <div className="min-h-screen bg-[#0a0f16] font-sans selection:bg-emerald-500/30 text-white relative overflow-x-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />

      {/* Top Sticky Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full border-b border-emerald-500/20 bg-[#0a0f16]/90 backdrop-blur-xl px-3 py-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-2">
          {hasMultipleRaffles && allRaffles ? (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full shrink-0">
                🔥 {allRaffles.length} Sorteos
              </span>
              {allRaffles.map((r) => {
                const isCurrent = r.id === raffleId;
                const href = `/sorteos/${r.slug ?? r.id}`;
                return (
                  <Link
                    key={r.id}
                    href={href}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-bold transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-white/5 border border-white/15 text-zinc-200 hover:bg-white/15 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                    <span>{r.name}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Sorteos VIP Oficial</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 hover:text-white transition-all shrink-0 cursor-pointer"
              title="Compartir sorteo"
            >
              <span>📢</span>
              <span className="hidden xs:inline">Compartir</span>
            </button>
            <Link
              href="/sorteos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-xs font-bold text-indigo-300 hover:bg-indigo-500/25 hover:text-white transition-all shrink-0"
            >
              <span>Ver catálogo</span>
              <span>→</span>
            </Link>
            <PwaInstallButton variant="header" label="Instalar App" />
          </div>
        </div>
      </nav>

      {/* Hero: premio, precio y llamada a la acción */}
      <RaffleHero
        name={raffleName}
        description={raffleDesc}
        priceLabel={formatPrice(price)}
        coverImageUrl={coverImageUrl}
        ctaTargetId="elegir-numero"
        showWhatsappSupport={selectedTickets.length > 0}
      />

      <HowItWorks />
      <RaffleProgress stats={stats} />

      {/* Main Grid Area */}
      <main id="elegir-numero" className="relative mx-auto w-full max-w-4xl px-4 py-8 md:py-10 z-10 scroll-mt-16">

        {/* Lucky Slot Machine Area */}
        {ticketDigits > 0 && availableTickets.length > 0 && (
          <div className="mb-10 animate-[fadeIn_0.5s_ease-out]">
            <LuckySlot
              availableTickets={availableTickets}
              ticketDigits={ticketDigits}
              onTicketsSelect={(tickets) => {
                handleTicketsAdd(tickets);
                setIsCheckoutOpen(true);
              }}
            />
          </div>
        )}

        <div className="mb-10 -mx-4">
          <WinnersStrip />
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 md:p-8 backdrop-blur-sm shadow-2xl shadow-black/50">
          <NumberGrid
            raffle_id={raffleId}
            start_ticket={startTicket}
            end_ticket={endTicket}
            selectedTickets={selectedTickets}
            onTicketSelect={handleTicketSelect}
            onDataLoaded={handleDataLoaded}
            refreshTrigger={refreshKey}
          />
        </div>
      </main>

      {/* Social links + otros sorteos */}
      <footer className="relative z-10 border-t border-white/5 bg-[#0a0f16]/80 px-4 py-10 mb-24">
        <div className="mx-auto max-w-4xl flex flex-col items-center">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
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

        {otherRaffles.length > 0 && (
          <div className="w-full max-w-2xl mt-7 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-amber-300">
                🔥 Otros sorteos disponibles en este momento
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {otherRaffles.map((r) => (
                <Link
                  key={r.id}
                  href={`/sorteos/${r.slug ?? r.id}`}
                  className="group flex items-center justify-between gap-3 p-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#131c29] to-emerald-500/10 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {r.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.cover_image_url}
                        alt={r.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
                        🎫
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm md:text-base font-black text-white truncate group-hover:text-emerald-300 transition-colors">
                        {r.name}
                      </p>
                      <p className="text-xs font-bold text-emerald-400">
                        Boleta: {formatPrice(r.price_per_ticket)}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-xs font-black text-slate-950 group-hover:bg-emerald-400 transition-colors shrink-0 shadow-md">
                    Ver sorteo →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        </div>
      </footer>

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

      {/* Share Raffle Modal */}
      <ShareRaffleModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        raffleName={raffleName}
        raffleSlug={activeSlug}
        raffleId={raffleId}
      />
    </div>
  );
}
