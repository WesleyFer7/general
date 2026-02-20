import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
  await supabase.from('payment_events').insert({
    provider,
    external_id: externalId,
    status,
    customer_email: email,
    user_id: userId,
    payload,
  });

  if (status === 'paid' || status === 'approved') {
    await supabase.from('profiles').upsert({ email, plan: 'active', is_vip: true });
  }

  return NextResponse.json({ ok: true });
}
