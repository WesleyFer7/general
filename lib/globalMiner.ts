import { load } from 'cheerio';
import type { GlobalProduct } from './types';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const BLACKLIST = [
  'cartão',
  'card',
  'assinatura',
  'amazon prime',
  'gift',
  'digital',
  'anuidade',
  'drone',
  'smartwatch',
  'headset',
  'gamer',
  'placa',
  'memória',
  'memoria',
  'processador',
  'projetor',
];

const AMAZON_BESTSELLER_CATEGORIES = [
  { url: 'https://www.amazon.com.br/gp/bestsellers/kitchen', reason: 'Amazon Bestsellers - Cozinha' },
  { url: 'https://www.amazon.com.br/gp/bestsellers/home', reason: 'Amazon Bestsellers - Casa e Organização' },
  { url: 'https://www.amazon.com.br/gp/bestsellers/beauty', reason: 'Amazon Bestsellers - Beleza e Cuidados Pessoais' },
];

const SHOPEE_KEYWORDS = [
  { keyword: 'cozinha', reason: 'Shopee Best-Seller - Cozinha' },
  { keyword: 'utilidades domesticas', reason: 'Shopee Best-Seller - Utilidades Domésticas' },
  { keyword: 'organizacao', reason: 'Shopee Best-Seller - Organização' },
  { keyword: 'beleza', reason: 'Shopee Best-Seller - Beleza' },
];

const ALIEXPRESS_BEST_CATEGORIES = [
  { url: 'https://www.aliexpress.com/w/wholesale-kitchen-best-seller.html', reason: 'AliExpress Best Seller - Cozinha' },
  { url: 'https://www.aliexpress.com/w/wholesale-home-organization-best-seller.html', reason: 'AliExpress Best Seller - Organização' },
  { url: 'https://www.aliexpress.com/w/wholesale-beauty-best-seller.html', reason: 'AliExpress Best Seller - Beleza' },
];

type SourceResult = { products: GlobalProduct[]; raw: any };

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });
  if (!res.ok) throw new Error(`Falha ao buscar ${url}: ${res.status}`);
  return res.text();
}

function normalizeName(name: unknown): string {
  if (typeof name !== 'string') return '';
  const cleaned = name
    .replace(/\u00a0/g, ' ')
    .replace(/R\$?\s*\d+(?:[.,]\d{1,3})*(?:,\d{2})?/gi, ' ')
    .replace(/\$\s*\d+(?:[.,]\d+)?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

function isValidTitle(title: string): boolean {
  if (!title) return false;
  const normalized = title.trim();
  if (normalized.length < 6) return false;
  if (/^\d+$/.test(normalized)) return false;
  const lower = normalized.toLowerCase();
  if (BLACKLIST.some((word) => lower.includes(word))) return false;
  return true;
}

function clampProbability(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function parseVolumeSignal(text: string): number {
  const digits = (text || '').replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10) || 0;
}

function calculateProbability(product: Partial<GlobalProduct>): number {
  let prob = 0;
  if (product.source === 'amazon_bestseller' || product.source === 'shopee_bestseller' || product.source === 'aliexpress_bestseller') {
    prob = Math.max(prob, 0.6); // base mínima para fontes bestseller
  }
  if ((product.sales_volume_signal || 0) >= 500) prob += 0.2;
  const price = product.price ?? 0;
  if (price >= 15 && price <= 89) prob += 0.2;
  return clampProbability(prob);
}

async function fetchAmazonCategory(url: string, reason: string): Promise<SourceResult> {
  try {
    const html = await fetchText(url);
    console.log('[DEBUG SOURCE] Amazon HTML tamanho:', html.length, url);
    const $ = load(html);
    const products: GlobalProduct[] = [];
    const rawTitles: string[] = [];
    const salesSpans = $('span.a-size-small.social-proof-faceout-count-text, span.a-size-small.a-color-secondary').toArray();
    const titleNodes = $('span.a-size-base, span.a-size-medium, div.p13n-sc-truncate, span.a-truncate-full').toArray();

    titleNodes.forEach((node, idx) => {
      const title = normalizeName($(node).text() || $(node).attr('title') || '');
      if (!isValidTitle(title)) return;
      const salesText = normalizeName(
        (salesSpans[idx] as any)?.textContent ||
          (salesSpans[idx] as any)?.children?.[0]?.data ||
          (salesSpans[idx] as any)?.data ||
          '',
      );
      const volume = parseVolumeSignal(salesText);
      const success_probability = calculateProbability({
        source: 'amazon_bestseller',
        sales_volume_signal: volume,
        price: undefined,
      });
      rawTitles.push(title);
      products.push({
        name: title,
        source: 'amazon_bestseller',
        sales_volume_signal: volume,
        price: undefined,
        original_rank: idx + 1,
        success_probability,
        trend_reason: `${reason} • ${salesText || 'sem prova'}`,
      });
    });

    console.log('[DEBUG RAW] amazon_bestseller', reason, rawTitles.slice(0, 30));
    return { products, raw: { count: products.length } };
  } catch (error) {
    console.error('Falha Amazon Bestsellers', error);
    return { products: [], raw: { error: String(error) } };
  }
}

async function fetchAmazonBestsellers(): Promise<SourceResult> {
  const results = await Promise.all(AMAZON_BESTSELLER_CATEGORIES.map((c) => fetchAmazonCategory(c.url, c.reason)));
  const products = results.flatMap((r) => r.products);
  const raw = results.map((r, idx) => ({ category: AMAZON_BESTSELLER_CATEGORIES[idx]?.reason, ...r.raw }));
  return { products, raw };
}

async function fetchShopeeKeyword(keyword: string, reason: string): Promise<SourceResult> {
  try {
    const url = `https://shopee.com.br/search?keyword=${encodeURIComponent(keyword)}&sortBy=sales`;
    const html = await fetchText(url);
    console.log('[DEBUG SOURCE] Shopee HTML tamanho:', html.length, url);
    const $ = load(html);
    const products: GlobalProduct[] = [];
    const rawTitles: string[] = [];

    $('div[data-sqe="name"], img[alt]').each((idx, el) => {
      const title = normalizeName($(el).text() || $(el).attr('alt') || '');
      if (!isValidTitle(title)) return;
      rawTitles.push(title);
      const success_probability = calculateProbability({ source: 'shopee_bestseller', sales_volume_signal: 0, price: undefined });
      products.push({
        name: title,
        source: 'shopee_bestseller',
        sales_volume_signal: 0,
        price: undefined,
        original_rank: idx + 1,
        success_probability,
        trend_reason: `${reason} • Bestseller`,
      });
    });

    if (!products.length || html.length < 1000) {
      const fallbackUrl = `https://shopee.com.br/search?keyword=${encodeURIComponent(keyword)}`;
      const htmlFallback = await fetchText(fallbackUrl);
      console.log('[DEBUG SOURCE] Shopee Fallback HTML tamanho:', htmlFallback.length, fallbackUrl);
      const $fb = load(htmlFallback);
      $fb('div[data-sqe="name"], img[alt]').each((idx, el) => {
        const title = normalizeName($fb(el).text() || $fb(el).attr('alt') || '');
        if (!isValidTitle(title)) return;
        rawTitles.push(title);
        const success_probability = calculateProbability({ source: 'shopee_bestseller', sales_volume_signal: 0, price: undefined });
        products.push({
          name: title,
          source: 'shopee_bestseller',
          sales_volume_signal: 0,
          price: undefined,
          original_rank: idx + 1,
          success_probability,
          trend_reason: `${reason} • Fallback`,
        });
      });
    }

    console.log('[DEBUG RAW] shopee_bestseller', reason, rawTitles.slice(0, 30));
    return { products, raw: { count: products.length } };
  } catch (error) {
    console.error('Falha Shopee Best-Seller', error);
    return { products: [], raw: { error: String(error) } };
  }
}

async function fetchAliExpressBest(url: string, reason: string): Promise<SourceResult> {
  try {
    const html = await fetchText(url);
    console.log('[DEBUG SOURCE] AliExpress HTML tamanho:', html.length, url);
    const $ = load(html);
    const products: GlobalProduct[] = [];
    const rawTitles: string[] = [];

    $('a').each((idx, el) => {
      const titleNode = $(el).find('div[class*="multi--title"], h1, h2, div[class*="card-title"], span[class*="title"], p[class*="title"]').first();
      const title = normalizeName(titleNode.text() || $(el).attr('title') || '');

      if (!isValidTitle(title)) return;
      rawTitles.push(title);
      const success_probability = calculateProbability({ source: 'aliexpress_bestseller', sales_volume_signal: 0, price: undefined });
      products.push({
        name: title,
        source: 'aliexpress_bestseller',
        sales_volume_signal: 0,
        price: undefined,
        original_rank: idx + 1,
        success_probability,
        trend_reason: `${reason} • Bestseller`,
      });
    });

    if (!products.length || html.length < 1000) {
      const keyword = reason.split('-').pop()?.trim() || 'kitchen';
      const fbUrl = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(keyword)}`;
      const htmlFb = await fetchText(fbUrl);
      console.log('[DEBUG SOURCE] AliExpress Fallback HTML tamanho:', htmlFb.length, fbUrl);
      const $fb = load(htmlFb);
      $fb('a').each((idx, el) => {
        const titleNode = $fb(el)
          .find('div[class*="multi--title"], h1, h2, div[class*="card-title"], span[class*="title"], p[class*="title"]')
          .first();
        const title = normalizeName(titleNode.text() || $fb(el).attr('title') || '');
        if (!isValidTitle(title)) return;
        rawTitles.push(title);
        const success_probability = calculateProbability({ source: 'aliexpress_bestseller', sales_volume_signal: 0, price: undefined });
        products.push({
          name: title,
          source: 'aliexpress_bestseller',
          sales_volume_signal: 0,
          price: undefined,
          original_rank: idx + 1,
          success_probability,
          trend_reason: `${reason} • Fallback`,
        });
      });
    }

    console.log('[DEBUG RAW] aliexpress_bestseller', reason, rawTitles.slice(0, 30));
    return { products, raw: { count: products.length } };
  } catch (error) {
    console.error('Falha AliExpress Best Seller', error);
    return { products: [], raw: { error: String(error) } };
  }
}

export async function runMining(limit = 40): Promise<{ products: GlobalProduct[]; raw: any }> {
  const amazonPromise = fetchAmazonBestsellers().catch((error) => {
    console.error('[AMAZON] Falha geral', error);
    return { products: [], raw: { error: String(error) } };
  });
  const shopeePromise = Promise.all(SHOPEE_KEYWORDS.map((c) => fetchShopeeKeyword(c.keyword, c.reason))).catch((error) => {
    console.error('[SHOPEE] Falha geral', error);
    return [] as any;
  });
  const aliPromise = Promise.all(ALIEXPRESS_BEST_CATEGORIES.map((c) => fetchAliExpressBest(c.url, c.reason))).catch((error) => {
    console.error('[ALIEXPRESS] Falha geral', error);
    return [] as any;
  });

  const amazon = await amazonPromise;
  const shopeeResults = (await shopeePromise) as SourceResult[];
  const aliResults = (await aliPromise) as SourceResult[];

  const sliceAmazon = amazon.products.slice(0, 20);
  const sliceShopee = shopeeResults.flatMap((r) => r.products).slice(0, 15);
  const sliceAli = aliResults.flatMap((r) => r.products).slice(0, 15);

  const byName = new Map<string, GlobalProduct>();
  const bump = (name: string) => {
    const current = byName.get(name.toLowerCase());
    if (current) {
      current.success_probability = clampProbability((current.success_probability || 0) + 0.1);
    }
  };

  const addAll = (items: GlobalProduct[]) => {
    items.forEach((p) => {
      const key = p.name.toLowerCase();
      if (byName.has(key)) {
        bump(key);
      } else {
        byName.set(key, { ...p });
      }
    });
  };

  addAll(sliceAmazon);
  addAll(sliceShopee);
  addAll(sliceAli);

  const combined = Array.from(byName.values());

  const bestSellerSignals = ['+500', '500+', '+1000', '1000+', '1000', 'mil+', 'mais vendido', 'best seller', 'bestseller', 'top 1', 'top seller', 'most wished'];
  const filtered = combined.filter((p) => {
    if ((p.sales_volume_signal || 0) >= 500) return true;
    const reason = (p.trend_reason || '').toLowerCase();
    return bestSellerSignals.some((sig) => reason.includes(sig));
  });

  const chosen = filtered.length ? filtered : combined.sort((a, b) => (b.success_probability || 0) - (a.success_probability || 0));
  const products = chosen.slice(0, Math.min(limit, 10));

  return {
    products,
    raw: {
      amazon: amazon.raw,
      shopee: shopeeResults.map((r) => r.raw),
      aliexpress: aliResults.map((r) => r.raw),
      totalCandidates: combined.length,
      filteredCount: filtered.length,
    },
  };
}
