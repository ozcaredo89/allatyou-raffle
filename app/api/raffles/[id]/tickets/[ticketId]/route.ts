import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// PATCH: Editar una boleta específica
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
): Promise<NextResponse> {
  try {
    const { id: raffleId, ticketId } = await params;
    const body = await request.json();
    const { ticket_number, status } = body;

    if (!ticket_number && !status) {
      return NextResponse.json(
        { error: 'At least one field (ticket_number or status) is required' },
        { status: 400 }
      );
    }

    // Validar que el estado sea válido
    const validStatuses = ['available', 'reserved', 'pending', 'paid'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Preparar objeto de actualización
    const updateData: Record<string, any> = {};
    if (ticket_number !== undefined) updateData.ticket_number = ticket_number;
    if (status !== undefined) updateData.status = status;

    // Actualizar la boleta
    const { data: updatedTicket, error: updateError } = await supabase
      .from('rafle_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .eq('raffle_id', raffleId)
      .select('id, raffle_id, ticket_number, status, customer_id, payment_proof_url, reserved_at, admin_notes');

    if (updateError) {
      console.error('Ticket update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      );
    }

    if (!updatedTicket || updatedTicket.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: updatedTicket[0], message: 'Ticket updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/raffles/[id]/tickets/[ticketId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una boleta específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
): Promise<NextResponse> {
  try {
    const { id: raffleId, ticketId } = await params;

    // Eliminar la boleta
    const { data: deletedTicket, error: deleteError } = await supabase
      .from('rafle_tickets')
      .delete()
      .eq('id', ticketId)
      .eq('raffle_id', raffleId)
      .select('id, ticket_number');

    if (deleteError) {
      console.error('Ticket delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete ticket' },
        { status: 500 }
      );
    }

    if (!deletedTicket || deletedTicket.length === 0) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: deletedTicket[0], message: 'Ticket deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/raffles/[id]/tickets/[ticketId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
