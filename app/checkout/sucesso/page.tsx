export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[60vh] bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-emerald-600/40 bg-emerald-500/10 p-8 shadow-lg shadow-emerald-500/20">
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Pagamento aprovado</p>
        <h1 className="text-3xl font-semibold">Tudo certo! Estamos liberando seu acesso</h1>
        <p className="text-slate-200">
          Em poucos minutos você receberá o convite do canal VIP no e-mail informado. Caso não veja, cheque a caixa de
          spam ou promoções.
        </p>
        <a
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.01]"
          href="/dashboard"
        >
          Ir para o dashboard
        </a>
      </div>
    </div>
  );
}
