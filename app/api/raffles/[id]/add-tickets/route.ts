import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: raffle_id } = await params;
    const { custom_numbers } = await request.json();

    if (!raffle_id) {
      return NextResponse.json({ error: 'Raffle ID is required' }, { status: 400 });
    }

    if (!custom_numbers || !Array.isArray(custom_numbers) || custom_numbers.length === 0) {
      return NextResponse.json({ error: 'custom_numbers array is required and cannot be empty' }, { status: 400 });
    }

    const uniqueNumbers = Array.from(new Set(custom_numbers.map(String)));
    
    // Check if new numbers all share the exact same character length
    const firstLen = uniqueNumbers[0].length;
    if (!uniqueNumbers.every(n => n.length === firstLen)) {
      return NextResponse.json({ error: 'Todos los números deben tener la misma cantidad de caracteres.' }, { status: 400 });
    }

    // Check if any of these numbers already exist for this raffle
    const { data: existingTickets, error: fetchError } = await supabase
      .from('rafle_tickets')
      .select('ticket_number')
      .eq('raffle_id', raffle_id)
      .in('ticket_number', uniqueNumbers);

    if (fetchError) {
      console.error('Error fetching existing tickets:', fetchError);
      return NextResponse.json({ error: 'Error verificando tickets existentes' }, { status: 500 });
    }

    if (existingTickets && existingTickets.length > 0) {
      const duplicates = existingTickets.map(t => t.ticket_number).join(', ');
      return NextResponse.json({ 
        error: `Los siguientes números ya existen en esta rifa: ${duplicates}` 
      }, { status: 409 });
    }

    // Insert the new tickets
    const ticketsToInsert = uniqueNumbers.map(ticket_number => ({
      raffle_id,
      ticket_number,
      status: 'available',
    }));

    const { error: insertError } = await supabase
      .from('rafle_tickets')
      .insert(ticketsToInsert);

    if (insertError) {
      console.error('Error insert new tickets:', insertError);
      return NextResponse.json({ error: 'Error al insertar los nuevos tickets' }, { status: 500 });
    }

    return NextResponse.json({ success: true, added: uniqueNumbers.length });

  } catch (error: any) {
    console.error('Add tickets unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error while adding tickets' },
      { status: 500 }
    );
  }
}
