'use client';

interface RaffleHeroProps {
  name: string;
  description: string;
  priceLabel: string;
  coverImageUrl?: string;
  /** Element id the primary button scrolls to. */
  ctaTargetId: string;
  /** Shown only while the buyer has tickets selected. */
  showWhatsappSupport: boolean;
}

export default function RaffleHero({
  name,
  description,
  priceLabel,
  coverImageUrl,
  ctaTargetId,
  showWhatsappSupport,
}: RaffleHeroProps) {
  const scrollToPicker = () => {
    document.getElementById(ctaTargetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="relative z-20 border-b border-white/5 bg-[#0a0f16]/80 px-4 py-8 md:py-12 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0a0f16]/60">
      <div
        className={`mx-auto max-w-5xl grid gap-8 items-center ${
          coverImageUrl ? 'md:grid-cols-2' : 'justify-items-center text-center'
        }`}
      >
        <div className={coverImageUrl ? 'text-center md:text-left' : 'max-w-xl'}>
          <div className={`inline-flex items-center gap-2 mb-3 ${coverImageUrl ? '' : 'justify-center'}`}>
            <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-emerald-500/50" />
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">Sorteo Activo</span>
            <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-emerald-500/50 md:hidden" />
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {name}
          </h1>

          {description && (
            <p className="text-sm md:text-lg font-medium text-zinc-300 mb-5 whitespace-pre-line">
              {description}
            </p>
          )}

          <div className={`flex flex-col sm:flex-row items-center gap-3 ${coverImageUrl ? 'md:justify-start' : ''} justify-center`}>
            <div className="relative group cursor-default">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 opacity-30 blur" />
              <div className="relative inline-flex items-center rounded-full bg-[#111823] border border-white/10 px-5 py-2.5 text-sm md:text-base font-bold text-emerald-300 shadow-2xl">
                <span className="mr-2 text-lg">💎</span> Valor de la Boleta: {priceLabel}
              </div>
            </div>

            <button
              type="button"
              onClick={scrollToPicker}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-7 py-3 text-base font-black text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.45)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Elegir mi número <span aria-hidden>↓</span>
            </button>
          </div>

          <div
            className={`transition-all duration-500 flex ${coverImageUrl ? 'md:justify-start' : ''} justify-center ${
              showWhatsappSupport ? 'opacity-100 max-h-20 mt-5' : 'opacity-0 max-h-0 overflow-hidden'
            }`}
          >
            <a
              href="https://wa.me/573147369247?text=Quiero%20comprar%20la%20rifa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 text-sm font-bold text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
              Soporte por WhatsApp
            </a>
          </div>
        </div>

        {coverImageUrl && (
          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-emerald-500/30 via-transparent to-indigo-500/30 blur-xl" />
            <div className="relative overflow-hidden rounded-2xl border border-emerald-400/30 shadow-[0_0_40px_rgba(0,0,0,0.6)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImageUrl} alt={name} className="w-full aspect-[16/10] object-cover" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
