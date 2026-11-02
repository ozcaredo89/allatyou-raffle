import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/app/lib/supabase-admin';
import { requireAdminSession } from '@/app/lib/admin-auth';

function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')    // remove special chars
    .trim()
    .replace(/\s+/g, '-')            // spaces to hyphens
    .replace(/-+/g, '-');            // collapse multiple hyphens
}

interface CreateRaffleBody {
  name: string;
  description?: string;
  price_per_ticket: number;
  start_ticket?: number;
  end_ticket?: number;
  custom_numbers?: string[];
  slug?: string;
  is_featured?: boolean;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const body: CreateRaffleBody = await request.json();
    const { name, description, price_per_ticket, start_ticket, end_ticket, custom_numbers, slug: rawSlug, is_featured } = body;

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

    // Normalize slug
    const slug = rawSlug ? normalizeSlug(rawSlug) : normalizeSlug(name);

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
        slug,
        is_featured: is_featured ?? false,
      })
      .select('id')
      .single();

    if (raffleError || !raffle) {
      // Slug unique constraint violation
      if (raffleError?.code === '23505') {
        return NextResponse.json(
          { error: 'slug_conflict', suggestion: `${slug}-2` },
          { status: 409 }
        );
      }
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
    const { error: ticketsError } = await supabase
      .from('rafle_tickets')
      .insert(ticketsToInsert);

    if (ticketsError) {
      console.error('Error bulk inserting tickets:', ticketsError);
      await supabase.from('rafle_raffles').delete().eq('id', raffle_id);
      return NextResponse.json(
        { error: 'Failed to generate tickets' },
        { status: 500 }
      );
    }

    // 5. If featured, call set_featured_raffle RPC
    // Requires set_featured_raffle() RPC — see implementation_plan.md for SQL
    if (is_featured === true) {
      const { error: rpcError } = await supabase.rpc('set_featured_raffle', { p_raffle_id: raffle_id });
      if (rpcError) {
        console.warn('set_featured_raffle RPC error (non-fatal):', rpcError);
      }
    }

    return NextResponse.json(
      { success: true, raffle_id },
      { status: 201 }
    );
    
  } catch (error: unknown) {
    console.error('Create raffle unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating raffle' },
      { status: 500 }
    );
  }
}
