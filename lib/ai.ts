import OpenAI from 'openai';
import type { GlobalProduct } from './types';

export type AiProductInsight = {
  // chaves curtas (payload da IA)
  n?: string; // nome
  c?: string; // copy
  p?: number; // potencial
  v?: string; // vantagem logística
  t?: string; // ticket médio
  l?: string; // lucro/margem
  f?: string; // faturamento potencial
  la?: string; // link aliexpress
  lg?: string; // link google
  m?: string; // motivo (conciso)

  // chaves legadas para compatibilidade interna
  nome?: string;
  potencial?: number;
  motivo?: string;
  copy?: string;
  ticket_medio?: string;
  margem_lucro?: string;
  faturamento_estimado?: string;
  link_aliexpress?: string;
  link_google?: string;
};

export type AiInsight = {
  produtos?: AiProductInsight[]; // legado
  low_ticket?: AiProductInsight[];
  high_ticket?: AiProductInsight[];
};

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY não configurada.');
  return new OpenAI({ apiKey });
}

export async function analyzeProducts(products: GlobalProduct[]): Promise<AiInsight> {
  const client = getClient();

  const translateTerm = (value: string): string => {
    if (!value) return '';
    const dict: Record<string, string> = {
      'milk frother': 'misturador de leite',
      frother: 'misturador',
      sealer: 'selador',
      'vacuum sealer': 'seladora a vácuo',
      wireless: 'sem fio',
      cellphone: 'celular',
      smartphone: 'celular',
    };
    let out = value;
    Object.entries(dict).forEach(([en, pt]) => {
      const regex = new RegExp(en, 'gi');
      out = out.replace(regex, pt);
    });
    return out;
  };

  const list = products
    .map(
      (p, idx) =>
        `${idx + 1}. Produto: ${translateTerm(String(p.name || ''))} | Fonte: ${p.source} | Prob: ${p.success_probability}`,
    )
    .join('\n');

  const prompt = [
    'Especialista em Giro Rápido (Iniciantes). Foque em produtos úteis de R$ 15-89 com 500+ vendas.',
    'NÃO use blocos de código markdown. Retorne APENAS o objeto JSON puro.',
    'Use RIGIDAMENTE: "n" (nome do produto), "t" (ticket/preço), "l" (lucro), "f" (faturamento), "c" (copy curta), "m" (motivo), "v" (vantagem logística).',
    'A chave "n" deve conter o NOME do produto (ex: "Misturador de Leite"), e NÃO um número sequencial.',
    'Se faltar dado estatístico do minerador, calcule uma Probabilidade de Sucesso estimada entre 65% e 90% baseada na utilidade do produto; cozinha e limpeza devem receber valores mais altos.',
    'Proíba "n/d" em qualquer campo. Sempre preencha com uma estimativa coerente.',
    'Se a fonte for genérica, preencha o motivo com análise de mercado, ex: "Alta procura por praticidade doméstica" ou "Tendência de viralização no TikTok (Cozinha Funcional)".',
    'Barreira de Rejeição: drones, itens gamer, eletrônicos caros, projetores, gadgets complexos ou qualquer item que precise de manual complicado são proibidos.',
    'Critério TikTok 10s: se não limpa, não organiza ou não economiza tempo na cozinha, ignore.',
    'Priorize itens com sinal forte de volume (best-seller, 500+ vendas).',
    'Sanidade de idioma: nomes em português simples; evite termos em inglês salvo marca registrada. Use "celular", "sem fio", etc. Converta termos como "Milk Frother" para "Misturador de Leite" e "Sealer" para "Selador".',
    'Retorne apenas itens físicos práticos: limpeza inteligente, gadgets de cozinha que economizam tempo, organização de espaço, segurança doméstica simples.',
    'Estrutura de resposta (JSON puro): 10 itens em low_ticket, nenhum high_ticket. Formato: {"low_ticket":[{"n","t","l","f","c","m","v"}]}.',
    'Não invente links; o sistema gera. Sempre 10 itens em low_ticket.',
    'Dados candidatos:',
    list,
  ].join('\n');

  const completion = await client.responses.create({
    model: 'gpt-4o-mini',
    input: prompt,
    max_output_tokens: 3000,
  });

  const content = completion.output_text ?? '';
  console.log('[DEBUG IA] Resposta bruta:', content);

  const safeParse = (text: string): Partial<AiInsight> => {
    if (!text || !text.trim()) {
      console.error('[IA ERROR] A IA não conseguiu identificar produtos físicos na lista fornecida.');
      return {};
    }

    const cleanedText = text.replace(/```json|```/g, '').trim();

    try {
      return JSON.parse(cleanedText);
    } catch (error) {
      // Tentativa de auto-reparo: se o JSON veio truncado, fecha com ]}
      const trimmed = cleanedText;
      const autoClosed = trimmed.endsWith(']}') ? trimmed : `${trimmed} ]}`;
      try {
        return JSON.parse(autoClosed);
      } catch {
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          try {
            const candidate = trimmed.slice(start, end + 1);
            const candidateClosed = candidate.endsWith(']}') ? candidate : `${candidate} ]}`;
            return JSON.parse(candidateClosed);
          } catch (errorInner) {
            console.error('[IA ERROR] Falha ao recuperar JSON truncado.', errorInner);
            return {};
          }
        }
        console.error('[IA ERROR] A IA não conseguiu identificar produtos físicos na lista fornecida.', error);
        return {};
      }
    }
  };

  const parsed = safeParse(content);

  const normalizeList = (arr: any[] = []) =>
    arr.slice(0, 10).map((item) => {
      const toStr = (val: any, fallback = ''): string => String(val ?? fallback).trim();
      const fallbackNome = toStr((item as any)?.n ?? item?.nome, 'Produto em alta');
      const encoded = encodeURIComponent(fallbackNome);
      const ali = `https://pt.aliexpress.com/wholesale?SearchText=${encoded}`;
      const shopee = `https://shopee.com.br/search?keyword=${encoded}`;
      const potencia = Number((item as any)?.p ?? item?.potencial ?? 7);

      console.log('[ALERTA LINK] URL GERADA (AliExpress):', ali);
      console.log('[ALERTA LINK] URL GERADA (Shopee):', shopee);

      return {
        n: fallbackNome,
        nome: fallbackNome,
        p: potencia,
        potencial: potencia,
        m: toStr((item as any)?.m ?? item?.motivo, 'Boa demanda identificada.'),
        motivo: toStr((item as any)?.m ?? item?.motivo, 'Boa demanda identificada.'),
        c: toStr((item as any)?.c ?? item?.copy, 'Resolve sua dor em minutos — peça hoje.'),
        copy: toStr((item as any)?.c ?? item?.copy, 'Resolve sua dor em minutos — peça hoje.'),
        t: toStr((item as any)?.t ?? item?.ticket_medio, 'R$ 99'),
        ticket_medio: toStr((item as any)?.t ?? item?.ticket_medio, 'R$ 99'),
        l: toStr((item as any)?.l ?? item?.margem_lucro, '25-45%'),
        margem_lucro: toStr((item as any)?.l ?? item?.margem_lucro, '25-45%'),
        f: toStr((item as any)?.f ?? item?.faturamento_estimado, 'R$ 15k a R$ 40k/mês'),
        faturamento_estimado: toStr((item as any)?.f ?? item?.faturamento_estimado, 'R$ 15k a R$ 40k/mês'),
        v: toStr((item as any)?.v ?? item?.vantagem, 'Leve, compacto e inquebrável para envios baratos.'),
        vantagem: toStr((item as any)?.v ?? item?.vantagem, 'Leve, compacto e inquebrável para envios baratos.'),
        // Links serão gerados dinamicamente no Telegram; mantemos para compat, mas originam de encode local
        u: ali,
        s: shopee,
        la: ali,
        link_aliexpress: ali,
        link_shopee: shopee,
      };
    });

  const low = normalizeList((parsed as any).low_ticket || parsed.produtos || (parsed as any).top6 || []);

  if (!low.length) {
    console.log('[DEBUG IA] Array low_ticket veio vazio ou mal formatado');
  }
  return {
    low_ticket: low,
    high_ticket: [],
  };
}
