import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();

    const ticket_numbers_str = formData.get('ticket_numbers') as string | null;
    const raffle_id = formData.get('raffle_id') as string | null;
    const file = formData.get('file') as File | null;

    if (!ticket_numbers_str || !raffle_id || !file) {
      return NextResponse.json(
        { error: 'Missing required fields: ticket_numbers, raffle_id, file' },
        { status: 400 }
      );
    }

    let ticket_numbers: string[] = [];
    try {
      ticket_numbers = JSON.parse(ticket_numbers_str);
      if (!Array.isArray(ticket_numbers) || ticket_numbers.length === 0) throw new Error();
    } catch {
      return NextResponse.json({ error: 'invalid ticket_numbers format' }, { status: 400 });
    }

    // Validate file type — only images allowed
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image (JPEG, PNG, WebP, etc.)' },
        { status: 400 }
      );
    }

    // Build a unique, collision-resistant filename using the first ticket number
    const fileExtension = file.name.split('.').pop() ?? 'jpg';
    const timestamp = Date.now();
    const fileName = `proofs/${raffle_id}/${ticket_numbers[0]}_${timestamp}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudflare R2
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        ContentLength: buffer.byteLength,
      })
    );

    // Build the public URL using the R2 public domain
    const publicUrl = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${fileName}`;

    // Update the tickets: status → 'pending', save proof URL
    const { data: updatedTickets, error: updateError } = await supabase
      .from('rafle_tickets')
      .update({
        status: 'pending',
        payment_proof_url: publicUrl,
      })
      .eq('raffle_id', raffle_id)
      .in('ticket_number', ticket_numbers)
      .select('id, ticket_number, status, payment_proof_url');

    if (updateError) {
      console.error('Ticket payment update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tickets after proof upload' },
        { status: 500 }
      );
    }

    if (!updatedTickets || updatedTickets.length === 0) {
      return NextResponse.json(
        { error: 'Tickets not found for the given raffle_id and ticket_numbers' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        ticket: updatedTickets[0],
        proof_url: publicUrl,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Upload-proof route unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
