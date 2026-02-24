import { NextResponse } from 'next/server';

// Forçamos a Vercel a tratar como API puramente dinâmica
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; 

export async function POST(req: Request) {
  try {
    // IMPORTAÇÃO DINÂMICA: Isso impede o Prisma de carregar durante o build
    const { default: prisma } = await import('@/lib/db');

    const body = await req.json();
    const { email, telegramId, name } = body;
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID;

    // Proteção de Runtime
    if (!prisma) {
        return NextResponse.json({ error: "Banco de dados indisponível" }, { status: 500 });
    }

    if (!email || !telegramId) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Lógica de busca
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { telegram_id: String(telegramId) }],
      },
    });

    if (existingUser && existingUser.telegram_id && existingUser.telegram_id !== String(telegramId)) {
      return NextResponse.json({ error: 'E-mail vinculado a outro Telegram.' }, { status: 409 });
    }

    // Chamada Telegram
    const inviteRes = await fetch(`https://api.telegram.org/bot${botToken}/createChatInviteLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: channelId, member_limit: 1 }),
    });

    const inviteData = await inviteRes.json();
    const inviteLink = inviteData.result?.invite_link;

    if (!inviteLink) throw new Error('Falha ao gerar link no Telegram');

    // Registro no Banco
    await prisma.user.upsert({
      where: { email },
      update: { telegram_id: String(telegramId), name: name || undefined },
      create: {
        email,
        telegram_id: String(telegramId),
        name: name || undefined,
        isVip: false,
      },
    });

    return NextResponse.json({ inviteLink });
  } catch (error: any) {
    console.error('ERRO CRÍTICO:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}