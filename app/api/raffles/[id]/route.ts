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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    
    const { name, description, status, slug: rawSlug, is_featured, cover_image_url } = body;

    if (!id) {
      return NextResponse.json({ error: 'Raffle ID is required' }, { status: 400 });
    }

    if (is_featured === true) {
      const { error: rpcError } = await supabase.rpc('set_featured_raffle', { p_raffle_id: id });
      if (rpcError) {
        console.warn('set_featured_raffle RPC error (non-fatal):', rpcError);
      }
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (rawSlug !== undefined) updates.slug = normalizeSlug(rawSlug);
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (cover_image_url !== undefined) updates.cover_image_url = cover_image_url;

    if (Object.keys(updates).length === 0) {
       return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
    }

    const { error } = await supabase
      .from('rafle_raffles')
      .update(updates)
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'slug_conflict' }, { status: 409 });
      }
      console.error('Error updating raffle:', error);
      return NextResponse.json(
        { error: 'Failed to update raffle' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Update raffle unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating raffle' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;

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
  } catch (error: unknown) {
    console.error('Delete raffle unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error while deleting raffle' },
      { status: 500 }
    );
  }
}