import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Payload inválido' }, { status: 400 });
  }

  const email = payload?.email?.toString()?.trim()?.toLowerCase();
  const status = payload?.status?.toString() || 'pending';
  const externalId = payload?.id?.toString() || payload?.externalId?.toString();
  const provider = payload?.provider?.toString() || 'unknown';
  const userId = payload?.metadata?.userId || payload?.metadata?.user_id;

  console.log('[PAYMENT] UID recebido:', userId);

  if (!email) return NextResponse.json({ ok: false, error: 'email obrigatório' }, { status: 400 });

  // Registra evento
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `INSERT INTO payment_events (provider, external_id, status, customer_email, user_id, payload)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (external_id) DO UPDATE SET status = EXCLUDED.status, customer_email = EXCLUDED.customer_email, user_id = EXCLUDED.user_id, payload = EXCLUDED.payload`,
      provider,
      externalId,
      status,
      email,
      userId ?? null,
      payload,
    );

    if (status === 'paid' || status === 'approved') {
      await tx.user.upsert({
        where: { email },
        update: {
          isVip: true,
          nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        create: {
          email,
          isVip: true,
          nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
