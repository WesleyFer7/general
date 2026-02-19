"use client";

import { useState } from 'react';

export const dynamic = 'force-dynamic';

type MiningResult = {
  insight?: { produtos: { nome: string; potencial: number; motivo: string; copy: string; link_tiktok?: string; link_google?: string }[] };
  products?: { name: string; productUrl: string; ctr: number; conversion: number }[];
  raw?: unknown;
  error?: string;
};

export default function AdminPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MiningResult>({});

  async function handleRun() {
    setLoading(true);
    setLogs(['Iniciando execução...']);
    setResult({});
    try {
      const res = await fetch('/api/mining/run', { method: 'POST' });
      const data = await res.json();
      setLogs(data.logs || []);
      if (data.ok) {
        setResult({ insight: data.insight, products: data.products, raw: data.raw });
      } else {
        setResult({ raw: data.raw, error: 'Falha ao minerar (sem dados ou quota). Consulte o JSON bruto.' });
      }
    } catch (error) {
      setLogs((prev) => [...prev, `Erro: ${(error as Error).message}`]);
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-slate-400">Painel</p>
          <h1 className="text-3xl font-semibold text-slate-50">Admin • Mineração</h1>
          <p className="text-slate-400">Execute o ciclo RapidAPI → IA → Telegram sob demanda.</p>
        </div>
        <button
          onClick={handleRun}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Rodando...' : 'Rodar Mineração Agora'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-400">Logs</p>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {loading ? 'Processando' : 'Pronto'}
            </span>
          </div>
          <div className="space-y-2 text-sm text-slate-200">
            {logs.length === 0 ? <p className="text-slate-500">Nenhuma execução ainda.</p> : null}
            {logs.map((log, idx) => (
              <div key={idx} className="rounded-xl bg-slate-950/60 px-3 py-2 text-slate-100">
                {log}
              </div>
            ))}
            {result.raw ? (
              <details className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200">
                <summary className="cursor-pointer text-slate-100">JSON bruto da API</summary>
                <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words text-slate-300">
                  {JSON.stringify(result.raw, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow">
          <p className="text-xs uppercase tracking-wide text-slate-400">Último resultado</p>
          {result.insight ? (
            <div className="mt-3 space-y-4 text-slate-100">
              {(result.insight.produtos || []).map((item, idx) => {
                const base = result.products?.[idx];
                return (
                  <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-lg font-semibold">{idx + 1}. {item.nome}</p>
                    <p className="text-sm text-emerald-200">Potencial: {item.potencial}/10</p>
                    {base ? (
                      <p className="text-xs text-slate-400">{base.ctr}% CTR · {base.conversion}% conversão</p>
                    ) : null}
                    <p className="text-sm text-slate-300">{item.motivo}</p>
                    <p className="text-sm text-slate-200">Copy: {item.copy}</p>
                    <div className="flex flex-wrap gap-3 pt-1 text-sm">
                      {item.link_tiktok || base?.productUrl ? (
                        <a
                          href={item.link_tiktok || base?.productUrl}
                          className="text-cyan-200 underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          TikTok
                        </a>
                      ) : null}
                      {item.link_google ? (
                        <a
                          href={item.link_google}
                          className="text-emerald-200 underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Google
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-slate-500">
              {result.error ? <p className="text-rose-300">{result.error}</p> : null}
              <p>Execute para ver o próximo insight.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
