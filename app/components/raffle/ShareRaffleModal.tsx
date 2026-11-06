'use client';

import { useState } from 'react';

interface ShareRaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  raffleName: string;
  raffleSlug?: string | null;
  raffleId: string;
}

export default function ShareRaffleModal({
  isOpen,
  onClose,
  raffleName,
  raffleSlug,
  raffleId,
}: ShareRaffleModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rafflePath = `/sorteos/${raffleSlug || raffleId}`;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${rafflePath}` : rafflePath;
  const shareText = `¡Participa en el sorteo de ${raffleName}! Compra tus números aquí: ${shareUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('No se pudo copiar automáticamente. Por favor copia el enlace manual.');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: raffleName,
          text: `¡Participa en el sorteo de ${raffleName}!`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share dismissed
      }
    } else {
      handleCopy();
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#0f151f] border border-white/15 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl">
            📢
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Compartir Sorteo</h2>
            <p className="text-xs text-zinc-400">Difunde este sorteo para aumentar participantes</p>
          </div>
        </div>

        {/* Raffle Preview Box */}
        <div className="p-3.5 rounded-xl bg-[#0a0f16] border border-white/10 mb-5">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Sorteo</p>
          <p className="text-sm font-bold text-white truncate">{raffleName}</p>
          <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">{shareUrl}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* WhatsApp Direct */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all hover:scale-[1.02]"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.884 2.802.884 3.18 0 5.766-2.587 5.767-5.766.001-3.18-2.585-5.771-5.773-5.771zm0-1.872c4.218 0 7.641 3.423 7.642 7.643 0 4.22-3.424 7.643-7.642 7.643-1.282 0-2.484-.316-3.538-.871l-5.193 1.36 1.385-5.062c-.655-1.129-1.014-2.428-1.014-3.805 0-4.22 3.424-7.643 7.642-7.643z" />
            </svg>
            <span>Compartir por WhatsApp</span>
          </a>

          {/* Native Share Sheet (on mobile / supported) */}
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02]"
            >
              <span>📲</span>
              <span>Abrir menú de compartir</span>
            </button>
          )}

          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl border font-bold text-sm transition-all ${
              copied
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'bg-white/5 border-white/15 hover:bg-white/10 text-white hover:border-white/25'
            }`}
          >
            <span>{copied ? '✓' : '🔗'}</span>
            <span>{copied ? '¡Enlace copiado al portapapeles!' : 'Copiar enlace directo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
