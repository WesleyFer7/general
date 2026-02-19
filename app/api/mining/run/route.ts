import { NextRequest, NextResponse } from 'next/server';
import { analyzeProducts } from '../../../../lib/ai';
import { formatTelegramMessage, sendTelegramMessage } from '../../../../lib/telegram';
import { runMining } from '../../../../lib/globalMiner';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  console.log('GET /api/mining/run recebido - iniciando processamento em background');

  // Dispara o fluxo em background para evitar timeout/502.
  void (async () => {
    try {
      console.log('[BG] Buscando produtos (Global Miner)...');
      const { products, raw } = await runMining(40);
      console.log(`[BG] Produtos encontrados: ${products.length}`);

      if (!products.length) {
        console.log('[BG] Nenhum produto elegível encontrado.');
        return;
      }

      console.log(`[BG] Primeiro produto: ${products[0]?.name || 'N/D'}`);
      console.log('[BG] Enviando para IA...');

      const insight = await analyzeProducts(products.slice(0, 40));
      const listCount = ((insight as any).low_ticket?.length || 0) + ((insight as any).high_ticket?.length || 0);
      console.log(`[BG] IA retornou ${listCount} itens (low/high).`);
      console.log('[BG] Formatando mensagens para Telegram...');
      const messages = formatTelegramMessage(products, insight);
      for (const msg of messages) {
        await sendTelegramMessage(msg.text, msg.keyboard);
      }
      console.log('[BG] Mensagens enviadas ao Telegram.');
      console.log('[IA DONE] JSON entregue com sucesso');
    } catch (error) {
      console.error('[BG] Erro no fluxo de mineração', error);
    }
  })();

  return NextResponse.json({
    ok: true,
    message: 'Processamento iniciado em background (busca 40, envia top 10 em mensagens individuais + footer)',
    logs: ['Processamento iniciado em background (global miner)'],
  });
}

export async function POST(_req: NextRequest) {
  const logs: string[] = [];
  const push = (msg: string) => logs.push(msg);

  try {
    push('Iniciando mineração sob demanda (POST)');
    push('Buscando produtos (Global Miner)...');
    const { products, raw } = await runMining(40);
    push(`Produtos encontrados: ${products.length}`);

    if (!products.length) {
      push('Nenhum produto elegível retornado pelo minerador.');
      return NextResponse.json({ ok: false, logs, raw, error: 'Sem produtos retornados' });
    }

    push('Enviando para IA...');
    const insight = await analyzeProducts(products.slice(0, 40));
    const listCount = ((insight as any).low_ticket?.length || 0) + ((insight as any).high_ticket?.length || 0);
    push(`IA retornou ${listCount} itens.`);

    push('Formatando mensagens para Telegram...');
    const messages = formatTelegramMessage(products, insight);

    for (const [idx, msg] of messages.entries()) {
      await sendTelegramMessage(msg.text, msg.keyboard);
      push(`Mensagem ${idx + 1}/${messages.length} enviada ao Telegram.`);
    }

    push('Fluxo concluído com sucesso.');

    return NextResponse.json({ ok: true, logs, insight, products, raw });
  } catch (error) {
    console.error('[POST /api/mining/run] Erro no fluxo', error);
    push(`Erro: ${(error as Error).message}`);
    return NextResponse.json({ ok: false, logs, error: (error as Error).message }, { status: 500 });
  }
}
