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
  const adminEmail = process.env.ADMIN_EMAIL;
  
  if (!adminEmail) {
    console.warn('ADMIN_EMAIL is not defined in environment variables. Skipped sending email.');
    return null;
  }

  try {
    const data = await resend.emails.send({
      from: 'AllAtYou Raffles <onboarding@resend.dev>',
      to: [adminEmail],
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #10b981;">Pago Validado y Aprobado</h2>
          <p>Un pago ha sido con éxito para la rifa <strong>${raffleName}</strong>.</p>
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
