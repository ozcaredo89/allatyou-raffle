'use client';

import { useState, useRef } from 'react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumbers: string[];
  raffleId: string;
  raffleName?: string;
  totalPrice: number;
  onSuccess: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  ticketNumbers,
  raffleId,
  raffleName = 'Rifa',
  totalPrice,
  onSuccess,
}: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  if (!isOpen) return null;

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/raffles/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raffle_id: raffleId,
          ticket_numbers: ticketNumbers,
          customer_name: name,
          customer_phone: phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Este número ya fue tomado. Intenta con otro.');

      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido.');
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleUploadProof = async () => {
    if (!file) {
      setError('Por favor sube la foto de tu comprobante primero.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('ticket_numbers', JSON.stringify(ticketNumbers));
    formData.append('raffle_id', raffleId);
    formData.append('file', file);

    try {
      const res = await fetch('/api/raffles/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir el comprobante. Intenta de nuevo.');

      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeAndReset = () => {
    setStep(1);
    setName('');
    setPhone('');
    setFile(null);
    setError(null);
    onClose();
  };

  const handleSuccessClose = () => {
    closeAndReset();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-0">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-[#0f151f] shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 relative">

        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none" />

        {/* Header Modal */}
        <div className="relative border-b border-white/5 bg-[#141b26] px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="text-emerald-400">#</span>
              <span className="drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{ticketNumbers.join(', ')}</span>
            </h2>
            {step !== 3 && (
              <button
                onClick={closeAndReset}
                className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Cuerpos del Modal */}
        <div className="p-6 relative">
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              {error}
            </div>
          )}

          {/* PASO 1: Formulario de Reserva */}
          {step === 1 && (
            <form onSubmit={handleReserve} className="flex flex-col gap-5">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 text-sm text-blue-300">
                <span className="text-xl">⏱️</span>
                <p>
                  Ingresa tus datos para bloquear este número. Tienes <strong className="text-blue-200">15 minutos</strong> para pagar una vez reservado.
                </p>
              </div>

              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-bold text-zinc-300">
                  Nombre Completo
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-[#0a0f16] px-4 py-3.5 text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-600 shadow-inner"
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-bold text-zinc-300">
                  WhatsApp
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-xl border border-white/10 bg-[#0a0f16] px-4 py-3.5 text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-zinc-600 shadow-inner"
                  placeholder="+57 300 000 0000"
                />
              </div>

              <div className="mt-2 flex flex-col gap-3">
                <div className="relative group">
                  <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-40 group-hover:opacity-60 blur transition duration-300"></div>
                  <button
                    type="submit"
                    disabled={loading || !name || !phone}
                    className="relative w-full rounded-xl bg-[#0d131c] border border-white/10 py-4 text-base font-bold text-emerald-300 shadow-xl transition-all hover:bg-[#111823] hover:text-emerald-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-transparent disabled:before:hidden z-10"
                  >
                    {loading ? 'Bloqueando número...' : 'Reservar Ticket'}
                  </button>
                </div>
                
                {/* Secondary WhatsApp Button */}
                <a
                  href={`https://wa.me/573147369247?text=${encodeURIComponent(`Hola, quiero comprar los números ${ticketNumbers.join(', ')} de la ${raffleName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 py-4 text-sm font-bold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                  Comprar por WhatsApp
                </a>
              </div>
            </form>
          )}

          {/* PASO 2: Instrucciones de Pago y Subida de Comprobante */}
          {step === 2 && (
            <div className="flex flex-col gap-5 text-center">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                <p className="text-sm font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                  ¡Ticket Reservado! ⏳
                </p>
                <p className="text-xs text-emerald-400/70 mt-1">Sube tu comprobante en menos de 15 mins</p>
              </div>

              <div className="flex flex-col gap-4 text-left">
                <p className="text-sm font-medium text-zinc-400 text-center">
                  Transfiere exactamente <strong className="text-white text-lg ml-1">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalPrice)}</strong> a:
                </p>

                {/* Tarjeta 1: Nequi */}
                <div className="relative overflow-hidden rounded-xl border border-fuchsia-500/30 bg-[#1f0d2b] p-4 shadow-[0_0_15px_rgba(217,70,239,0.15)] transition-all hover:border-fuchsia-500/50">
                  <div className="absolute top-2 right-2 p-2 opacity-30 select-none">
                    <span className="text-4xl">📱</span>
                  </div>
                  <div className="relative z-10 flex flex-col gap-1">
                    <h5 className="text-xs font-black uppercase tracking-widest text-fuchsia-400">Opción Principal</h5>
                    <p className="text-sm font-bold text-white">Realiza tu pago con Nequi</p>
                    
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-black/40 border border-fuchsia-500/10 p-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-xl font-black tracking-tight text-fuchsia-400">314 736 9247</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-1">A nombre de: Jerson Mur****</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('3147369247')}
                        className="flex h-9 w-9 items-center justify-center rounded bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 transition-colors hover:bg-fuchsia-500/20 active:scale-95"
                        title="Copiar Nequi"
                      >
                        {copiedNumber === '3147369247' ? '✓' : '📋'}
                      </button>
                    </div>
                    
                    <p className="mt-3 text-xs font-semibold text-fuchsia-300/80">
                      Le tomas pantallazo y lo subes aquí abajo 👇🏻
                    </p>
                  </div>
                </div>

                {/* Tarjeta 2: Bancolombia */}
                <div className="relative overflow-hidden rounded-xl border border-yellow-500/30 bg-[#181a14] p-4 shadow-[0_0_15px_rgba(234,179,8,0.1)] transition-all hover:border-yellow-500/50">
                  <div className="absolute top-2 right-2 p-2 opacity-30 select-none">
                    <span className="text-4xl">🏦</span>
                  </div>
                  <div className="relative z-10 flex flex-col gap-1">
                    <p className="text-sm font-bold text-white">Pago con cuenta ahorro Bancolombia</p>
                    
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-black/40 border border-yellow-500/10 p-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-xl font-black tracking-tight text-yellow-500">733-0001 77-27</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mt-1">A nombre de: Jerson Mur****</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('73300017727')}
                        className="flex h-9 w-9 items-center justify-center rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 transition-colors hover:bg-yellow-500/20 active:scale-95"
                        title="Copiar Bancolombia"
                      >
                        {copiedNumber === '73300017727' ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className="hidden"
                />

                {!file ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-600 bg-zinc-800/30 py-10 transition-all hover:border-emerald-500 hover:bg-emerald-500/5 group"
                  >
                    <span className="text-4xl shadow-black drop-shadow-lg group-hover:scale-110 transition-transform">📸</span>
                    <span className="text-sm font-bold text-zinc-300 group-hover:text-emerald-400">
                      Tocar para Subir Foto
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/5 p-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📄</span>
                      <span className="text-sm font-medium text-zinc-300 truncate">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                      }}
                      className="ml-2 rounded-full border border-white/20 bg-black/60 p-2 text-white backdrop-blur-md transition-colors hover:bg-red-500 flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-2 relative group">
                <div className={`absolute -inset-0.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 opacity-40 group-hover:opacity-60 blur transition duration-300 ${!file && 'hidden'}`}></div>
                <button
                  type="button"
                  onClick={handleUploadProof}
                  disabled={loading || !file}
                  className="relative w-full rounded-xl bg-[#0d131c] border border-white/10 py-4 text-base font-bold text-blue-300 shadow-xl transition-all hover:bg-[#111823] hover:text-blue-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-transparent z-10"
                >
                  {loading ? 'Procesando...' : 'Confirmar Pago'}
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: Éxito */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                <span className="text-5xl drop-shadow-md">💎</span>
              </div>
              <h3 className="text-2xl font-black text-white mt-2 tracking-tight">
                ¡Tickets Asegurados!
              </h3>
              <p className="text-sm text-zinc-400 max-w-[250px]">
                Los tickets <strong className="text-emerald-400">#{ticketNumbers.join(', ')}</strong> han entrado a validación. Te confirmaremos por WhatsApp.
              </p>
              <button
                onClick={handleSuccessClose}
                className="mt-6 w-full rounded-xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-white shadow-md transition-colors hover:bg-white/10 active:scale-[0.98]"
              >
                Volver al Sorteo
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
