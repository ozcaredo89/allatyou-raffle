// Real winners of previous raffles. Photos are crops of the promo collage
// supplied by the raffle owner (public/winners/). Only publish with each
// person's consent; edit this list to add/remove entries.
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
  return (
    <section aria-label="Ganadores reales" className="mx-auto w-full max-w-4xl px-4 pt-10 relative z-10">
      <div className="text-center mb-4">
        <h2 className="text-lg md:text-2xl font-black text-white">🏆 Ganadores reales</h2>
        <p className="text-xs md:text-sm text-zinc-400">
          Personas como tú que ya recibieron su premio con Jerson Franco.
        </p>
      </div>

      <ul className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 md:grid md:grid-cols-3 md:overflow-visible">
        {WINNERS.map((w) => (
          <li
            key={w.src}
            className="snap-center shrink-0 w-[72%] sm:w-[45%] md:w-auto overflow-hidden rounded-2xl border border-emerald-400/20 bg-[#0f151f] shadow-[0_0_25px_rgba(0,0,0,0.5)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={w.src} alt={w.alt} loading="lazy" className="w-full aspect-square object-cover" />
            <p className="px-3 py-2 text-center text-xs font-bold text-emerald-300">{w.caption}</p>
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
    </section>
  );
}
