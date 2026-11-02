import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/app/lib/admin-auth';
import { supabaseAdmin as supabase } from '@/app/lib/supabase-admin';
import { sendTicketTemplateEmail } from '@/app/lib/email';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authError = requireAdminSession(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const raffle_id = formData.get('raffle_id') as string | null;
    const file = formData.get('file') as File | null;
    const send_email = formData.get('send_email') === 'true';
    const is_final_template = formData.get('is_final_template') !== 'false';

    if (!raffle_id || !file) {
      return NextResponse.json({ error: 'raffle_id and file are required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'png';
    const timestamp = Date.now();
    const publicKey = `raffle-templates/${raffle_id}_${timestamp}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Save timestamped copy for public URL / email link
    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: publicKey,
        Body: buffer,
        ContentType: file.type,
        ContentLength: buffer.byteLength,
      })
    );

    const ticket_template_url = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${publicKey}`;

    // 2. If it is the active template for this raffle, save to canonical key `raffle-templates/{raffle_id}`
    if (is_final_template) {
      const canonicalKey = `raffle-templates/${raffle_id}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: canonicalKey,
          Body: buffer,
          ContentType: file.type,
          ContentLength: buffer.byteLength,
        })
      );

      // Best-effort update in Supabase if `ticket_template_url` column exists
      try {
        await supabase
          .from('rafle_raffles')
          .update({ ticket_template_url })
          .eq('id', raffle_id);
      } catch (dbErr) {
        console.warn('Optional ticket_template_url DB update skipped:', dbErr);
      }
    }

    // 3. Optionally email the image to the admin so they can adjust it into the template
    let emailSent = false;
    if (send_email) {
      const { data: raffle } = await supabase
        .from('rafle_raffles')
        .select('name')
        .eq('id', raffle_id)
        .maybeSingle();

      const raffleName = raffle?.name || `Sorteo ${raffle_id}`;
      const emailResult = await sendTicketTemplateEmail({
        raffleId: raffle_id,
        raffleName,
        imageUrl: ticket_template_url,
        fileName: `plantilla_${raffle_id}.${ext}`,
        fileBuffer: buffer,
        isFinalTemplate: is_final_template,
      });
      emailSent = Boolean(emailResult);
    }

    return NextResponse.json({
      success: true,
      ticket_template_url,
      applied: is_final_template,
      emailed: emailSent,
    });
  } catch (error: unknown) {
    console.error('upload-template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
