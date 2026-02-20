import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function getUserProfile(email: string): Promise<{ plan?: string | null; is_vip?: boolean } | null> {
  try {
    const { rows } = await query<{ plan: string | null; is_vip: boolean | null }>(
      'SELECT plan, is_vip FROM profiles WHERE email = $1 LIMIT 1',
      [email],
    );
    const data = rows[0];
    if (!data) return null;
    return { plan: data.plan ?? null, is_vip: Boolean(data.is_vip) };
  } catch (error) {
    console.error('[DASHBOARD] falha ao buscar perfil (db)', error);
    return null;
  }
}

export default async function DashboardPage() {
  const jar = cookies();
  const email = jar.get('user_email')?.value;
  if (!email) redirect('/registro');

  const profile = await getUserProfile(email);
  const isActive = Boolean(profile?.is_vip) || profile?.plan === 'active';
  const invite = process.env.NEXT_PUBLIC_TELEGRAM_INVITE || process.env.TELEGRAM_INVITE_LINK;

  return (
    <div className="min-h-[70vh] bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Área do Assinante</p>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-slate-400">Acesse o canal VIP e receba os produtos vencedores.</p>
        </div>

        {isActive ? (
          <div className="rounded-2xl border border-emerald-600/40 bg-emerald-500/10 p-6 shadow-lg shadow-emerald-500/20">
            <p className="text-sm uppercase tracking-wide text-emerald-200">Plano ativo</p>
            <h2 className="text-2xl font-semibold text-emerald-100">Você está liberado para o canal VIP</h2>
            <p className="text-slate-200">Clique abaixo para entrar no canal privado e receber os alertas em tempo real.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={invite || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:scale-[1.01] disabled:opacity-70"
              >
                🔓 ACESSAR CANAL DE MINERAÇÃO VIP
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg">
            <p className="text-sm uppercase tracking-wide text-rose-200">Assinatura inativa</p>
            <h2 className="text-2xl font-semibold">Sua assinatura expirou.</h2>
            <p className="text-slate-300">Renove para continuar recebendo produtos vencedores e alertas prioritários.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-rose-500/30 transition hover:scale-[1.01]"
              >
                Renovar agora
              </a>
              <a
                href="/registro"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
              >
                Atualizar dados
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
