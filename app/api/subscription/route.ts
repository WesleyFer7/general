import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email?.toString()?.trim()?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 });
    }

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Configure MP_ACCESS_TOKEN no ambiente.' }, { status: 500 });
    }

    const transactionAmount = 1.2; // R$1,20

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Assinatura VIP Canal',
        external_reference: `assinatura_${email}`,
        payer_email: email,
        back_url: 'https://general-bay-six.vercel.app/dashboard',
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: transactionAmount,
          currency_id: 'BRL',
        },
        status: 'pending',
        metadata: { email, plan: 'assinatura_1_20' },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[SUBSCRIPTION] Mercado Pago erro', response.status, data);
      return NextResponse.json({ error: data?.message || 'Erro no Mercado Pago', details: data }, { status: response.status });
    }

    const initPoint = data.init_point || data.sandbox_init_point;
    if (!initPoint) {
      console.error('[SUBSCRIPTION] init_point ausente', data);
      return NextResponse.json({ error: 'init_point ausente na resposta do Mercado Pago', details: data }, { status: 502 });
    }

    return NextResponse.json({ init_point: initPoint, id: data.id, ok: true });
  } catch (error: any) {
    console.error('Erro Interno:', error);
    return NextResponse.json({ error: 'Falha ao processar assinatura' }, { status: 500 });
  }
}
