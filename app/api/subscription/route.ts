import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email?.toString()?.trim()?.toLowerCase();
    const token = process.env.MP_ACCESS_TOKEN;
    const planId = process.env.MP_PREAPPROVAL_PLAN_ID; // Opcional: plano já criado no painel/SDK
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!email) {
      return NextResponse.json({ ok: false, error: 'E-mail obrigatório para criar assinatura.' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Configure MP_ACCESS_TOKEN no ambiente.' }, { status: 500 });
    }

    // Preferência por plano pré-criado; se não houver, monta recorrência de 30 dias
    const preapprovalBody = planId
      ? {
          preapproval_plan_id: planId,
          reason: 'Assinatura Canal VIP',
          payer_email: email,
          back_url: `${appUrl}/checkout/sucesso`,
          status: 'pending',
          metadata: { email, plan: 'assinatura_19_90' },
        }
      : {
          reason: 'Assinatura Canal VIP',
          external_reference: `assinatura_${email}`,
          payer_email: email,
          back_url: `${appUrl}/checkout/sucesso`,
          auto_recurring: {
            frequency: 30,
            frequency_type: 'days',
            transaction_amount: 19.9,
            currency_id: 'BRL',
          },
          status: 'pending',
          metadata: { email, plan: 'assinatura_19_90' },
        };

    const res = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preapprovalBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[SUBSCRIPTION] Mercado Pago erro', res.status, errorText);
      return NextResponse.json({ ok: false, error: 'Falha ao criar assinatura no Mercado Pago.' }, { status: 502 });
    }

    const data = await res.json();
    const initPoint = data.init_point || data.sandbox_init_point;

    return NextResponse.json({ ok: true, preapproval_id: data.id, init_point: initPoint });
  } catch (error) {
    console.error('[SUBSCRIPTION] erro', error);
    return NextResponse.json({ ok: false, error: 'Falha ao criar assinatura' }, { status: 500 });
  }
}
