import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// DELETE: Eliminar múltiples boletas
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: raffleId } = await params;
    const body = await request.json();
    const { ticketIds } = body;

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return NextResponse.json(
        { error: 'ticketIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Eliminar múltiples boletas
    const { data: deletedTickets, error: deleteError } = await supabase
      .from('rafle_tickets')
      .delete()
      .eq('raffle_id', raffleId)
      .in('id', ticketIds)
      .select('id, ticket_number');

    if (deleteError) {
      console.error('Bulk ticket delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete tickets' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: deletedTickets,
        message: `${deletedTickets?.length || 0} ticket(s) deleted successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/raffles/[id]/tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
