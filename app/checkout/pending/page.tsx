export default function CheckoutPendingPage() {
  return (
    <div className="min-h-[60vh] bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-8 shadow-lg shadow-amber-500/20">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-200">Pagamento em análise</p>
        <h1 className="text-3xl font-semibold">Estamos validando a sua transação</h1>
        <p className="text-slate-200">
          Assim que o Mercado Pago confirmar o pagamento, liberaremos seu acesso ao canal VIP e enviaremos o convite por
          e-mail.
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
