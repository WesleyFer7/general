import Image from 'next/image';
import Link from 'next/link';

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-900/70 bg-slate-950/70 p-6 shadow-2xl lg:p-10">
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden>
        <Image src="/hero-1920x1080.svg" alt="" fill priority sizes="100vw" className="object-cover" />
      </div>

      <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
        <Badge>Mineração SaaS • Telegram-first</Badge>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
            Encontre o próximo Produto Vencedor antes de todo mundo.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Nosso sistema monitora o TikTok 24h por dia e envia apenas os produtos com alto potencial de escala direto no
            nosso Canal Privado de Assinantes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 px-6 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.01] hover:shadow-cyan-400/25"
          >
            Assinar por R$ 19,90
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
            <p className="text-sm text-slate-400">Mineração Automática</p>
            <p className="text-lg font-semibold text-emerald-200">
              Pare de gastar horas rolando o feed. Nós filtramos o que realmente vende.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
            <p className="text-sm text-slate-400">Acesso VIP</p>
            <p className="text-lg font-semibold text-emerald-200">
              Entre em uma comunidade exclusiva onde os virais chegam primeiro.
            </p>
          </div>
        </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-emerald-500/10 blur-3xl" />
          <div className="relative rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200">Como funciona:</div>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">Live</span>
            </div>

            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-200">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-100">O sistema identifica vídeos em ascensão.</p>
                  <p className="text-sm text-slate-400">Monitoramento contínuo para achar sinais reais de demanda.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-200">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-100">Analisamos a viabilidade de venda do produto.</p>
                  <p className="text-sm text-slate-400">Só passam os itens com alto potencial de escala.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-semibold text-emerald-200">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-100">Você recebe o alerta com o link no Telegram.</p>
                  <p className="text-sm text-slate-400">Apenas o que vale a pena testar, direto no seu canal.</p>
                </div>
              </li>
            </ol>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              Após a confirmação do pagamento, liberamos seu convite exclusivo para o canal privado onde os alertas chegam primeiro.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
