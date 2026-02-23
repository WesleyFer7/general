import { redirect } from 'next/navigation';
import RegistrationForm from './registration-form';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

type ActionState = {
  error?: string;
};

async function registerUser(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  'use server';

  const name = formData.get('name')?.toString().trim();
  const phone = formData.get('phone')?.toString().trim();
  const email = formData.get('email')?.toString().trim().toLowerCase();

  if (!name || !email) {
    return { error: 'Nome e e-mail são obrigatórios.' };
  }

  try {
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, isVip: false },
    });
  } catch (err) {
    console.error('[REGISTRO] falha ao salvar usuario', err);
    return { error: 'Erro ao salvar cadastro. Tente novamente.' };
  }

  const jar = cookies();
  jar.set('user_email', email, { httpOnly: false, sameSite: 'lax', path: '/' });
  jar.set('user_plan', 'pending', { httpOnly: false, sameSite: 'lax', path: '/' });

  redirect('/dashboard');
}

export default function RegistroPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
        <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-200">Registro</p>
          <h1 className="text-3xl font-semibold text-slate-50">Ative seu acesso</h1>
          <p className="text-slate-400">Informe seus dados para liberar o convite do canal privado no Telegram.</p>
        </div>

        <div className="relative mt-8">
          <RegistrationForm action={registerUser} />
        </div>

        <a
          href="https://wa.me/5567993133993"
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02]"
          target="_blank"
          rel="noreferrer"
        >
          Suporte no WhatsApp
        </a>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
