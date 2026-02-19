export default function CheckoutErrorPage() {
  return (
    <div className="min-h-[60vh] bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-rose-600/40 bg-rose-500/10 p-8 shadow-lg shadow-rose-500/20">
        <p className="text-xs uppercase tracking-[0.24em] text-rose-200">Pagamento não concluído</p>
        <h1 className="text-3xl font-semibold">Algo deu errado no checkout</h1>
        <p className="text-slate-200">O pagamento não foi aprovado ou foi cancelado. Você pode tentar novamente.</p>
        <div className="flex flex-wrap gap-3">
          <a
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.01]"
            href="/checkout"
          >
            Voltar ao checkout
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
            href="/"
          >
            Ir para a página inicial
          </a>
        </div>
      </div>
    </div>
  );
}
