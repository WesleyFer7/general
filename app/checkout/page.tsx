"use client";

import { useState } from 'react';

const plans = [
  {
    key: "assinatura",
    title: "Assinatura Canal VIP",
    price: "R$ 19,90/mês",
    description: "Acesso mensal ao canal VIP com alertas diários de produtos vencedores.",
    highlight: "Assinatura",
  },
];

export default function CheckoutPage() {
  const [email, setEmail] = useState("");
  const [selectedPlan] = useState<string>(plans[0].key);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan: selectedPlan }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok || !data?.init_point) {
        throw new Error(data?.error || "Falha ao gerar link de pagamento.");
      }

      window.location.href = data.init_point;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Assinatura recorrente</p>
          <h1 className="text-3xl font-semibold">Assine por R$ 19,90/mês no Mercado Pago</h1>
          <p className="text-slate-400">Cobrança mensal automática. Cancele quando quiser.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-slate-100">
                E-mail para acesso
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="email@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-50 outline-none ring-emerald-500/60 transition focus:border-emerald-500/60 focus:ring"
              />
              <p className="text-xs text-slate-500">Usaremos este e-mail para liberar o canal VIP e enviar o recibo.</p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-100">Plano</p>
              <div className="flex flex-col gap-3">
                {plans.map((plan) => (
                  <div
                    key={plan.key}
                    className="flex flex-col rounded-2xl border border-emerald-500/80 bg-emerald-500/10 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-100">{plan.title}</span>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-wide text-emerald-200">
                        {plan.highlight}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-emerald-200">{plan.price}</p>
                    <p className="text-sm text-slate-400">{plan.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-wide text-emerald-200">Resumo</p>
              <h2 className="text-xl font-semibold text-slate-50">
                {plans.find((p) => p.key === selectedPlan)?.title || "Plano escolhido"}
              </h2>
              <p className="text-3xl font-semibold text-emerald-300">
                {plans.find((p) => p.key === selectedPlan)?.price}
              </p>
              <p className="text-sm text-slate-400">Cobrança mensal recorrente via Mercado Pago (cartão ou saldo).</p>
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Gerando link seguro..." : "Ativar assinatura"}
            </button>

            <div className="space-y-1 text-xs text-slate-500">
              <p>• Checkout hospedado pelo Mercado Pago.</p>
              <p>• Assinatura renovada automaticamente a cada mês (R$ 19,90).</p>
              <p>• Você pode cancelar a qualquer momento na própria conta Mercado Pago.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
