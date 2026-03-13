'use client';

import { useState } from 'react';

export default function AdminNewRafflePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [startTicket, setStartTicket] = useState<number>(0);
  const [endTicket, setEndTicket] = useState<number>(99);

  const totalTicketsCalculated = Math.max(0, endTicket - startTicket + 1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!name || !price || startTicket > endTicket || totalTicketsCalculated <= 0) {
        throw new Error('Rango de tickets inválido o campos obligatorios vacíos.');
      }

      const res = await fetch('/api/raffles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price_per_ticket: Number(price),
          start_ticket: Number(startTicket),
          end_ticket: Number(endTicket),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error al crear la rifa.');
      }

      setSuccess(`¡Sorteo creado con éxito! Todos los números han sido generados. ID: ${data.raffle_id}`);
      
      // Reset form on success
      setName('');
      setDescription('');
      setPrice('');
      setStartTicket(0);
      setEndTicket(99);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-4 font-sans text-white relative overflow-hidden selection:bg-indigo-500/30">
      
      {/* Background ambient glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-[#0f151f] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10 relative z-10">
        
        {/* Ambient Top Glow in Card */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-blue-500/10 blur-[50px] pointer-events-none" />

        <div className="px-8 py-8 border-b border-white/5 bg-[#141b26] relative">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-blue-500/50"></span>
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Panel de Control</span>
            <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-blue-500/50"></span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">Nuevo Sorteo</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Configura las reglas ganadoras y genera la cuadrícula de boletos al instante.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6 relative">
          
          {/* Status Messages */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <span className="mr-2">⚠️</span> {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
              <span className="mr-2">🎉</span> {success}
            </div>
          )}

          {/* Form Fields */}
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-zinc-300 mb-1.5">
              Título del Sorteo *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Sorteo iPhone 15 Pro Max VIP"
              disabled={isLoading}
              className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3.5 text-white transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-zinc-600 shadow-inner disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-bold text-zinc-300 mb-1.5">
              Descripción (Opcional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el premio, fecha del sorteo, directrices..."
              disabled={isLoading}
              className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3.5 text-white transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-zinc-600 shadow-inner resize-none disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                Valor por Ticket ($) *
                <span className="text-xl">💰</span>
              </label>
              <input
                id="price"
                type="number"
                required
                min="0"
                step="100"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10000"
                disabled={isLoading}
                className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3.5 text-white text-lg font-bold tracking-wider transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-zinc-600 placeholder:font-normal shadow-inner disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTicket" className="block text-sm font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                  Inicial *
                  <span className="text-xl">🔢</span>
                </label>
                <input
                  id="startTicket"
                  type="number"
                  required
                  min="0"
                  value={startTicket}
                  onChange={(e) => setStartTicket(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3.5 text-white text-lg font-bold transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-zinc-600 shadow-inner disabled:opacity-50"
                />
              </div>
              
              <div>
                <label htmlFor="endTicket" className="block text-sm font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                  Final *
                  <span className="text-xl">🏁</span>
                </label>
                <input
                  id="endTicket"
                  type="number"
                  required
                  min="0"
                  value={endTicket}
                  onChange={(e) => setEndTicket(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3.5 text-white text-lg font-bold transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-zinc-600 shadow-inner disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <div>
              <p className="text-sm font-bold text-blue-400">Total a Generar</p>
              <p className="text-xs text-blue-400/70">Tickets en este rango</p>
            </div>
            <div className="text-2xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
              {totalTicketsCalculated}
            </div>
          </div>

          <div className="mt-4 relative group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 opacity-40 group-hover:opacity-100 blur transition duration-300"></div>
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full rounded-xl bg-[#0a0f16] border border-white/10 py-4 text-base font-bold text-blue-300 shadow-xl transition-all hover:bg-[#111823] hover:text-blue-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-transparent disabled:before:hidden z-10 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="relative flex items-center justify-center h-5 w-5">
                    <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin" />
                    <div className="absolute inset-1 rounded-full border-b-2 border-indigo-400 animate-spin-reverse" />
                  </div>
                  Fabricando Tickets...
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span> Largar Sorteo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
