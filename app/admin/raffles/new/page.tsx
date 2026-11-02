'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminNewRafflePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [startTicket, setStartTicket] = useState<number>(0);
  const [endTicket, setEndTicket] = useState<number>(99);
  const [creationMode, setCreationMode] = useState<'range' | 'specific'>('range');
  const [customNumbersInput, setCustomNumbersInput] = useState<string>('');

  // New fields
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Ticket template fields
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [templateMode, setTemplateMode] = useState<'final' | 'reference'>('final');
  const [sendTemplateEmail, setSendTemplateEmail] = useState<boolean>(true);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(normalizeSlug(name));
    }
  }, [name, slugManuallyEdited]);

  const parseCustomNumbers = (input: string) => {
    return input.split(',').map(s => s.trim()).filter(s => s.length > 0);
  };

  const currentCustomNumbers = parseCustomNumbers(customNumbersInput);
  
  const totalTicketsCalculated = creationMode === 'range' 
    ? Math.max(0, endTicket - startTicket + 1)
    : new Set(currentCustomNumbers).size;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    } else {
      setCoverPreview(null);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setTemplateFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setTemplatePreview(url);
    } else {
      setTemplatePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!name || !price || totalTicketsCalculated <= 0) {
        throw new Error('Debes proveer un titulo, precio y al menos un ticket para generar.');
      }
      if (creationMode === 'range' && startTicket > endTicket) {
        throw new Error('El rango de tickets es invalido (el inicial debe ser menor o igual al final).');
      }

      const uniqueSpecifics = Array.from(new Set(currentCustomNumbers));
      if (creationMode === 'specific' && uniqueSpecifics.length > 0) {
        const firstLen = uniqueSpecifics[0].length;
        if (!uniqueSpecifics.every(n => n.length === firstLen)) {
          throw new Error('En la modalidad de numeros especificos, todos los boletos deben tener exactamente la misma longitud de caracteres.');
        }
      }

      const payload = {
        name,
        description,
        price_per_ticket: Number(price),
        slug: slug || normalizeSlug(name),
        is_featured: isFeatured,
        ...(creationMode === 'range' 
          ? { start_ticket: Number(startTicket), end_ticket: Number(endTicket) }
          : { custom_numbers: uniqueSpecifics }
        ),
      };

      // Step 1: Create raffle
      const res = await fetch('/api/raffles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'slug_conflict') {
          throw new Error(`Este slug ya existe. Prueba con: ${data.suggestion}`);
        }
        throw new Error(data.error || 'Ocurrio un error al crear la rifa.');
      }

      const raffle_id = data.raffle_id;

      // Step 2: Upload cover image if selected
      if (coverFile && raffle_id) {
        const coverForm = new FormData();
        coverForm.append('raffle_id', raffle_id);
        coverForm.append('file', coverFile);

        const coverRes = await fetch('/api/raffles/upload-cover', {
          method: 'POST',
          body: coverForm,
        });

        if (coverRes.ok) {
          const coverData = await coverRes.json();
          // Step 3: PATCH raffle with cover_image_url
          await fetch(`/api/raffles/${raffle_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cover_image_url: coverData.cover_image_url }),
          });
        } else {
          console.warn('Cover upload failed, continuing without cover image.');
        }
      }

      // Step 4: Upload ticket template or reference image if selected
      let templateStatusNote = '';
      if (templateFile && raffle_id) {
        const templateForm = new FormData();
        templateForm.append('raffle_id', raffle_id);
        templateForm.append('file', templateFile);
        const isFinal = templateMode === 'final';
        const shouldEmail = templateMode === 'reference' || sendTemplateEmail;
        templateForm.append('is_final_template', String(isFinal));
        templateForm.append('send_email', String(shouldEmail));

        const templateRes = await fetch('/api/raffles/upload-template', {
          method: 'POST',
          body: templateForm,
        });

        if (templateRes.ok) {
          const tplData = await templateRes.json();
          if (tplData.applied && tplData.emailed) {
            templateStatusNote = ' Plantilla de boleta activada y enviada al correo.';
          } else if (tplData.applied) {
            templateStatusNote = ' Plantilla de boleta activada para este sorteo.';
          } else if (tplData.emailed) {
            templateStatusNote = ' Imagen enviada al correo para diseñar la plantilla.';
          }
        } else {
          console.warn('Ticket template upload failed.');
        }
      }

      setSuccess(`Sorteo creado con exito! Todos los numeros han sido generados.${templateStatusNote} ID: ${raffle_id}`);
      
      // Reset form on success
      setName('');
      setDescription('');
      setPrice('');
      setStartTicket(0);
      setEndTicket(99);
      setCustomNumbersInput('');
      setCreationMode('range');
      setSlug('');
      setSlugManuallyEdited(false);
      setIsFeatured(false);
      setCoverFile(null);
      setCoverPreview(null);
      setTemplateFile(null);
      setTemplatePreview(null);
      setTemplateMode('final');
      setSendTemplateEmail(true);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
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

        <div className="px-8 pt-6 pb-2 relative z-10">
          <Link
            href="/admin/raffles"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <span aria-hidden="true">&larr;</span> Volver al listado
          </Link>
        </div>

        <div className="px-8 pb-8 pt-4 border-b border-white/5 bg-[#141b26] relative">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-blue-500/50"></span>
            <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">Panel de Control</span>
            <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-blue-500/50"></span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">Nuevo Sorteo</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Configura las reglas ganadoras y genera la cuadricula de boletos al instante.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6 relative">
          
          {/* Status Messages */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-medium text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <span className="mr-2">Warning:</span> {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
              <span className="mr-2">OK</span> {success}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-zinc-300 mb-1.5">
              Titulo del Sorteo *
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

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-bold text-zinc-300 mb-1.5">
              URL del Sorteo (slug)
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              placeholder="Ej. sorteo-iphone-15"
              disabled={isLoading}
              className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3.5 text-white transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-zinc-600 shadow-inner disabled:opacity-50 font-mono text-sm"
            />
            {slug && (
              <p className="text-xs text-zinc-500 mt-1.5">
                URL: <span className="text-blue-400 font-mono">sorteos/{slug}</span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-bold text-zinc-300 mb-1.5">
              Descripcion (Opcional)
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

          {/* Cover image */}
          <div>
            <label className="block text-sm font-bold text-zinc-300 mb-1.5">
              Imagen de Portada (Opcional)
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors bg-[#0a0f16] overflow-hidden">
              {coverPreview ? (
                <div className="relative w-full h-full">
                  <Image src={coverPreview} alt="Cover preview" fill className="object-cover" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <span className="text-3xl">🖼️</span>
                  <span className="text-xs font-medium">Click para seleccionar imagen</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleCoverChange}
                disabled={isLoading}
              />
            </label>
            {coverFile && (
              <p className="text-xs text-zinc-500 mt-1">
                Archivo: <span className="text-blue-400">{coverFile.name}</span>
              </p>
            )}
          </div>

          {/* Ticket Template Image */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <label className="block text-sm font-bold text-emerald-300">
                  🎟️ Plantilla / Imagen para la Boleta (Opcional)
                </label>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sube la plantilla vertical (1536×2752 px) o sube una imagen base para que te llegue al correo y acomodarla en el template.
                </p>
              </div>
              <a
                href="/ticket-template.png"
                download="plantilla-referencia-1536x2752.png"
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 shrink-0"
              >
                📥 Descargar base de referencia
              </a>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-emerald-500/25 rounded-xl cursor-pointer hover:border-emerald-500/60 transition-colors bg-[#0a0f16] overflow-hidden">
              {templatePreview ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black/40 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={templatePreview}
                    alt="Ticket template preview"
                    className="max-h-full w-auto object-contain rounded"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-400 px-4 text-center">
                  <span className="text-3xl">🎟️</span>
                  <span className="text-xs font-bold text-emerald-400">
                    Click para subir la plantilla o imagen para la boleta
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Formato recomendado: 9:16 vertical (1536 × 2752 px)
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleTemplateChange}
                disabled={isLoading}
              />
            </label>

            {templateFile && (
              <div className="flex flex-col gap-2.5 pt-1">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="truncate">
                    Archivo: <strong className="text-emerald-400">{templateFile.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateFile(null);
                      setTemplatePreview(null);
                    }}
                    className="text-red-400 hover:text-red-300 font-bold ml-2 shrink-0"
                  >
                    Quitar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition-all ${
                      templateMode === 'final'
                        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200'
                        : 'border-white/10 bg-[#0a0f16] text-zinc-400 hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="templateMode"
                      className="mt-0.5 accent-emerald-500"
                      checked={templateMode === 'final'}
                      onChange={() => setTemplateMode('final')}
                    />
                    <div>
                      <p className="font-bold">Ya es la plantilla lista</p>
                      <p className="text-[11px] opacity-80">Usar de inmediato en las boletas de este sorteo</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition-all ${
                      templateMode === 'reference'
                        ? 'border-blue-500/50 bg-blue-500/15 text-blue-200'
                        : 'border-white/10 bg-[#0a0f16] text-zinc-400 hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="templateMode"
                      className="mt-0.5 accent-blue-500"
                      checked={templateMode === 'reference'}
                      onChange={() => {
                        setTemplateMode('reference');
                        setSendTemplateEmail(true);
                      }}
                    />
                    <div>
                      <p className="font-bold">Enviarme al correo para armarla</p>
                      <p className="text-[11px] opacity-80">La acomodo en el template y la subo luego</p>
                    </div>
                  </label>
                </div>

                {templateMode === 'final' && (
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={sendTemplateEmail}
                      onChange={(e) => setSendTemplateEmail(e.target.checked)}
                      className="rounded accent-emerald-500"
                    />
                    <span>Enviarme también una copia de esta imagen al correo del administrador</span>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* is_featured toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                disabled={isLoading}
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${isFeatured ? 'bg-amber-500' : 'bg-zinc-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isFeatured ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </div>
            <span className="text-sm font-bold text-zinc-300">
              Destacar como sorteo principal en el home
            </span>
          </label>

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
              <label 
                className={`relative flex items-center justify-center gap-2 rounded-xl border border-white/10 p-3 text-sm font-bold transition-all cursor-pointer ${
                  creationMode === 'range' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#0a0f16] text-zinc-400 hover:bg-white/5'
                }`}
              >
                <input type="radio" className="sr-only" checked={creationMode === 'range'} onChange={() => setCreationMode('range')} />
                <span className="text-xl">📏</span> Por Rango
              </label>
              <label 
                className={`relative flex items-center justify-center gap-2 rounded-xl border border-white/10 p-3 text-sm font-bold transition-all cursor-pointer ${
                  creationMode === 'specific' ? 'bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-[#0a0f16] text-zinc-400 hover:bg-white/5'
                }`}
              >
                <input type="radio" className="sr-only" checked={creationMode === 'specific'} onChange={() => setCreationMode('specific')} />
                <span className="text-xl">🎯</span> Especificos
              </label>
            </div>
            
            {creationMode === 'range' ? (
              <div className="col-span-1 sm:col-span-2 grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label htmlFor="startTicket" className="block text-sm font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                    Inicial *
                    <span className="text-xl">🔢</span>
                  </label>
                  <input
                    id="startTicket"
                    type="number"
                    required={creationMode === 'range'}
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
                    required={creationMode === 'range'}
                    min="0"
                    value={endTicket}
                    onChange={(e) => setEndTicket(Number(e.target.value))}
                    disabled={isLoading}
                    className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3.5 text-white text-lg font-bold transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-zinc-600 shadow-inner disabled:opacity-50"
                  />
                </div>
              </div>
            ) : (
              <div className="col-span-1 sm:col-span-2 mt-2">
                <label htmlFor="customNumbers" className="block text-sm font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                  Numeros Especificos (Separados por coma) *
                  <span className="text-xl">🎯</span>
                </label>
                <textarea
                  id="customNumbers"
                  required={creationMode === 'specific'}
                  rows={3}
                  value={customNumbersInput}
                  onChange={(e) => setCustomNumbersInput(e.target.value)}
                  placeholder="Ej. 011, 015, 088, 120"
                  disabled={isLoading}
                  className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3.5 text-white text-lg font-bold transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 placeholder:text-zinc-600 shadow-inner resize-none disabled:opacity-50"
                />
                <p className="text-xs text-amber-500/80 mt-2 font-medium">Todos deben tener la misma longitud de digitos. Se ignoraran los duplicados.</p>
              </div>
            )}
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

          <div className="mt-4 flex flex-col-reverse sm:flex-row items-center gap-4">
            <Link
              href="/admin/raffles"
              className="w-full sm:w-auto rounded-xl border border-white/10 bg-transparent px-8 py-4 text-center text-sm font-bold text-zinc-300 transition-colors hover:bg-white/5 hover:text-white active:scale-[0.98]"
            >
              Cancelar
            </Link>

            <div className="relative group w-full flex-1">
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
                      <div className="absolute inset-1 rounded-full border-b-2 border-indigo-400 animate-spin" />
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
          </div>
        </form>
      </div>
    </div>
  );
}