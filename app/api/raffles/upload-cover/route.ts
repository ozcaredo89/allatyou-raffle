import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/app/lib/admin-auth';

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

    if (!raffle_id || !file) {
      return NextResponse.json({ error: 'raffle_id and file are required' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `raffle-covers/${raffle_id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ContentLength: buffer.byteLength,
    }));

    // cover_image_url column migration must be run in Supabase — see implementation_plan.md
    const cover_image_url = `${process.env.R2_PUBLIC_URL!.replace(/\/$/, '')}/${fileName}`;

    return NextResponse.json({ success: true, cover_image_url });
  } catch (error: unknown) {
    console.error('upload-cover error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}