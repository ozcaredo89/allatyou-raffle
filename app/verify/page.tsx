import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Usamos force-dynamic porque esta página depende de query parameters en tiempo real
export const dynamic = 'force-dynamic';

// Inicializar cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function VerifyPage(props: Props) {
  const params = await props.searchParams;
  const ticketNumber = params.ticket;
  const raffleId = params.raffle;

  let isValid = false;
  let isPendingPayment = false;
  let ticketData: any = null;
  let errorMessage = '';

  if (!ticketNumber || !raffleId) {
    errorMessage = 'Faltan parámetros de validación en la URL.';
  } else {
    // Validar en la base de datos
    const { data, error } = await supabase
      .from('rafle_tickets')
      .select(`
        ticket_number,
        status,
        rafle_customers ( name ),
        rafle_raffles ( name )
      `)
      .eq('raffle_id', raffleId)
      .eq('ticket_number', ticketNumber)
      .maybeSingle();

    if (error || !data) {
      errorMessage = 'Boleta no encontrada en los registros del sistema.';
    } else {
      ticketData = data;
      // Validamos que el ticket esté pago
      if (data.status === 'paid') {
        isValid = true;
      } else if (data.status === 'reserved' || data.status === 'pending') {
        isPendingPayment = true;
        errorMessage = 'La boleta existe pero aún no ha sido aprobada/pagada.';
      } else {
        errorMessage = 'Esta boleta se encuentra disponible y no pertenece a nadie actualmente.';
      }
    }
  }

  // Nombre del titular y de la rifa si están disponibles
  const buyerName = ticketData?.rafle_customers?.name || 'Cliente';
  const raffleName = ticketData?.rafle_raffles?.name || 'Sorteo';

  return (
    <div className="min-h-screen bg-[#0a0f16] p-4 md:p-8 font-sans flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* RESULTADO DE LA VALIDACIÓN */}
        {isValid ? (
          <div className="rounded-3xl border border-emerald-500/30 bg-[#0f151f]/80 p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.15)] backdrop-blur-xl mb-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
              <span className="text-4xl drop-shadow-lg">✅</span>
            </div>
            
            <h1 className="text-2xl font-black text-emerald-400 mb-2 uppercase tracking-tight">
              Boleta Oficial
              <br />
              <span className="text-white">Verificada</span>
            </h1>
            
            <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
            
            <div className="flex flex-col gap-4 text-left">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Número de Ticket</span>
                <p className="font-mono text-3xl font-black text-white">{ticketNumber}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Titular</span>
                <p className="text-xl font-bold text-zinc-200">{buyerName}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Sorteo</span>
                <p className="text-sm font-bold text-zinc-400">{raffleName}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-red-500/30 bg-[#0f151f]/80 p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.15)] backdrop-blur-xl mb-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <span className="text-4xl drop-shadow-lg">❌</span>
            </div>
            
            <h1 className="text-2xl font-black text-red-400 mb-4 uppercase tracking-tight">
              Boleta No Válida
            </h1>
            
            <p className="text-sm font-medium text-zinc-300">
              {errorMessage}
            </p>

            {isPendingPayment && (
              <div className="mt-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">Estado: Pendiente</p>
                <p className="text-xs text-amber-200">El titular ya inició el proceso de compra pero su comprobante aún está en revisión.</p>
              </div>
            )}
          </div>
        )}

        {/* MARKETING HOOK / UPSELL */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-b from-[#141b26] to-[#0a0f16] p-8 text-center shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-blue-500/10 blur-[40px] pointer-events-none" />
          
          <h2 className="relative z-10 text-xl font-black text-white mb-2">
            ¿Quieres ser el próximo ganador? 🏆
          </h2>
          <p className="relative z-10 text-sm font-medium text-zinc-400 mb-8">
            Aún quedan números con la suerte de tu lado en el sorteo actual. ¡No dejes pasar la oportunidad!
          </p>

          <Link href="/">
            <button className="relative z-10 w-full group inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-5 font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-[0.98] animate-bounce">
              <span className="text-2xl">🎲</span>
              <span className="text-lg">Probar mi Suerte Ahora</span>
            </button>
          </Link>
        </div>

      </div>
    </div>
  );
}
