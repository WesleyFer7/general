import type { AiInsight } from './ai';
import type { GlobalProduct } from './types';

function simplifyTerm(name: string): string {
  if (!name) return '';
  const substitutions: Record<string, string> = {
    cellphone: 'celular',
    smartphone: 'celular',
    wireless: 'sem fio',
    phone: 'celular',
  };

  let normalized = name;
  Object.entries(substitutions).forEach(([en, pt]: [string, string]) => {
    const regex = new RegExp(en, 'gi');
    normalized = normalized.replace(regex, pt);
  });

  const tokens = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((value: string) => Boolean(value))
    .filter((w: string) => !['kit', 'de', 'da', 'do', 'das', 'dos', 'para', 'com', 'sem', 'e'].includes(w.toLowerCase()));

  const selected = tokens.slice(0, 3);
  const compact = selected.join(' ');
  return compact || tokens.join(' ') || normalized.split(/\s+/).slice(0, 3).join(' ');
}

function formatCount(num?: number) {
  if (num === undefined || num === null || Number.isNaN(num)) return 'n/d';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return num.toString();
}

function assertTelegramEnv() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;
  if (!botToken || !channelId) throw new Error('Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHANNEL_ID.');
  return { botToken, channelId };
}

type TelegramMessage = { text: string; keyboard?: any };

function buildSearchLinks(term: string) {
  const encodedName = encodeURIComponent(term).replace(/\?+$/g, '');
  const simplified = simplifyTerm(term) || term;
  const encodedSimplified = encodeURIComponent(simplified).replace(/\?+$/g, '');
  return {
    ali: `https://pt.aliexpress.com/wholesale?SearchText=${encodedName}`,
    shopee: `https://shopee.com.br/search?keyword=${encodedSimplified}`,
    amazon: `https://www.amazon.com.br/s?k=${encodedSimplified}`,
    trends: `https://trends.google.com/trends/explore?q=${encodedSimplified}&geo=BR`,
    simplified,
  };
}

export function formatTelegramMessage(products: GlobalProduct[], insight: AiInsight): TelegramMessage[] {
  const low = (insight as any).low_ticket || insight.produtos || [];
  const high = (insight as any).high_ticket || [];
  const byName = new Map<string, GlobalProduct>();
  products.forEach((p: GlobalProduct) => byName.set(p.name.toLowerCase(), p));

  const buildMessage = (item: any, idx: number, header: string): TelegramMessage | null => {
    console.log('[DEBUG TELEGRAM] Processando item:', (item as any)?.n);
    const safeName = String((item as any)?.n ?? item?.nome ?? products[idx]?.name ?? '').trim();
    if (!safeName) return null;
    const base = byName.get(safeName.toLowerCase()) || products[idx];
    const links = buildSearchLinks(safeName);
    console.log('[BTN LINK] AliExpress:', links.ali);
    console.log('[BTN LINK] Shopee:', links.shopee);
    console.log('[BTN LINK] Amazon BR:', links.amazon);
    console.log('[BTN LINK] Google Trends:', links.trends, 'Termo:', links.simplified);
    const potencial = (item as any).p ?? (item as any).potencial ?? 'n/d';
    const motivo = (item as any).m || (item as any).motivo || '';
    const copy = (item as any).c || (item as any).copy || '';
    const ticket = (item as any).t || (item as any).ticket_medio;
    const lucro = (item as any).l || (item as any).margem_lucro;
    const faturamento = (item as any).f || (item as any).faturamento_estimado;
    const vantagem = (item as any).v || (item as any).vantagem;

    const lines: string[] = [
      header,
      `📦 ${safeName}`,
      `⭐ Potencial: ${potencial}/10`,
    ];

    if (vantagem) lines.push(`🚚 Vantagem Logística: ${vantagem}`);
    if (motivo) lines.push(`💡 Motivo: ${motivo}`);
    if (copy) lines.push(`🚀 Copy: ${copy}`);
    if (ticket) lines.push(`💸 Preço de Venda Sugerido: ${ticket}`);
    if (lucro) lines.push(`📈 Margem por Venda: ${lucro}`);
    if (faturamento) lines.push(`💰 Potencial de Fat.: ${faturamento}`);

    const keyboard: any = { inline_keyboard: [] };
    const row1: any[] = [];
    const row2: any[] = [];
    if (links.ali) row1.push({ text: '📦 AliExpress', url: links.ali });
    if (links.shopee) row1.push({ text: '🛍️ Shopee', url: links.shopee });
    if (links.amazon) row2.push({ text: '🛒 Amazon BR', url: links.amazon });
    if (links.trends) row2.push({ text: '📈 Google Trends', url: links.trends });
    if (row1.length) keyboard.inline_keyboard.push(row1);
    if (row2.length) keyboard.inline_keyboard.push(row2);

    return { text: lines.filter(Boolean).join('\n'), keyboard };
  };

  const messages: TelegramMessage[] = [];
  low.slice(0, 5).forEach((item: any, idx: number) => {
    const msg = buildMessage(item, idx, '🟢 ESCALA • R$ 15-50');
    if (msg) messages.push(msg);
  });
  high.slice(0, 5).forEach((item: any, idx: number) => {
    const msg = buildMessage(item, idx, '🔵 MARGEM • R$ 100-300');
    if (msg) messages.push(msg);
  });

  messages.push({ text: 'Receba os próximos alertas aqui no canal.' });

  return messages;
}


export async function sendTelegramMessage(text: string, keyboard?: any) {
  const { botToken, channelId } = assertTelegramEnv();
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: channelId, text, reply_markup: keyboard, disable_web_page_preview: false }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao enviar para Telegram: ${res.status} ${body}`);
  }
}
