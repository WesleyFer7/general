import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type PlanConfig = { title: string; price: number; description: string };

const PLANS: Record<string, PlanConfig> = {
  assinatura: {
    title: 'Assinatura Canal VIP',
    price: 19.9,
    description: 'Acesso mensal ao canal VIP com alertas de produtos vencedores.',
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email?.toString()?.trim()?.toLowerCase();
    const planKey = body?.plan?.toString() || 'assinatura';
    const plan = PLANS[planKey] || PLANS.assinatura;
    const token = process.env.MP_ACCESS_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!email) {
      return NextResponse.json({ ok: false, error: 'E-mail obrigatório para gerar checkout.' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Configure MP_ACCESS_TOKEN no ambiente.' }, { status: 500 });
    }

    const preferenceBody = {
      items: [
        {
          title: plan.title,
          quantity: 1,
          unit_price: plan.price,
          currency_id: 'BRL',
          description: plan.description,
        },
      ],
      payer: { email },
      metadata: { email, plan: planKey },
      back_urls: {
        success: `${appUrl}/checkout/sucesso`,
        failure: `${appUrl}/checkout/erro`,
        pending: `${appUrl}/checkout/pending`,
      },
      auto_return: 'approved',
      statement_descriptor: 'TIKTOKUP',
    };

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[CHECKOUT] Mercado Pago erro', res.status, errorText);
      return NextResponse.json({ ok: false, error: 'Falha ao criar preferência no Mercado Pago.' }, { status: 502 });
    }

    const data = await res.json();
    const preferenceId = data.id as string;
    const initPoint = data.init_point || data.sandbox_init_point;

    return NextResponse.json({ ok: true, preferenceId, init_point: initPoint, plan: planKey });
  } catch (error) {
    console.error('[CHECKOUT] erro', error);
    return NextResponse.json({ ok: false, error: 'Falha ao gerar checkout' }, { status: 500 });
  }
}
