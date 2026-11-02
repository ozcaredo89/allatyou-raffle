import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const revalidate = 0;

export default async function SorteosPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: raffles } = await supabase
    .from('rafle_raffles')
    .select('id, name, description, price_per_ticket, start_ticket, end_ticket, cover_image_url, slug, is_featured')
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-[#0a0f16] font-sans text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs md:text-sm font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <span>←</span>
            <span>Volver al sorteo principal</span>
          </Link>
        </div>
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight mb-2">Sorteos Activos</h1>
          <p className="text-zinc-400">Elige tu sorteo y participa por increíbles premios.</p>
        </div>

        {!raffles || raffles.length === 0 ? (
          <div className="text-center text-zinc-500 py-20">No hay sorteos activos en este momento.</div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {raffles.map(raffle => (
              <Link
                key={raffle.id}
                href={`/sorteos/${raffle.slug ?? raffle.id}`}
                className="group rounded-2xl border border-white/5 bg-[#0f151f] overflow-hidden hover:border-white/20 transition-all hover:scale-[1.02] shadow-xl"
              >
                {raffle.cover_image_url ? (
                  <div className="h-40 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={raffle.cover_image_url} alt={raffle.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-emerald-900/30 to-indigo-900/30 flex items-center justify-center">
                    <span className="text-5xl">🎫</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="font-black text-lg text-white leading-tight">{raffle.name}</h2>
                    {raffle.is_featured && <span className="text-amber-400 text-sm">⭐</span>}
                  </div>
                  {raffle.description && (
                    <p className="text-zinc-400 text-xs line-clamp-2 mb-3">{raffle.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400 font-bold text-sm">{formatPrice(raffle.price_per_ticket)} / boleta</span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-bold group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">Participar →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}