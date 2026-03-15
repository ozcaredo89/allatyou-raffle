import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendAdminValidationEmail } from '@/app/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { ticket_id, action } = await request.json();

    if (!ticket_id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid payload: required ticket_id and action (approve | reject)' },
        { status: 400 }
      );
    }

    // First fetch ticket details including customer and raffle info for the email
    const { data: ticket, error: fetchError } = await supabase
      .from('rafle_tickets')
      .select(`
        id,
        ticket_number,
        status,
        customer_id,
        raffle_id
      `)
      .eq('id', ticket_id)
      .single();

    if (fetchError || !ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado.' }, { status: 404 });
    }

    if (action === 'reject') {
      const { error: updateError } = await supabase
        .from('rafle_tickets')
        .update({
          status: 'available',
          customer_id: null,
          reserved_at: null,
          payment_proof_url: null,
        })
        .eq('id', ticket_id);

      if (updateError) throw updateError;
      
      return NextResponse.json({ success: true, message: 'Ticket liberado exitosamente.' });
    }

    if (action === 'approve') {
      const { error: updateError } = await supabase
        .from('rafle_tickets')
        .update({
          status: 'paid',
        })
        .eq('id', ticket_id);

      if (updateError) throw updateError;

      // Send email if Customer and Raffle can be found
      try {
         const { data: customer } = await supabase.from('rafle_customers').select('name').eq('id', ticket.customer_id).single();
         const { data: raffle } = await supabase.from('rafle_raffles').select('name').eq('id', ticket.raffle_id).single();
         
         if (customer && raffle) {
           await sendAdminValidationEmail({
             subject: `Pago Confirmado: Ticket #${ticket.ticket_number}`,
             raffleName: raffle.name,
             ticketNumber: String(ticket.ticket_number),
             customerName: customer.name,
           });
         }
      } catch (e) {
         console.warn('Could not send validation email:', e);
      }

      return NextResponse.json({ success: true, message: 'Ticket aprobado exitosamente.' });
    }

    // Fallback if action is somehow not caught
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Validation route unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
