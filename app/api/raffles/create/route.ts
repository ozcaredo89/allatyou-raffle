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
  start_ticket?: number;
  end_ticket?: number;
  custom_numbers?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateRaffleBody = await request.json();
    const { name, description, price_per_ticket, start_ticket, end_ticket, custom_numbers } = body;

    // 1. Basic Validation
    const isSpecificMode = custom_numbers !== undefined && Array.isArray(custom_numbers);
    const isRangeMode = start_ticket !== undefined && end_ticket !== undefined;

    if (!name || !price_per_ticket || (!isRangeMode && !isSpecificMode)) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: name, price, and either a range or custom_numbers' },
        { status: 400 }
      );
    }

    let finalTickets: string[] = [];
    let startToSave: number | null = null;
    let endToSave: number | null = null;

    if (isSpecificMode) {
      if (custom_numbers.length === 0) {
        return NextResponse.json({ error: 'custom_numbers cannot be empty' }, { status: 400 });
      }
      const unique = Array.from(new Set(custom_numbers));
      const firstLen = unique[0].length;
      if (!unique.every(n => n.length === firstLen)) {
        return NextResponse.json({ error: 'All specific numbers must have the exact same character length' }, { status: 400 });
      }
      finalTickets = unique;
    } else {
      if (start_ticket === undefined || end_ticket === undefined) {
        return NextResponse.json({ error: 'start_ticket and end_ticket are required for range mode' }, { status: 400 });
      }
      if (start_ticket > end_ticket) {
        return NextResponse.json({ error: 'start_ticket must be <= end_ticket' }, { status: 400 });
      }
      startToSave = start_ticket;
      endToSave = end_ticket;
      
      const totalInRange = end_ticket - start_ticket + 1;
      const digits = String(end_ticket).length;
      
      finalTickets = Array.from({ length: totalInRange }, (_, i) => 
        String(start_ticket + i).padStart(digits, '0')
      );
    }

    const total_tickets = finalTickets.length;

    // 2. Insert new Raffle
    const { data: raffle, error: raffleError } = await supabase
      .from('rafle_raffles')
      .insert({
        name,
        description: description || null,
        price_per_ticket,
        total_tickets,
        start_ticket: startToSave,
        end_ticket: endToSave,
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
    const ticketsToInsert = finalTickets.map(ticket_number => ({
      raffle_id,
      ticket_number,
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
