import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ReserveRequestBody {
  raffle_id: string;
  ticket_numbers: string[];
  customer_name: string;
  customer_phone: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ReserveRequestBody = await request.json();
    const { raffle_id, ticket_numbers, customer_name, customer_phone } = body;

    if (!raffle_id || !ticket_numbers || !Array.isArray(ticket_numbers) || ticket_numbers.length === 0 || !customer_name || !customer_phone) {
      return NextResponse.json(
        { error: 'Missing required fields or empty ticket numbers array' },
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

    // Step 2: Use Supabase RPC to reserve multiple tickets atomically
    const { data: rpcData, error: rpcError } = await supabase.rpc('reserve_tickets', {
      p_raffle_id: raffle_id,
      p_customer_id: customer_id,
      p_ticket_numbers: ticket_numbers,
    });

    if (rpcError) {
      // Si el error viene de tu RAISE EXCEPTION en PostgreSQL
      if (rpcError.message.includes('Error de concurrencia')) {
        return NextResponse.json(
          { error: 'Uno o más tickets ya no están disponibles. Han sido reservados por otra persona. ¡Sé más rápido la próxima vez!' },
          { status: 409 } // Conflicto: Alguien lo compró primero
        );
      }

      // Si es un error real de la base de datos (se cayó, timeout, etc)
      console.error('RPC reserve_tickets error:', rpcError);
      return NextResponse.json(
        { error: 'Database transaction error while reserving tickets' },
        { status: 500 }
      );
    }

    if (!rpcData) { // If RPC returns false/0 meaning it failed to secure ALL tickets
      return NextResponse.json(
        { error: 'Uno o más tickets ya no están disponibles. Han sido reservados por otra persona. ¡Sé más rápido la próxima vez!' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reserved_count: ticket_numbers.length,
        customer_id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Reserve route unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
