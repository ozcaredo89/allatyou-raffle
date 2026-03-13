'use client';

import { useState, useRef } from 'react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketNumber: string;
  raffleId: string;
  onSuccess: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  ticketNumber,
  raffleId,
  onSuccess,
}: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          ticket_number: ticketNumber,
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
      setPreviewUrl(URL.createObjectURL(selected));
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
    formData.append('ticket_number', ticketNumber);
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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
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
              <span className="drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">{ticketNumber}</span>
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

              <div className="mt-2 relative group">
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-40 group-hover:opacity-60 blur transition duration-300"></div>
                <button
                  type="submit"
                  disabled={loading || !name || !phone}
                  className="relative w-full rounded-xl bg-[#0d131c] border border-white/10 py-4 text-base font-bold text-emerald-300 shadow-xl transition-all hover:bg-[#111823] hover:text-emerald-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-transparent disabled:before:hidden z-10"
                >
                  {loading ? 'Bloqueando número...' : 'Reservar Ticket'}
                </button>
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

              <div>
                <p className="text-sm font-medium text-zinc-400">
                  Transfiere exactamente el valor a:
                </p>
                <div className="mx-auto mt-3 inline-block rounded-xl border border-white/10 bg-[#0a0f16] px-8 py-4 shadow-inner">
                  <p className="text-2xl font-black tracking-wider text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                    Nequi: 300 123 4567
                  </p>
                  <p className="mt-1.5 text-xs font-semibold text-zinc-500 tracking-wide uppercase">A nombre de: Juan Pérez</p>
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

                {!previewUrl ? (
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
                  <div className="relative mx-auto mt-2 h-48 w-full overflow-hidden rounded-xl border border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Comprobante"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/60 p-2 text-white backdrop-blur-md transition-colors hover:bg-red-500"
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
                ¡Ticket Asegurado!
              </h3>
              <p className="text-sm text-zinc-400 max-w-[250px]">
                El ticket <strong className="text-emerald-400">#{ticketNumber}</strong> ha entrado a validación. Te confirmaremos por WhatsApp.
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
