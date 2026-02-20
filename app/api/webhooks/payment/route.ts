import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
  await query(
    `INSERT INTO payment_events (provider, external_id, status, customer_email, user_id, payload)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [provider, externalId, status, email, userId ?? null, payload],
  );

  if (status === 'paid' || status === 'approved') {
    await query(
      `INSERT INTO profiles (email, plan, is_vip)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET plan = EXCLUDED.plan, is_vip = EXCLUDED.is_vip`,
      [email, 'active', true],
    );
  }

  return NextResponse.json({ ok: true });
}
