import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const headerSecret = req.headers.get('x-cron-secret');
  if (!secret || headerSecret !== secret) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - 3 * DAY_MS);

    const where: Prisma.UserWhereInput = {
      isVip: true,
      nextBilling: { lt: cutoff },
      telegram_id: { not: null },
    };

    const overdueUsers = await prisma.user.findMany({
      where,
      select: { id: true, email: true, telegram_id: true },
    });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const channelId = process.env.TELEGRAM_CHANNEL_ID;

    if (!botToken || !channelId) {
      return NextResponse.json({ ok: false, error: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID' }, { status: 500 });
    }

    const kicked: string[] = [];
    const errors: Array<{ telegramId: string; error: string }> = [];

    for (const user of overdueUsers) {
      const telegramId = user.telegram_id as string;
      try {
        const kickRes = await fetch(`https://api.telegram.org/bot${botToken}/banChatMember`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: channelId, user_id: telegramId }),
        });

        if (!kickRes.ok) {
          const text = await kickRes.text();
          throw new Error(`kick failed: ${kickRes.status} ${text}`);
        }

        const notifyRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramId,
            text: 'Seu acesso ao canal VIP foi removido por falta de pagamento. Regularize sua assinatura para voltar.',
          }),
        });

        if (!notifyRes.ok) {
          const text = await notifyRes.text();
          throw new Error(`notify failed: ${notifyRes.status} ${text}`);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { isVip: false },
        });

        kicked.push(telegramId);
      } catch (error) {
        errors.push({ telegramId, error: (error as Error).message });
      }
    }

    return NextResponse.json({ ok: true, processed: overdueUsers.length, kicked, errors });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}