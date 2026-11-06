'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PwaInstallButton from '@/app/components/PwaInstallButton';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al iniciar sesion');
      }

      router.push('/admin/raffles');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-4 font-sans text-white relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm bg-[#0f151f] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10 relative z-10">
        <div className="px-8 py-8 border-b border-white/5 bg-[#141b26] text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-blue-500/50" />
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Panel de Control</span>
            <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-blue-500/50" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Acceso Admin</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-zinc-300 mb-1.5">
              Contrasena
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              disabled={loading}
              className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3.5 text-white transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-zinc-600 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 py-4 text-base font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Entrar al panel'}
          </button>

          <div className="pt-2 border-t border-white/5 flex flex-col items-center">
            <PwaInstallButton
              variant="admin"
              label="📲 Instalar App en este celular"
              className="w-full justify-center text-xs py-3"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
