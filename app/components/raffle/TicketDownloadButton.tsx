'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';

interface TicketDownloadButtonProps {
  raffleId: string;
  ticketNumber: string;
  buyerName: string;
  purchaseDate: string;
  status: string; // 'available', 'reserved', 'pending', 'paid'
  variant?: 'default' | 'small';
  showPreview?: boolean;
  templateUrlOverride?: string | null;
}

// -------------------------------------------------------------
// CONSTANTES DE DIBUJO (AJÚSTALAS SEGÚN TU DISEÑO)
// Basado en plantilla vertical 9:16 (1536 x 2752 px)
// -------------------------------------------------------------
const TEMPLATE_WIDTH = 1536;
const TEMPLATE_HEIGHT = 2752;

// RECUADRO IZQUIERDO (Comprador y Fecha)
const NAME_POS_X = 130;
const NAME_POS_Y = 2255; // Ajusta para que quede sobre la 1ra línea
const DATE_POS_X = 306;
const DATE_POS_Y = 2550; // Ajusta para que quede sobre las líneas ___/___/___

// RECUADRO DERECHO (Ticket y QR)
// Placa del número de ticket: se dibuja SOBRE el recuadro "TICKET N°" de la
// plantilla (x≈970-1465, y≈2085-2185) para poder mostrar el número mucho más grande.
const PLATE_X = 968;
const PLATE_Y = 2028;
const PLATE_W = 502;
const PLATE_H = 164;
const PLATE_LABEL_Y = 2076; // línea base de "TICKET N°"
const PLATE_NUMBER_Y = 2172; // línea base del número
const TICKET_MAX_FONT = 118; // tamaño máximo del número (px); se reduce si no cabe
const QR_POS_X = 1003;
const QR_POS_Y = 2220; // Ajusta para ubicar el QR en el recuadro blanco
const QR_SIZE = 410; // Tamaño del QR (ancho y alto)

// ESTILOS DE TEXTO
const NAME_FONT = 'bold 80px Arial, sans-serif';
const DATE_FONT = 'bold 45px Arial, sans-serif';
const TICKET_FONT_FAMILY = '"Courier New", Courier, monospace';
const TEXT_COLOR = '#0f151f';
// -------------------------------------------------------------

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Placa crema con borde dorado que cubre el recuadro original y muestra el
// número de ticket en grande (se achica solo si tiene muchos dígitos).
function drawTicketPlate(ctx: CanvasRenderingContext2D, ticketNumber: string) {
  const fill = ctx.createLinearGradient(0, PLATE_Y, 0, PLATE_Y + PLATE_H);
  fill.addColorStop(0, '#fdf3bd');
  fill.addColorStop(1, '#f4e49c');
  const border = ctx.createLinearGradient(PLATE_X, PLATE_Y, PLATE_X + PLATE_W, PLATE_Y + PLATE_H);
  border.addColorStop(0, '#f6dc8a');
  border.addColorStop(0.5, '#b98a2a');
  border.addColorStop(1, '#f3d27a');

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  roundedRectPath(ctx, PLATE_X, PLATE_Y, PLATE_W, PLATE_H, 30);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  roundedRectPath(ctx, PLATE_X, PLATE_Y, PLATE_W, PLATE_H, 30);
  ctx.lineWidth = 8;
  ctx.strokeStyle = border;
  ctx.stroke();

  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = 'center';
  const centerX = PLATE_X + PLATE_W / 2;

  ctx.font = 'bold 40px Arial, sans-serif';
  ctx.fillText('TICKET N°', centerX, PLATE_LABEL_Y);

  let size = TICKET_MAX_FONT;
  ctx.font = `bold ${size}px ${TICKET_FONT_FAMILY}`;
  const maxWidth = PLATE_W - 60;
  while (size > 40 && ctx.measureText(ticketNumber).width > maxWidth) {
    size -= 4;
    ctx.font = `bold ${size}px ${TICKET_FONT_FAMILY}`;
  }
  ctx.fillText(ticketNumber, centerX, PLATE_NUMBER_Y);
  ctx.textAlign = 'left';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function TicketDownloadButton({
  raffleId,
  ticketNumber,
  buyerName,
  purchaseDate,
  status,
  variant = 'default',
  showPreview,
  templateUrlOverride,
}: TicketDownloadButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isSaveHelpOpen, setIsSaveHelpOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  // Blob del PNG ya generado: se prepara de antemano para poder llamar a
  // navigator.share() dentro del gesto del usuario (iOS lo exige).
  const blobRef = useRef<Blob | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIos(
      /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }, []);

  const isPaid = status === 'paid';
  const inlinePreview = showPreview ?? variant === 'default';

  const generateTicketDataUrl = useCallback(async (): Promise<string | null> => {
    if (!isPaid || !canvasRef.current) return null;

    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2D context');

      // 1. Cargar la imagen de la plantilla específica de este sorteo
      const primarySrc =
        templateUrlOverride ||
        `/api/raffles/${encodeURIComponent(raffleId)}/ticket-template`;

      let image: HTMLImageElement;
      try {
        image = await loadImage(primarySrc);
      } catch {
        image = await loadImage('/ticket-template.png');
      }

      // Siempre usar el espacio de coordenadas estándar (1536 x 2752)
      // para que los textos y el QR queden exactamente en su sitio
      canvas.width = TEMPLATE_WIDTH;
      canvas.height = TEMPLATE_HEIGHT;

      // 2. Dibujar la imagen base
      ctx.drawImage(image, 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);

      // 3. Escribir Datos del Comprador
      ctx.fillStyle = TEXT_COLOR;

      // Nombre (con Word Wrap)
      ctx.font = NAME_FONT;
      const MAX_TEXT_WIDTH = 820; // El espacio real antes del QR
      const LINE_HEIGHT = 90; // Separación para la fuente de 80px

      const safeBuyerName = (buyerName || 'Cliente').trim();
      const words = safeBuyerName.split(' ');
      let currentLine = '';
      let currentY = NAME_POS_Y;

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        const metrics = ctx.measureText(testLine);

        if (metrics.width > MAX_TEXT_WIDTH && i > 0) {
          ctx.fillText(currentLine, NAME_POS_X, currentY);
          currentLine = words[i] + ' ';
          currentY += LINE_HEIGHT;
        } else {
          currentLine = testLine;
        }
      }
      // Dibujar la última línea
      ctx.fillText(currentLine, NAME_POS_X, currentY);

      // Fecha
      ctx.font = DATE_FONT;
      ctx.fillText(purchaseDate, DATE_POS_X, DATE_POS_Y);

      // Número del Ticket (placa grande sobre el recuadro de la plantilla)
      drawTicketPlate(ctx, ticketNumber);

      // 4. Generar el QR
      const verifyUrl = `${window.location.origin}/verify?ticket=${encodeURIComponent(ticketNumber)}&raffle=${encodeURIComponent(raffleId)}`;

      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, verifyUrl, {
        width: QR_SIZE,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // Dibujar el QR en nuestro canvas principal
      ctx.drawImage(qrCanvas, QR_POS_X, QR_POS_Y, QR_SIZE, QR_SIZE);

      const dataUrl = canvas.toDataURL('image/png');
      blobRef.current = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      setPreviewDataUrl(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('Error generando el ticket:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [isPaid, raffleId, ticketNumber, buyerName, purchaseDate, templateUrlOverride]);

  // Generar automáticamente la vista previa cuando está en modo inlinePreview o se abre el modal
  useEffect(() => {
    if (isPaid && (inlinePreview || isModalOpen)) {
      generateTicketDataUrl();
    }
  }, [isPaid, inlinePreview, isModalOpen, generateTicketDataUrl]);

  const handleDownload = async () => {
    if (!isPaid) return;

    let dataUrl = previewDataUrl;
    if (!dataUrl) {
      dataUrl = await generateTicketDataUrl();
    }

    if (!dataUrl) {
      alert('Hubo un error al generar la boleta. Inténtalo de nuevo.');
      return;
    }

    const fileName = `Boleta_Sorteo_${ticketNumber}.png`;
    const blob = blobRef.current;

    // iPhone/iPad: <a download> con data: URL no guarda la imagen (abre la misma
    // pestaña o la manda a Archivos). Se usa el menú nativo "Guardar imagen".
    if (isIos) {
      if (blob) {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `Boleta #${ticketNumber}` });
            return;
          } catch (err) {
            // El usuario cerró el menú: no hay nada más que hacer
            if ((err as DOMException)?.name === 'AbortError') return;
          }
        }
      }
      // Sin soporte (p. ej. navegador interno de WhatsApp/Instagram): guía manual
      setIsSaveHelpOpen(true);
      return;
    }

    // Resto de plataformas: descarga normal (blob URL, más fiable que data: URL)
    const objectUrl = blob ? URL.createObjectURL(blob) : dataUrl;
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (blob) setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  };

  const saveHelpModal =
    isSaveHelpOpen && previewDataUrl ? (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md text-left"
        onClick={() => setIsSaveHelpOpen(false)}
      >
        <div
          className="relative max-h-[94vh] w-full max-w-sm flex flex-col items-center gap-3 rounded-2xl bg-[#0f151f] border border-white/15 p-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex w-full items-center justify-between border-b border-white/10 pb-2.5">
            <span className="text-sm font-black text-white">Guarda tu boleta #{ticketNumber}</span>
            <button
              type="button"
              onClick={() => setIsSaveHelpOpen(false)}
              className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-zinc-300 text-center">
            Mantén presionada la imagen y elige{' '}
            <strong className="text-emerald-400">Guardar en Fotos</strong> (o «Agregar a Fotos»).
          </p>
          <div className="overflow-y-auto max-h-[64vh] w-full flex justify-center rounded-xl bg-black/50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewDataUrl}
              alt={`Boleta #${ticketNumber}`}
              className="w-auto max-w-full object-contain rounded-lg"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsSaveHelpOpen(false)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Listo
          </button>
        </div>
      </div>
    ) : null;

  if (!isPaid) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center">
        <p className="text-sm font-bold text-zinc-400">
          Tu boleta debe estar pagada para poder descargarla.
        </p>
      </div>
    );
  }

  // MODO 1: Vista previa inline (Checkout Paso 3 o vista principal)
  if (inlinePreview) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        {/* Canvas Oculto para la composición */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Tarjeta de Vista Previa */}
        <div className="w-full rounded-2xl border border-emerald-500/25 bg-[#0a0f16] p-3 shadow-[0_0_25px_rgba(16,185,129,0.12)]">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>🎟️</span> Boleta #{ticketNumber}
            </span>
            {previewDataUrl && (
              <button
                type="button"
                onClick={() => setIsZoomOpen(true)}
                className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>🔍</span> Ampliar
              </button>
            )}
          </div>

          {isGenerating && !previewDataUrl ? (
            <div className="w-full aspect-[9/16] max-h-72 mx-auto rounded-xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full border-t-2 border-emerald-400 animate-spin" />
              <span className="text-xs font-bold text-zinc-400">
                Generando vista previa de tu boleta...
              </span>
            </div>
          ) : previewDataUrl ? (
            <div
              onClick={() => setIsZoomOpen(true)}
              className="relative mx-auto overflow-hidden rounded-xl border border-white/10 bg-black/40 cursor-zoom-in group max-h-80 flex justify-center"
              title="Haz clic para ver en tamaño completo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewDataUrl}
                alt={`Vista previa Boleta #${ticketNumber}`}
                className="max-h-80 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute bottom-2 right-2 rounded-full bg-black/75 border border-white/15 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm opacity-80 group-hover:opacity-100">
                🔍 Toca para ampliar
              </div>
            </div>
          ) : null}

          {/* Botón de Descarga debajo del Preview */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="mt-3 group relative inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3.5 font-black text-sm text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98] disabled:scale-100 disabled:opacity-70 disabled:cursor-wait"
          >
            <span className="text-lg drop-shadow-md">⬇️</span>
            <span className="relative z-10">
              {isGenerating ? 'Generando...' : `Descargar Boleta #${ticketNumber}`}
            </span>
          </button>
          {isIos && (
            <p className="mt-2 text-center text-[11px] text-zinc-400">
              📱 En iPhone se abrirá un menú: elige <strong className="text-zinc-200">Guardar imagen</strong> para enviarla a Fotos.
            </p>
          )}
        </div>

        {saveHelpModal}

        {/* Lightbox para ver en grande */}
        {isZoomOpen && previewDataUrl && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
            onClick={() => setIsZoomOpen(false)}
          >
            <div
              className="relative max-h-[92vh] max-w-md w-full flex flex-col items-center gap-3 rounded-2xl bg-[#0f151f] border border-white/15 p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex w-full items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <span className="text-emerald-400">🎟️</span> Vista Previa Boleta #{ticketNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto max-h-[72vh] w-full flex justify-center rounded-xl bg-black/50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewDataUrl}
                  alt={`Boleta #${ticketNumber}`}
                  className="max-h-[68vh] w-auto object-contain rounded-lg"
                />
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3.5 text-sm font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:opacity-95"
              >
                <span>⬇️</span> Descargar Boleta #{ticketNumber}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MODO 2: Botón pequeño (ej. Tabla de Admin) -> Abre Modal de Vista Previa con botón Descargar
  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      {saveHelpModal}

      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={isGenerating}
        className="group relative inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 font-bold text-emerald-400 text-xs shadow-sm transition-all hover:bg-emerald-500 hover:text-white active:scale-95 disabled:opacity-50"
      >
        <span>👁️</span>
        <span>Ver / Descargar</span>
      </button>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md text-left"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#0f151f] border border-white/15 p-5 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="text-emerald-400">🎟️</span> Boleta #{ticketNumber}
                </h3>
                <p className="text-xs text-zinc-400">Titular: {buyerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="w-full flex justify-center items-center bg-[#0a0f16] rounded-xl border border-white/10 p-2 min-h-[280px] max-h-[62vh] overflow-y-auto">
              {isGenerating && !previewDataUrl ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <div className="h-8 w-8 rounded-full border-t-2 border-emerald-400 animate-spin" />
                  <span className="text-xs font-bold text-zinc-400">Generando vista previa...</span>
                </div>
              ) : previewDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDataUrl}
                  alt={`Vista previa Boleta #${ticketNumber}`}
                  className="max-h-[58vh] w-auto object-contain rounded-lg"
                />
              ) : (
                <span className="text-xs text-red-400">No se pudo generar la vista previa.</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating || !previewDataUrl}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-xs font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:opacity-95 disabled:opacity-50"
              >
                <span>⬇️</span>
                <span>{isGenerating ? 'Generando...' : `Descargar Boleta #${ticketNumber}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
