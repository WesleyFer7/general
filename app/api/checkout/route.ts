import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email?.toString()?.trim()?.toLowerCase();
    const userId = body?.userId?.toString()?.trim();
    const externalRef = userId || email;

    const token = process.env.MP_ACCESS_TOKEN;
    const backUrl = 'https://general-bay-six.vercel.app/dashboard';

    if (!email) {
      return NextResponse.json({ ok: false, error: 'E-mail obrigatório para criar assinatura.' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ ok: false, error: 'Configure MP_ACCESS_TOKEN no ambiente.' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preapproval = new PreApproval(client);

    const preapprovalBody = {
      reason: 'Assinatura Canal VIP (Teste R$0,10)',
      external_reference: externalRef,
      payer_email: email,
      back_url: backUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 0.1,
        currency_id: 'BRL',
      },
      status: 'pending',
    } as const;

    const result = await preapproval.create({ body: preapprovalBody });

    return NextResponse.json({ ok: true, preapproval_id: result.id, init_point: (result as any).init_point });
  } catch (error) {
    console.error('[CHECKOUT] erro preapproval', error);
    return NextResponse.json({ ok: false, error: 'Falha ao criar assinatura' }, { status: 500 });
  }
}
