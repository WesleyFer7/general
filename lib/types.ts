export type GlobalProduct = {
  name: string;
  source: string;
  success_probability: number; // 0-1 range probability
  trend_reason: string;
  sales_volume_signal?: number; // número bruto de vendas percebido (ex: 500, 1000)
  price?: number; // preço estimado em R$
  original_rank?: number; // posição na lista da fonte
  trend_status?: 'NEW' | 'RISING' | 'STABLE' | 'HOT WINNER';
  created_at?: string;
};
