'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface LuckySlotProps {
  availableTickets: string[];
  ticketDigits: number;
  onTicketsSelect: (ticketNumbers: string[]) => void;
}

const QUANTITIES = [1, 2, 3, 5];
const CONFETTI_COLORS = ['#34d399', '#2dd4bf', '#fbbf24', '#f472b6', '#818cf8', '#ffffff'];

// Deterministic pseudo-random so the confetti layout is stable across renders.
const CONFETTI = Array.from({ length: 28 }).map((_, i) => {
  const angle = (i / 28) * Math.PI * 2;
  const dist = 120 + ((i * 37) % 90);
  return {
    cx: Math.round(Math.cos(angle) * dist),
    cy: Math.round(Math.sin(angle) * dist) + 60,
    cr: (i % 2 === 0 ? 1 : -1) * (180 + ((i * 53) % 360)),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: (i % 5) * 0.03,
  };
});

function pickDistinct(pool: string[], count: number): string[] {
  const copy = [...pool];
  const out: string[] = [];
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export default function LuckySlot({ availableTickets, ticketDigits, onTicketsSelect }: LuckySlotProps) {
  const [quantity, setQuantity] = useState(1);
  const [luckyNumbers, setLuckyNumbers] = useState<string[]>([]);
  const [spinningReels, setSpinningReels] = useState<boolean[]>(Array(ticketDigits).fill(false));
  const [showAction, setShowAction] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const isSpinning = spinningReels.some((r) => r);
  const mainNumber = luckyNumbers[0] ?? null;
  const maxQuantity = Math.min(5, availableTickets.length);

  const renderStrip = () =>
    Array.from({ length: 20 }).map((_, i) => (
      <div
        key={i}
        className="h-20 w-full flex items-center justify-center text-5xl font-black font-mono text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] leading-none"
      >
        {i % 10}
      </div>
    ));

  const handleSpin = useCallback(() => {
    if (availableTickets.length === 0) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];
    setShowAction(false);

    const picks = pickDistinct(availableTickets, quantity);
    setLuckyNumbers(picks);

    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      setSpinningReels(Array(ticketDigits).fill(false));
      setShowAction(true);
      return;
    }

    setSpinningReels(Array(ticketDigits).fill(true));

    const STOP_BASE_TIME = 2000;
    const STOP_DELAY = 300;

    for (let i = 0; i < ticketDigits; i++) {
      timers.current.push(
        setTimeout(() => {
          setSpinningReels((prev) => {
            const next = [...prev];
            next[i] = false;
            return next;
          });

          if (i === ticketDigits - 1) {
            timers.current.push(
              setTimeout(() => {
                setShowAction(true);
                setConfettiKey((k) => k + 1);
              }, 400)
            );
          }
        }, STOP_BASE_TIME + i * STOP_DELAY)
      );
    }
  }, [availableTickets, ticketDigits, quantity]);

  const handleAction = () => {
    if (luckyNumbers.length > 0) onTicketsSelect(luckyNumbers);
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0f151f] p-6 shadow-[inset_0_0_40px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col items-center">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fastSlotSpin {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50rem); } /* 10 items * 5rem (h-20) */
        }
        .animate-slot-spin { animation: fastSlotSpin 0.3s linear infinite; }
      `,
        }}
      />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />

      {/* Confetti burst */}
      {confettiKey > 0 && (
        <div key={confettiKey} className="absolute inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden>
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={
                {
                  background: c.color,
                  animationDelay: `${c.delay}s`,
                  '--cx': `${c.cx}px`,
                  '--cy': `${c.cy}px`,
                  '--cr': `${c.cr}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4 border-b border-white/5 pb-2 w-full text-center">
        Generador de la Suerte
      </h3>

      {/* Quantity selector */}
      <div className="relative z-20 mb-6 flex items-center gap-2" role="group" aria-label="Cantidad de números">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 mr-1">Quiero</span>
        {QUANTITIES.filter((q) => q <= Math.max(1, maxQuantity)).map((q) => (
          <button
            key={q}
            type="button"
            disabled={isSpinning}
            aria-pressed={quantity === q}
            onClick={() => {
              setQuantity(q);
              setShowAction(false);
              setLuckyNumbers([]);
            }}
            className={`h-9 min-w-9 px-3 rounded-lg border text-sm font-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              quantity === q
                ? 'border-emerald-400 bg-emerald-500/25 text-white'
                : 'border-white/10 bg-[#0a0f16] text-zinc-400 hover:border-emerald-400/50'
            }`}
          >
            {q}
          </button>
        ))}
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
          {quantity === 1 ? 'número' : 'números'}
        </span>
      </div>

      {/* REELS */}
      <div className="flex gap-2 sm:gap-4 mb-6">
        {Array.from({ length: ticketDigits }).map((_, i) => {
          const spinning = spinningReels[i];
          const targetDigit = mainNumber ? mainNumber[i] : '0';

          return (
            <div
              key={i}
              className="h-20 w-16 sm:w-20 rounded-xl bg-[#0a0f16] border border-white/10 shadow-[inset_0_4px_10px_rgba(0,0,0,0.5),0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden"
            >
              <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#0a0f16] via-transparent to-[#0a0f16] opacity-70 pointer-events-none" />
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-red-500/20 z-10 shadow-[0_0_5px_rgba(239,68,68,0.5)] pointer-events-none" />

              <div
                className={`flex flex-col w-full absolute top-0 left-0 ${
                  spinning ? 'animate-slot-spin' : 'transition-transform duration-[600ms] ease-out'
                }`}
                style={
                  !spinning
                    ? { transform: `translateY(-${parseInt(targetDigit, 10) * 5}rem)` }
                    : { animationDelay: `-${i * 0.15}s` }
                }
              >
                {renderStrip()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Extra numbers (when quantity > 1) */}
      {showAction && luckyNumbers.length > 1 && (
        <p className="relative z-20 mb-4 text-center text-sm font-bold text-zinc-300">
          Tus números:{' '}
          {luckyNumbers.map((n) => (
            <span
              key={n}
              className="mx-1 inline-block rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 font-mono font-black text-emerald-300"
            >
              {n}
            </span>
          ))}
        </p>
      )}

      {/* ACTIONS */}
      <div className="min-h-[60px] flex items-center justify-center w-full relative z-20">
        {!showAction ? (
          <button
            onClick={handleSpin}
            disabled={isSpinning || availableTickets.length === 0}
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 w-full md:w-auto overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
          >
            {!isSpinning && <div className="absolute inset-0 z-0 bg-white/20 animate-pulse mix-blend-overlay" />}
            <span className="relative z-10 text-xl">🎲</span>
            <span className="relative z-10">{isSpinning ? 'Buscando tu suerte...' : 'Probar mi suerte'}</span>
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mx-auto mt-2">
            <button
              onClick={handleAction}
              className="flex-1 group relative inline-flex items-center justify-center gap-2 px-6 py-4 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 font-black text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10">
                {luckyNumbers.length > 1 ? `✨ ¡Reservar estos ${luckyNumbers.length}!` : `✨ ¡Reservar el #${mainNumber}!`}
              </span>
            </button>

            <button
              onClick={handleSpin}
              className="sm:w-auto w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#0a0f16] border border-white/10 font-bold text-zinc-300 transition-all hover:bg-white/5 hover:text-white active:scale-95 cursor-pointer"
            >
              <span className="text-lg">🎲</span> Girar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
