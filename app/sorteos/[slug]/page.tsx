import { createClient } from '@supabase/supabase-js';
import MainClientPage from '@/app/MainClientPage';
import { notFound } from 'next/navigation';

export const revalidate = 0;

export default async function SorteoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Try by slug first, then fall back to id (UUID compatibility)
  let { data: raffle } = await supabase
    .from('rafle_raffles')
    .select('id, name, description, price_per_ticket, start_ticket, end_ticket, status, cover_image_url')
    .eq('slug', slug)
    .maybeSingle();

  if (!raffle) {
    const { data: byId } = await supabase
      .from('rafle_raffles')
      .select('id, name, description, price_per_ticket, start_ticket, end_ticket, status, cover_image_url')
      .eq('id', slug)
      .maybeSingle();
    raffle = byId;
  }

  if (!raffle) return notFound();

  if (raffle.status !== 'active') {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-[#0a0f16]">
        <div className="text-center rounded-xl bg-[#0f151f] p-8 shadow-sm border border-white/10">
          <h1 className="text-2xl font-bold mb-2 text-white">Este sorteo no esta disponible</h1>
          <p className="text-zinc-400">El sorteo "{raffle.name}" no se encuentra activo en este momento.</p>
        </div>
      </div>
    );
  }

  return (
    <MainClientPage
      raffleId={raffle.id}
      raffleName={raffle.name}
      raffleDesc={raffle.description || ''}
      price={raffle.price_per_ticket}
      startTicket={raffle.start_ticket}
      endTicket={raffle.end_ticket}
      coverImageUrl={raffle.cover_image_url ?? undefined}
    />
  );
}