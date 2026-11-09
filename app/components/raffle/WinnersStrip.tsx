'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Real winners of previous raffles. Photos are crops of the promo collage
// supplied by the raffle owner (public/winners/). Edit this list to add/remove entries.
const WINNERS: { src: string; alt: string; caption: string }[] = [
  {
    src: '/winners/ganadores-2.jpg',
    alt: 'Ganadores posando junto a su moto Honda XR roja',
    caption: 'Entrega de moto Honda XR',
  },
  {
    src: '/winners/ganadores-1.jpg',
    alt: 'Cuatro ganadores mostrando su boleta premiada',
    caption: 'Ganadores con su boleta',
  },
  {
    src: '/winners/ganadores-3.jpg',
    alt: 'Ganadores con cheque de Bancolombia y entrevista en televisión',
    caption: 'Premio en efectivo y TV local',
  },
];

const INSTAGRAM_URL = 'https://www.instagram.com/jersonfranco_?igsh=a3RsamZqcHVtMG9y&utm_source=qr';

export default function WinnersStrip() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpenIndex(null);
    lastTrigger.current?.focus();
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    setOpenIndex((i) => (i === null ? i : (i + dir + WINNERS.length) % WINNERS.length));
  }, []);

  // Keyboard (Esc / arrows), scroll lock and focus while the lightbox is open.
  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [openIndex, close, step]);

  const current = openIndex !== null ? WINNERS[openIndex] : null;

  return (
    <section aria-label="Ganadores reales" className="mx-auto w-full max-w-4xl px-4 pt-10 relative z-10">
      <div className="text-center mb-4">
        <h2 className="text-lg md:text-2xl font-black text-white">🏆 Ganadores reales</h2>
        <p className="text-xs md:text-sm text-zinc-400">
          Personas como tú que ya recibieron su premio con Jerson Franco. Toca una foto para verla más grande.
        </p>
      </div>

      <ul className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 md:grid md:grid-cols-3 md:overflow-visible">
        {WINNERS.map((w, i) => (
          <li key={w.src} className="snap-center shrink-0 w-[72%] sm:w-[45%] md:w-auto">
            <button
              type="button"
              onClick={(e) => {
                lastTrigger.current = e.currentTarget;
                setOpenIndex(i);
              }}
              aria-label={`Ampliar foto: ${w.caption}`}
              className="group block w-full overflow-hidden rounded-2xl border border-emerald-400/20 bg-[#0f151f] shadow-[0_0_25px_rgba(0,0,0,0.5)] transition-all hover:border-emerald-400/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] cursor-zoom-in"
            >
              <span className="relative block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.src}
                  alt={w.alt}
                  loading="lazy"
                  className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span
                  aria-hidden
                  className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-sm backdrop-blur"
                >
                  🔍
                </span>
              </span>
              <span className="block px-3 py-2 text-center text-xs font-bold text-emerald-300">{w.caption}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-center text-xs text-zinc-500">
        Más entregas en{' '}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-pink-400 hover:text-pink-300 underline underline-offset-2"
        >
          nuestro Instagram
        </a>
        .
      </p>

      {current &&
        createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.caption}
          onClick={close}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-fadeIn"
        >
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white hover:bg-white/20 cursor-pointer"
          >
            ✕
          </button>

          <div className="relative flex w-full max-w-3xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Foto anterior"
              className="absolute left-0 z-10 flex h-11 w-11 -translate-x-1 items-center justify-center rounded-full bg-black/60 text-xl text-white hover:bg-black/80 sm:-translate-x-14 cursor-pointer"
            >
              ←
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.alt}
              className="max-h-[78vh] w-auto max-w-full rounded-xl border border-white/10 object-contain shadow-[0_0_60px_rgba(0,0,0,0.8)]"
            />

            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Foto siguiente"
              className="absolute right-0 z-10 flex h-11 w-11 translate-x-1 items-center justify-center rounded-full bg-black/60 text-xl text-white hover:bg-black/80 sm:translate-x-14 cursor-pointer"
            >
              →
            </button>
          </div>

          <p className="mt-4 text-center text-sm font-bold text-emerald-300" onClick={(e) => e.stopPropagation()}>
            {current.caption}{' '}
            <span className="text-zinc-500">
              ({(openIndex ?? 0) + 1}/{WINNERS.length})
            </span>
          </p>
        </div>,
        document.body
      )}
    </section>
  );
}
