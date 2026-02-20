import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

type InvitePayload = {
  email: string;
  telegramId: string;
  telegramUsername?: string;
  name?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<InvitePayload>;
    const email = body.email?.trim().toLowerCase();
    const telegramId = body.telegramId?.toString();

    if (!email || !telegramId) {
      return NextResponse.json({ error: 'email e telegramId são obrigatórios.' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    if (!botToken || !channelId) {
      return NextResponse.json(
        { error: 'Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHANNEL_ID no ambiente.' },
        { status: 500 },
      );
    }

    // Impede múltiplas contas com o mesmo Telegram ID ou e-mail.
    const { rows: existingRows } = await query<{ id: string; telegram_id: string | null; email: string }>(
      'SELECT id, telegram_id, email FROM users WHERE telegram_id = $1 OR email = $2 LIMIT 1',
      [telegramId, email],
    );
    const existingUser = existingRows[0];

    if (existingUser && existingUser.telegram_id && existingUser.telegram_id !== telegramId) {
      return NextResponse.json({ error: 'Este e-mail já está vinculado a outro Telegram.' }, { status: 409 });
    }

    const inviteResponse = await fetch(`https://api.telegram.org/bot${botToken}/createChatInviteLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: channelId, member_limit: 1 }),
    });

    if (!inviteResponse.ok) {
      const text = await inviteResponse.text();
      return NextResponse.json({ error: 'Falha ao criar link de convite.', details: text }, { status: 502 });
    }

    const inviteData = (await inviteResponse.json()) as { result?: { invite_link: string; expire_date?: number } };
    const inviteLink = inviteData.result?.invite_link;

    if (!inviteLink) {
      return NextResponse.json({ error: 'Invite link ausente na resposta do Telegram.' }, { status: 502 });
    }

    await query(
      `INSERT INTO users (email, telegram_id, telegram_username, name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
         SET telegram_id = EXCLUDED.telegram_id,
             telegram_username = EXCLUDED.telegram_username,
             name = EXCLUDED.name`,
      [email, telegramId, body.telegramUsername ?? null, body.name ?? null],
    );

    await query(
      `INSERT INTO telegram_invites (user_email, telegram_id, invite_link, invite_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_email) DO UPDATE
         SET telegram_id = EXCLUDED.telegram_id,
             invite_link = EXCLUDED.invite_link,
             invite_hash = EXCLUDED.invite_hash,
             expires_at = EXCLUDED.expires_at`,
      [
        email,
        telegramId,
        inviteLink,
        inviteLink.split('/').pop() ?? null,
        inviteData.result?.expire_date ? new Date(inviteData.result.expire_date * 1000).toISOString() : null,
      ],
    );

    return NextResponse.json({ inviteLink });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao gerar convite.', details: (error as Error).message }, { status: 500 });
  }
}
