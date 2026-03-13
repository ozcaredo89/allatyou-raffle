import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Solo permitimos mutar nombre, descripción y el estado actual ('active', 'paused', 'completed', etc.)
    const { name, description, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Raffle ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
       return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
    }

    const { error } = await supabase
      .from('rafle_raffles')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating raffle:', error);
      return NextResponse.json(
        { error: 'Failed to update raffle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update raffle unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating raffle' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next.js App Router, params acts as a Promise containing the slugs
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Raffle ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('rafle_raffles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting raffle:', error);
      return NextResponse.json(
        { error: 'Failed to delete raffle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete raffle unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting raffle' },
      { status: 500 }
    );
  }
}
