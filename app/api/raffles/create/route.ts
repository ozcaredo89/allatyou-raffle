import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CreateRaffleBody {
  name: string;
  description?: string;
  price_per_ticket: number;
  start_ticket: number;
  end_ticket: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateRaffleBody = await request.json();
    const { name, description, price_per_ticket, start_ticket, end_ticket } = body;

    // 1. Basic Validation
    if (!name || !price_per_ticket || start_ticket === undefined || end_ticket === undefined || start_ticket > end_ticket) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: name, price, start_ticket, end_ticket' },
        { status: 400 }
      );
    }

    const total_tickets = end_ticket - start_ticket + 1;

    // 2. Insert new Raffle
    const { data: raffle, error: raffleError } = await supabase
      .from('rafle_raffles')
      .insert({
        name,
        description: description || null,
        price_per_ticket,
        total_tickets,
        start_ticket,
        end_ticket,
        status: 'active',
      })
      .select('id')
      .single();

    if (raffleError || !raffle) {
      console.error('Error creating raffle:', raffleError);
      return NextResponse.json(
        { error: 'Failed to create raffle in database' },
        { status: 500 }
      );
    }

    const raffle_id = raffle.id;

    // 3. Generate tickets in memory
    // Calculate string length for zero padding based on the highest number (end_ticket)
    const digits = String(end_ticket).length;
    
    const ticketsToInsert = Array.from({ length: total_tickets }, (_, i) => ({
      raffle_id,
      ticket_number: String(start_ticket + i).padStart(digits, '0'),
      status: 'available',
    }));

    // 4. Bulk insert tickets
    // Supabase supports bulk inserts by passing an array of objects
    const { error: ticketsError } = await supabase
      .from('rafle_tickets')
      .insert(ticketsToInsert);

    if (ticketsError) {
      console.error('Error bulk inserting tickets:', ticketsError);
      
      // Optional: Since there are no SQL transactions in standard REST Supabase JS,
      // if ticket generation fails, it's a good practice to log or attempt rollback.
      await supabase.from('rafle_raffles').delete().eq('id', raffle_id);

      return NextResponse.json(
        { error: 'Failed to generate tickets' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, raffle_id },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Create raffle unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating raffle' },
      { status: 500 }
    );
  }
}
