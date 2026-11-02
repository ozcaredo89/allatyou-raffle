import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const isMeta = request.nextUrl.searchParams.get('meta') === '1';
  const canonicalKey = `raffle-templates/${id}`;

  if (isMeta) {
    try {
      const head = await r2Client.send(
        new HeadObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: canonicalKey,
        })
      );
      return NextResponse.json({
        has_custom_template: true,
        updated_at: head.LastModified?.toISOString() ?? null,
      });
    } catch {
      return NextResponse.json({
        has_custom_template: false,
        updated_at: null,
      });
    }
  }

  // Try fetching the custom template for this raffle from R2
  try {
    const r2Response = await r2Client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: canonicalKey,
      })
    );

    if (r2Response.Body) {
      const byteArray = await r2Response.Body.transformToByteArray();
      return new NextResponse(Buffer.from(byteArray), {
        status: 200,
        headers: {
          'Content-Type': r2Response.ContentType || 'image/png',
          'Cache-Control': 'no-store, max-age=0',
          'X-Template-Source': 'custom',
        },
      });
    }
  } catch {
    // Fall through to default template in public/ticket-template.png
  }

  try {
    const defaultTemplatePath = path.join(process.cwd(), 'public', 'ticket-template.png');
    const fileBuffer = await fs.readFile(defaultTemplatePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, max-age=0',
        'X-Template-Source': 'default',
      },
    });
  } catch (err) {
    console.error('Error serving fallback ticket template:', err);
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
}
