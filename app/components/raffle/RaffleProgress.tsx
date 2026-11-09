export interface TicketStats {
  total: number;
  available: number;
  /** reserved + pending + paid */
  taken: number;
}

export default function RaffleProgress({ stats }: { stats: TicketStats | null }) {
  if (!stats || stats.total === 0) return null;

  const pct = Math.min(100, Math.round((stats.taken / stats.total) * 100));
  const fmt = new Intl.NumberFormat('es-CO');

  return (
    <section aria-label="Progreso del sorteo" className="mx-auto w-full max-w-4xl px-4 pt-6 relative z-10">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-end justify-between gap-3 mb-2">
          <p className="text-sm font-bold text-zinc-200">
            <span className="text-emerald-300 text-lg font-black">{fmt.format(stats.taken)}</span> de{' '}
            {fmt.format(stats.total)} números ya tienen dueño
          </p>
          <p className="text-sm font-black text-emerald-300">{pct}%</p>
        </div>
        <div
          className="h-3 w-full overflow-hidden rounded-full bg-black/40 border border-white/5"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 shadow-[0_0_12px_rgba(52,211,153,0.6)] transition-all duration-700"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Quedan {fmt.format(stats.available)} disponibles. Incluye números reservados en proceso de pago.
        </p>
      </div>
    </section>
  );
}
