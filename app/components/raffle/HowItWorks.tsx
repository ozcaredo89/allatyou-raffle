const STEPS = [
  { icon: '🎯', title: 'Elige', text: 'Escoge tu número o deja que la suerte lo haga.' },
  { icon: '📲', title: 'Paga', text: 'Transfiere por Nequi o Bancolombia y sube el comprobante.' },
  { icon: '🎟️', title: 'Recibe', text: 'Descarga tu boleta con tu número y código QR.' },
];

export default function HowItWorks() {
  return (
    <section aria-label="Cómo comprar" className="relative z-10 mx-auto max-w-4xl px-4 pt-8">
      <ol className="grid grid-cols-3 gap-2 sm:gap-4">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-4 sm:px-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-lg border border-emerald-400/30">
              {s.icon}
            </span>
            <span className="mt-2 text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
              {i + 1}. {s.title}
            </span>
            <span className="mt-1 text-xs sm:text-sm text-zinc-400 leading-snug">{s.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
