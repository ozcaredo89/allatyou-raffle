import { createClient } from '@supabase/supabase-js';
import MainClientPage from './MainClientPage';

// Forzar renderizado dinámico porque las rifas pueden cambiar de estado de activo a inactivo
export const revalidate = 0;

export default async function Page() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Obtener la rifa "activa" más reciente
  const { data: activeRaffle, error } = await supabase
    .from('rafle_raffles')
    .select('id, name, description, price_per_ticket, start_ticket, end_ticket')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !activeRaffle) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center rounded-xl bg-white p-8 shadow-sm border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          <h1 className="text-2xl font-bold mb-2 text-zinc-800 dark:text-zinc-100">No hay rifas activas en este momento</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Vuelve más tarde o asegúrate de haber creado una rifa en Supabase.</p>
        </div>
      </div>
    );
  }

  // Si hay rifa activa, renderizamos el componente principal cliente pasándole los datos
  return (
    <MainClientPage 
      raffleId={activeRaffle.id}
      raffleName={activeRaffle.name}
      raffleDesc={activeRaffle.description || ''}
      price={activeRaffle.price_per_ticket}
      startTicket={activeRaffle.start_ticket}
      endTicket={activeRaffle.end_ticket}
    />
  );
}
