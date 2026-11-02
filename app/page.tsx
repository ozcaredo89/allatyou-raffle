import { createClient } from '@supabase/supabase-js';
import MainClientPage from './MainClientPage';

// Forzar renderizado dinamico porque las rifas pueden cambiar de estado de activo a inactivo
export const revalidate = 0;

export default async function Page() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: activeRaffles, error } = await supabase
    .from('rafle_raffles')
    .select('id, name, description, price_per_ticket, start_ticket, end_ticket, slug, cover_image_url, is_featured')
    .eq('status', 'active')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching raffles:', error);
  }

  if (error || !activeRaffles || activeRaffles.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center rounded-xl bg-white p-8 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <h1 className="text-2xl font-bold mb-2 text-zinc-800 dark:text-zinc-100">No hay rifas activas en este momento</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Vuelve mas tarde o asegurate de haber creado una rifa en el panel de admin.</p>
        </div>
      </div>
    );
  }

  const hero = activeRaffles[0];
  const otherRaffles = activeRaffles.slice(1).map(r => ({ id: r.id, name: r.name, slug: r.slug }));

  return (
    <MainClientPage
      raffleId={hero.id}
      raffleName={hero.name}
      raffleDesc={hero.description || ''}
      price={hero.price_per_ticket}
      startTicket={hero.start_ticket}
      endTicket={hero.end_ticket}
      coverImageUrl={hero.cover_image_url ?? undefined}
      otherRaffles={otherRaffles.length > 0 ? otherRaffles : undefined}
    />
  );
}