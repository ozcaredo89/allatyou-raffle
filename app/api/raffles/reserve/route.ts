import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ReserveRequestBody {
  raffle_id: string;
  ticket_number: string;
  customer_name: string;
  customer_phone: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ReserveRequestBody = await request.json();
    const { raffle_id, ticket_number, customer_name, customer_phone } = body;

    if (!raffle_id || !ticket_number || !customer_name || !customer_phone) {
      return NextResponse.json(
        { error: 'Missing required fields: raffle_id, ticket_number, customer_name, customer_phone' },
        { status: 400 }
      );
    }

    // Step 1: Upsert customer — retrieve existing by phone or insert new
    const { data: existingCustomer } = await supabase
      .from('rafle_customers')
      .select('id')
      .eq('phone', customer_phone)
      .maybeSingle();

    let customer_id: string;

    if (existingCustomer) {
      customer_id = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('rafle_customers')
        .insert({ name: customer_name, phone: customer_phone })
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        console.error('Customer insert error:', customerError);
        return NextResponse.json(
          { error: 'Failed to create customer record' },
          { status: 500 }
        );
      }

      customer_id = newCustomer.id;
    }

    // Step 2: Optimistic UPDATE — only succeeds if ticket is still 'available'
    const { data: updatedTickets, error: updateError } = await supabase
      .from('rafle_tickets')
      .update({
        status: 'reserved',
        customer_id,
        reserved_at: new Date().toISOString(),
      })
      .eq('raffle_id', raffle_id)
      .eq('ticket_number', ticket_number)
      .eq('status', 'available')
      .select('id, ticket_number, status');

    if (updateError) {
      console.error('Ticket update error:', updateError);
      return NextResponse.json(
        { error: 'Database error while reserving ticket' },
        { status: 500 }
      );
    }

    // If no rows were updated, ticket is no longer available (conflict)
    if (!updatedTickets || updatedTickets.length === 0) {
      return NextResponse.json(
        { error: 'Ticket is no longer available. It may have been reserved by someone else.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ticket: updatedTickets[0],
        customer_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reserve route unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
