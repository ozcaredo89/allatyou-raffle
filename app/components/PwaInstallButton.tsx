'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaInstallButtonProps {
  variant?: 'header' | 'admin' | 'banner' | 'floating';
  label?: string;
  className?: string;
  showIcon?: boolean;
}

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function checkIsStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true
  );
}

export default function PwaInstallButton({
  variant = 'header',
  label,
  className = '',
  showIcon = true,
}: PwaInstallButtonProps) {
  const isMounted = useIsMounted();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Listen for the Chrome/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  const isStandalone = checkIsStandalone();
  if (isStandalone || isInstalled) {
    return null;
  }

  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  const handleInstallClick = async () => {
    // If we captured the native prompt (Android, Chrome, Edge)
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error al invocar instalación PWA:', err);
      }
      return;
    }

    // For iOS or desktop browsers where prompt is not available, show visual instructions modal
    setShowModal(true);
  };

  // Default labels based on variant
  const defaultLabel =
    variant === 'admin'
      ? '📲 Instalar Panel'
      : variant === 'banner'
      ? 'Descargar App de Sorteos'
      : '📲 Instalar App';

  const buttonText = label || defaultLabel;

  // Render variant styles
  let buttonStyle = '';
  if (variant === 'header') {
    buttonStyle =
      'inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all transform hover:scale-[1.03] active:scale-[0.98] shrink-0 border border-emerald-300/30';
  } else if (variant === 'admin') {
    buttonStyle =
      'inline-flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all transform hover:scale-[1.02] active:scale-[0.98] shrink-0';
  } else if (variant === 'banner') {
    buttonStyle =
      'inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 text-[#0a0f16] shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] transition-all transform hover:scale-[1.02] active:scale-[0.98]';
  } else if (variant === 'floating') {
    buttonStyle =
      'fixed bottom-24 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-all hover:scale-105';
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`${buttonStyle} ${className}`}
        aria-label="Descargar e instalar aplicación"
        type="button"
      >
        {showIcon && <Download className="w-4 h-4 animate-bounce" />}
        <span>{buttonText}</span>
      </button>

      {/* Guide Modal for iOS Safari / Desktop Manual Install */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0f1722] border border-emerald-500/30 p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-white">
            
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                {isIos ? (
                  <Smartphone className="w-6 h-6 text-white" />
                ) : (
                  <Monitor className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Instalar Sorteos VIP</h3>
                <p className="text-xs text-emerald-400 font-semibold">Acceso directo en tu pantalla de inicio</p>
              </div>
            </div>

            {/* Instructions based on platform */}
            {isIos ? (
              <div className="space-y-3.5 my-5 text-sm text-zinc-200">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                    <Share className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Paso 1:</span>
                    Toca el botón <strong>Compartir</strong> en la barra inferior de Safari (icono de un cuadro con una flecha hacia arriba).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Paso 2:</span>
                    Desliza hacia abajo en el menú y selecciona <strong>«Agregar al inicio»</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Paso 3:</span>
                    Pulsa <strong>«Agregar»</strong> en la esquina superior derecha. ¡Y listo! Tendrás la app en tu pantalla principal.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 my-5 text-sm text-zinc-200">
                <p className="text-zinc-300">
                  Para instalar la app directamente desde tu navegador:
                </p>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">En Chrome o Edge:</span>
                    Haz clic en el icono de instalación <strong>(🖥️ o ⬇️)</strong> que aparece a la derecha en la barra de direcciones de tu navegador, o pulsa en el menú <strong>(⋮) &gt; «Instalar Sorteos VIP»</strong>.
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-all"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
