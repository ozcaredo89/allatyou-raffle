'use client';

import { useRef, useState } from 'react';
import QRCode from 'qrcode';

interface TicketDownloadButtonProps {
  raffleId: string;
  ticketNumber: string;
  buyerName: string;
  purchaseDate: string;
  status: string; // 'available', 'reserved', 'pending', 'paid'
  variant?: 'default' | 'small';
}

// -------------------------------------------------------------
// CONSTANTES DE DIBUJO (AJÚSTALAS SEGÚN TU DISEÑO)
// Basado en plantilla vertical 9:16 (Ej. 1080 x 1920 px)
// -------------------------------------------------------------
const TEMPLATE_WIDTH = 1536;
const TEMPLATE_HEIGHT = 2752;

// RECUADRO IZQUIERDO (Comprador y Fecha)
const NAME_POS_X = 130;
const NAME_POS_Y = 2255; // Ajusta para que quede sobre la 1ra línea
const DATE_POS_X = 306;
const DATE_POS_Y = 2550; // Ajusta para que quede sobre las líneas ___/___/___

// RECUADRO DERECHO (Ticket y QR)
const TICKET_POS_X = 1280;
const TICKET_POS_Y = 2150; // Ajusta para que quede sobre la línea corta
const QR_POS_X = 1003;
const QR_POS_Y = 2220; // Ajusta para ubicar el QR en el recuadro blanco
const QR_SIZE = 410; // Tamaño del QR (ancho y alto)

// ESTILOS DE TEXTO
const NAME_FONT = 'bold 80px Arial, sans-serif'; 
const DATE_FONT = 'bold 45px Arial, sans-serif';
const TICKET_FONT = 'bold 70px "Courier New", Courier, monospace';
const TEXT_COLOR = '#0f151f';
// -------------------------------------------------------------

export default function TicketDownloadButton({
  raffleId,
  ticketNumber,
  buyerName,
  purchaseDate,
  status,
  variant = 'default',
}: TicketDownloadButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const isPaid = status === 'paid';

  const handleDownload = async () => {
    if (!isPaid || !canvasRef.current) return;

    setIsGenerating(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2D context');

      // 1. Cargar la imagen de la plantilla
      const image = new Image();
      image.src = '/ticket-template.png'; // Asegúrate de tener este archivo en la carpeta 'public'
      
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      // Asegurar proporciones correctas en el canvas (basado en la plantilla)
      canvas.width = image.width || TEMPLATE_WIDTH;
      canvas.height = image.height || TEMPLATE_HEIGHT;

      // 2. Dibujar la imagen base
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // 3. Escribir Datos del Comprador
      ctx.fillStyle = TEXT_COLOR;
      
      // Nombre (con Word Wrap)
      ctx.font = NAME_FONT;
      const MAX_TEXT_WIDTH = 820; // El espacio real antes del QR
      const LINE_HEIGHT = 90; // Separación para la fuente de 80px

      const words = buyerName.split(' ');
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

      // Número del Ticket
      ctx.font = TICKET_FONT;
      ctx.fillText(ticketNumber, TICKET_POS_X, TICKET_POS_Y);

      // 4. Generar el QR
      const verifyUrl = `${window.location.origin}/verify?ticket=${encodeURIComponent(ticketNumber)}&raffle=${encodeURIComponent(raffleId)}`;
      
      // Creamos un canvas temporal para el QR
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, verifyUrl, {
        width: QR_SIZE,
        margin: 1, // Borde mínimo
        color: {
          dark: '#000000', // Código QR negro
          light: '#ffffff' // Fondo del QR blanco
        }
      });

      // Dibujar el QR en nuestro canvas principal
      ctx.drawImage(qrCanvas, QR_POS_X, QR_POS_Y, QR_SIZE, QR_SIZE);

      // 5. Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Boleta_Sorteo_${ticketNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Error generando el ticket:', err);
      alert('Hubo un error al generar la boleta. Inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isPaid) {
    return (
      <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-center">
        <p className="text-sm font-bold text-zinc-400">
          Tu boleta debe estar pagada para poder descargarla.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Canvas Oculto para la composición */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Botón Principal */}
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className={
          variant === 'small'
            ? "group relative inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 font-bold text-emerald-400 text-xs shadow-sm transition-all hover:bg-emerald-500 hover:text-white active:scale-95 disabled:opacity-50"
            : "group relative inline-flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-6 py-4 font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98] disabled:scale-100 disabled:opacity-70 disabled:cursor-wait"
        }
      >
        {variant !== 'small' && <span className="text-2xl drop-shadow-md">🎟️</span>}
        <span className="relative z-10">
          {isGenerating ? 'Generando...' : variant === 'small' ? 'Descargar' : 'Descargar mi Boleta Oficial'}
        </span>
      </button>
    </>
  );
}
