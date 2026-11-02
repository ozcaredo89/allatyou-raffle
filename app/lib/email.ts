import { Resend } from 'resend';

const resend = new Resend(process.env.ALLATYOU_RESEND_API_KEY!);

interface SendAdminEmailProps {
  subject: string;
  raffleName: string;
  ticketNumber: string;
  customerName: string;
}

export async function sendAdminValidationEmail({
  subject,
  raffleName,
  ticketNumber,
  customerName,
}: SendAdminEmailProps) {
  const adminEmail = process.env.ALLATYOU_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const fromEmail = process.env.ALLATYOU_RESEND_FROM || 'AllAtYou Raffles <onboarding@resend.dev>';
  
  if (!adminEmail) {
    console.warn('ALLATYOU_ADMIN_EMAIL is not defined in environment variables. Skipped sending email.');
    return null;
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [adminEmail],
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">Pago Validado y Aprobado</h2>
          <p>Un pago ha sido validado con éxito para la rifa <strong>${raffleName}</strong>.</p>
          <ul>
            <li><strong>Ticket:</strong> ${ticketNumber}</li>
            <li><strong>Cliente:</strong> ${customerName}</li>
          </ul>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            Este es un correo automático del sistema de administración.
          </p>
        </div>
      `,
    });
    
    return data;
  } catch (error) {
    console.error('Error sending Resend email:', error);
    return null;
  }
}

interface SendTicketTemplateEmailProps {
  raffleId: string;
  raffleName: string;
  imageUrl: string;
  fileName: string;
  fileBuffer: Buffer;
  isFinalTemplate: boolean;
}

export async function sendTicketTemplateEmail({
  raffleId,
  raffleName,
  imageUrl,
  fileName,
  fileBuffer,
  isFinalTemplate,
}: SendTicketTemplateEmailProps) {
  const adminEmail = process.env.ALLATYOU_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const fromEmail = process.env.ALLATYOU_RESEND_FROM || 'AllAtYou Raffles <onboarding@resend.dev>';

  if (!adminEmail) {
    console.warn('ALLATYOU_ADMIN_EMAIL is not defined in environment variables. Skipped sending template email.');
    return null;
  }

  const modeLabel = isFinalTemplate
    ? 'Plantilla activa (ya aplicada al sorteo)'
    : 'Imagen de referencia (pendiente de acomodar en el template 1536×2752 px)';

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: [adminEmail],
      subject: `🎟️ Imagen para Plantilla de Boleta - ${raffleName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1f2937; max-width: 600px;">
          <h2 style="color: #2563eb; margin-bottom: 8px;">Imagen de Boleta para Sorteo</h2>
          <p style="margin-top: 0; color: #4b5563;">
            Se ha subido una imagen para las boletas del sorteo <strong>${raffleName}</strong>.
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 14px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Sorteo:</strong> ${raffleName}</p>
            <p style="margin: 4px 0;"><strong>ID del Sorteo:</strong> <code>${raffleId}</code></p>
            <p style="margin: 4px 0;"><strong>Estado:</strong> ${modeLabel}</p>
            <p style="margin: 4px 0;"><strong>Dimensiones recomendadas del template:</strong> 1536 × 2752 px (9:16 vertical)</p>
          </div>
          <p>
            La imagen viene adjunta en este correo y también puedes descargarla directamente desde este enlace:
          </p>
          <p style="margin: 16px 0;">
            <a href="${imageUrl}" target="_blank" style="background: #10b981; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; display: inline-block;">
              Descargar Imagen Original
            </a>
          </p>
          <p style="font-size: 13px; color: #4b5563;">
            Una vez tengas lista la plantilla ajustada, entra al panel de administración (<strong>Gestión de Sorteos → Plantilla Boleta</strong>) para subir la versión definitiva de este sorteo.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: fileBuffer,
        },
      ],
    });

    return data;
  } catch (error) {
    console.error('Error sending ticket template email:', error);
    return null;
  }
}
