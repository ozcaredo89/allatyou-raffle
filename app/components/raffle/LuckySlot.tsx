'use client';

import { useState, useCallback } from 'react';

interface LuckySlotProps {
  availableTickets: string[];
  ticketDigits: number;
  onTicketSelect: (ticketNumber: string) => void;
}

export default function LuckySlot({ availableTickets, ticketDigits, onTicketSelect }: LuckySlotProps) {
  const [luckyNumber, setLuckyNumber] = useState<string | null>(null);
  const [spinningReels, setSpinningReels] = useState<boolean[]>(Array(ticketDigits).fill(false));
  const [showAction, setShowAction] = useState(false);

  // Generar un número aleatorio real para la ruleta visual de fondo (0-9)
  const renderStrip = () => {
    return Array.from({ length: 20 }).map((_, i) => (
      <div 
        key={i} 
        className="h-20 w-full flex items-center justify-center text-5xl font-black font-mono text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] leading-none"
      >
        {i % 10}
      </div>
    ));
  };

  const handleSpin = useCallback(() => {
    if (availableTickets.length === 0) {
      alert('No hay tickets disponibles para sortear.');
      return;
    }

    setShowAction(false);
    
    // Select the winning random ticket
    const randomIndex = Math.floor(Math.random() * availableTickets.length);
    const selectedTicket = availableTickets[randomIndex];
    setLuckyNumber(selectedTicket);

    // Start all reels spinning
    setSpinningReels(Array(ticketDigits).fill(true));

    // Stop them sequentially
    const STOP_BASE_TIME = 2000; // 2 seconds spin
    const STOP_DELAY = 300; // 300ms between each reel stop

    for (let i = 0; i < ticketDigits; i++) {
      setTimeout(() => {
        setSpinningReels(prev => {
          const newState = [...prev];
          newState[i] = false;
          return newState;
        });

        // If it's the last reel, show the action button
        if (i === ticketDigits - 1) {
          setTimeout(() => setShowAction(true), 400); // Wait a bit after last reel stops
        }
      }, STOP_BASE_TIME + (i * STOP_DELAY));
    }
  }, [availableTickets, ticketDigits]);

  const handleAction = () => {
    if (luckyNumber) {
      onTicketSelect(luckyNumber);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0f151f] p-6 shadow-[inset_0_0_40px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col items-center">
      
      {/* CSS Keyframes for the infinite rapid spin effect */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fastSlotSpin {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50rem); } /* 10 items * 5rem (h-20) */
        }
        .animate-slot-spin {
          animation: fastSlotSpin 0.3s linear infinite;
        }
      `}} />

      {/* Decorative ambient background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />

      <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-6 border-b border-white/5 pb-2 w-full text-center">
        Generador de la Suerte
      </h3>

      {/* REELS CONTAINER */}
      <div className="flex gap-2 sm:gap-4 mb-8">
        {Array.from({ length: ticketDigits }).map((_, i) => {
          const isSpinning = spinningReels[i];
          const targetDigit = luckyNumber ? luckyNumber[i] : '0';

          return (
            <div 
              key={i} 
              className="h-20 w-16 sm:w-20 rounded-xl bg-[#0a0f16] border border-white/10 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5),0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden"
            >
              {/* Overlay Glass */}
              <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0a0f16] via-transparent to-[#0a0f16] opacity-70 pointer-events-none" />
              
              {/* Inner Red Line (center alignment aid) */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-red-500/20 z-10 shadow-[0_0_5px_rgba(239,68,68,0.5)] pointer-events-none" />

              <div 
                className={`flex flex-col w-full absolute top-0 left-0 ${
                  isSpinning 
                    ? 'animate-slot-spin' 
                    : 'transition-transform duration-[600ms] ease-out'
                }`}
                style={
                  !isSpinning 
                    ? { transform: `translateY(-${parseInt(targetDigit) * 5}rem)` } // 5rem = h-20
                    : { animationDelay: `-${i * 0.15}s` } // Offset the start so they don't look identical
                }
              >
                {renderStrip()}
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTION CONTROLS */}
      <div className="min-h-[60px] flex items-center justify-center w-full relative z-20">
        {!showAction ? (
          <button 
            onClick={handleSpin}
            disabled={spinningReels.some(r => r)} // disabled if any reel is spinning
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 w-full md:w-auto overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
          >
            {/* Soft inner pulse when idle to draw attention */}
            {!spinningReels.some(r => r) && (
              <div className="absolute inset-0 z-0 bg-white/20 animate-pulse mix-blend-overlay"></div>
            )}
            <span className="relative z-10 text-xl">🎲</span>
            <span className="relative z-10">{spinningReels.some(r => r) ? 'Buscando tu suerte...' : 'Probar mi suerte'}</span>
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto mt-2">
            <button 
              onClick={handleAction}
              className="flex-1 group relative inline-flex items-center justify-center gap-2 px-6 py-4 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95 animate-[bounce_1s_infinite]"
            >
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10">✨ ¡Reservar el #{luckyNumber}!</span>
            </button>
            
            <button 
              onClick={handleSpin}
              className="sm:w-auto w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#0a0f16] border border-white/10 font-bold text-zinc-300 transition-all hover:bg-white/5 hover:text-white active:scale-95"
            >
              <span className="text-lg">🎲</span> Girar de nuevo
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
