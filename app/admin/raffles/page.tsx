'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Raffle {
  id: string;
  name: string;
  description: string;
  price_per_ticket: number;
  start_ticket: number | null;
  end_ticket: number | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_at: string;
  slug: string | null;
  is_featured: boolean;
  cover_image_url: string | null;
}

export default function AdminRafflesPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Add numbers state
  const [addingNumbersId, setAddingNumbersId] = useState<string | null>(null);
  const [newNumbersInput, setNewNumbersInput] = useState('');

  const fetchRaffles = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('rafle_raffles')
      .select('id, name, description, price_per_ticket, start_ticket, end_ticket, status, created_at, slug, is_featured, cover_image_url')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('Error cargando las rifas');
    } else {
      setRaffles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRaffles();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    const isConfirmed = window.confirm(`Esta accion es irreversible. Deseas eliminar permanentemente la rifa "${name}" y todos sus boletos asociados?`);
    
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/raffles/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error eliminando la rifa.');
      setRaffles((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleToggleStatus = async (raffle: Raffle) => {
    const newStatus = raffle.status === 'active' ? 'paused' : 'active';
    
    try {
      const res = await fetch(`/api/raffles/${raffle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!res.ok) throw new Error('Error al cambiar el estado.');
      
      setRaffles((prev) => prev.map((r) => 
        r.id === raffle.id ? { ...r, status: newStatus } : r
      ));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleToggleFeatured = async (raffle: Raffle) => {
    if (raffle.is_featured) return; // already featured, no-op
    try {
      const res = await fetch(`/api/raffles/${raffle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: true }),
      });
      if (!res.ok) throw new Error('Error al destacar la rifa.');
      // Update all raffles: only this one becomes featured
      setRaffles(prev => prev.map(r => ({ ...r, is_featured: r.id === raffle.id })));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const startEditing = (raffle: Raffle) => {
    setEditingId(raffle.id);
    setAddingNumbersId(null);
    setEditName(raffle.name);
    setEditDesc(raffle.description || '');
  };

  const startAddingNumbers = (raffle: Raffle) => {
    setAddingNumbersId(raffle.id);
    setEditingId(null);
    setNewNumbersInput('');
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/raffles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      
      if (!res.ok) throw new Error('Error al actualizar la informacion.');
      
      setRaffles((prev) => prev.map((r) => 
        r.id === id ? { ...r, name: editName, description: editDesc } : r
      ));
      setEditingId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const saveNewNumbers = async (id: string) => {
    if (!newNumbersInput.trim()) return;

    const numbersArray = newNumbersInput.split(',').map(n => n.trim()).filter(n => n.length > 0);
    
    if (numbersArray.length === 0) return;

    try {
      const res = await fetch(`/api/raffles/${id}/add-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_numbers: numbersArray }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agregar los numeros.');
      
      alert(`Exito! Se anadieron ${data.added} ticket(s) nuevos.`);
      setAddingNumbersId(null);
      setNewNumbersInput('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f16] flex items-center justify-center p-4">
         <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-b-2 border-teal-400 animate-spin" />
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f16] p-4 md:p-8 font-sans text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
              Gestion de Sorteos
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Administra tus rifas, pausalas o edita su informacion publica.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                await fetch('/api/admin/logout', { method: 'POST' });
                window.location.href = '/admin/login';
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Salir
            </button>
            <Link
              href="/admin/raffles/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all hover:scale-105 hover:bg-blue-500"
            >
              <span className="text-lg">+</span> Nuevo Sorteo
            </Link>
          </div>
        </div>

        {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 font-medium text-red-400">
              {error}
            </div>
        )}

        {/* List Grid for Mobile / Tablets / Desktop */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {raffles.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-white/5 bg-[#0f151f] p-12 text-center text-zinc-500">
               No hay sorteos creados aun. Comienza creando tu primera rifa.
            </div>
          ) : (
            raffles.map((raffle) => (
              <div 
                key={raffle.id}
                className="rounded-2xl border border-white/5 bg-[#0f151f] shadow-xl overflow-hidden relative flex flex-col group transition-colors hover:border-white/10"
              >
                {/* Cover image or gradient placeholder */}
                {raffle.cover_image_url ? (
                  <div className="h-36 overflow-hidden relative">
                    <Image
                      src={raffle.cover_image_url}
                      alt={raffle.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="h-36 bg-gradient-to-br from-emerald-900/30 to-indigo-900/30 flex items-center justify-center">
                    <span className="text-5xl opacity-50">🎫</span>
                  </div>
                )}

                {/* Visual Status Indicator Strip */}
                <div className={`h-1.5 w-full ${raffle.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : raffle.status === 'paused' ? 'bg-amber-500' : 'bg-red-500'}`} />
                
                <div className="p-6 flex-1 flex flex-col gap-4">
                  
                  {/* Editing or Normal View */}
                  {editingId === raffle.id ? (
                    <div className="flex flex-col gap-3">
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-[#0a0f16] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <textarea 
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full bg-[#0a0f16] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => saveEdit(raffle.id)} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold transition-colors hover:bg-blue-500">Guardar</button>
                        <button onClick={() => setEditingId(null)} className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-700">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-xl font-black text-white">{raffle.name}</h2>
                          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{raffle.description || 'Sin descripcion'}</p>
                          <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                            sorteos/{raffle.slug ?? 'sin-slug'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {raffle.is_featured && <span className="text-amber-400">⭐</span>}
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              raffle.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                              raffle.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {raffle.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-2 bg-[#0a0f16] rounded-xl p-3 border border-white/5 shadow-inner">
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Rango</p>
                          <p className="font-mono text-sm font-medium text-blue-300">
                            {raffle.start_ticket !== null ? `${raffle.start_ticket} → ${raffle.end_ticket}` : 'Especificos'}
                          </p>
                          {raffle.start_ticket !== null && (
                            <p className="text-[10px] text-zinc-600 mt-0.5">({raffle.end_ticket! - raffle.start_ticket! + 1} tkts)</p>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Precio</p>
                          <p className="text-sm font-medium text-emerald-300">{formatPrice(raffle.price_per_ticket)}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Add Numbers Inline */}
                  {addingNumbersId === raffle.id && (
                    <div className="flex flex-col gap-3">
                      <p className="text-xs font-bold text-amber-400">Agregar Numeros Nuevos</p>
                      <textarea 
                        value={newNumbersInput}
                        onChange={(e) => setNewNumbersInput(e.target.value)}
                        placeholder="Ej. 100, 105, 120"
                        className="w-full bg-[#0a0f16] border border-amber-500/30 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 focus:outline-none resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2.5 mt-2">
                        <button onClick={() => saveNewNumbers(raffle.id)} className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold transition-colors hover:bg-amber-500">Anadir</button>
                        <button onClick={() => setAddingNumbersId(null)} className="flex-1 rounded-lg bg-[#0a0f16] border border-white/10 px-4 py-2 text-xs font-bold text-zinc-400 transition-colors hover:text-white">Cancelar</button>
                      </div>
                    </div>
                  )}

                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-1" />

                  {/* Actions */}
                  {editingId !== raffle.id && addingNumbersId !== raffle.id && (
                    <div className="flex flex-col border-t border-white/5 pt-4 gap-2">
                      <div className="flex gap-2">
                         <button
                           onClick={() => startEditing(raffle)}
                           className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                         >
                           Editar
                         </button>
                         <Link
                           href={`/admin/raffles/${raffle.id}/validate`}
                           className="flex-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2 text-xs font-bold text-center text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300"
                         >
                           Auditar Pagos
                         </Link>
                       </div>
                       <div className="flex gap-2">
                         <Link
                           href={`/admin/raffles/${raffle.id}/edit-tickets`}
                           className="flex-1 rounded-lg border border-blue-500/20 bg-blue-500/10 py-2 text-xs font-bold text-center text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
                         >
                           Editar Boletas
                         </Link>
                         <button
                           onClick={() => handleToggleFeatured(raffle)}
                           className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-colors ${
                             raffle.is_featured 
                               ? 'border-amber-500/30 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                               : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                           }`}
                         >
                           {raffle.is_featured ? 'Destacada' : 'Destacar'}
                         </button>
                       </div>
                       <div className="flex gap-2">
                         <button
                           onClick={() => handleToggleStatus(raffle)}
                           className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                         >
                           {raffle.status === 'active' ? 'Pausar' : 'Reanudar'}
                         </button>
                         <button
                           onClick={() => handleDelete(raffle.id, raffle.name)}
                           className="flex-1 rounded-lg border border-red-500/20 bg-red-500/10 py-2 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                         >
                           Borrar
                         </button>
                      </div>
                      
                      {/* Specific Mode Add Numbers Button */}
                      {raffle.start_ticket === null && (
                        <button
                          onClick={() => startAddingNumbers(raffle)}
                          className="w-full rounded-lg border border-amber-500/20 bg-amber-500/10 py-2 text-xs font-bold text-amber-500 transition-colors hover:bg-amber-500/20"
                        >
                          Agregar Mas Numeros
                        </button>
                      )}
                    </div>
                  )}
                  
                </div>
              </div>
            ))
          )}
        </div>
        
      </div>
    </div>
  );
}