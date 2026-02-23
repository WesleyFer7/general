"use client";

import { useFormState, useFormStatus } from 'react-dom';
import { useMemo, useState } from 'react';

type Props = {
  action: (state: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? 'Enviando...' : 'Salvar e continuar'}
    </button>
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  const parts = [digits.slice(0, 2), digits.slice(2, 7), digits.slice(7, 11)];
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${parts[0]}) ${parts[1]}`;
  return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
}

export default function RegistrationForm({ action }: Props) {
  const [state, formAction] = useFormState(action, { error: undefined });
  const [phone, setPhone] = useState('');

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-semibold text-slate-100">
          Nome Completo
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Ex: Ana Silva"
          className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-50 outline-none ring-emerald-500/60 transition focus:border-emerald-500/60 focus:ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-semibold text-slate-100">
          WhatsApp
        </label>
        <input
          id="phone"
          name="phone"
          inputMode="tel"
          placeholder="(67) 99313-9999"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-50 outline-none ring-emerald-500/60 transition focus:border-emerald-500/60 focus:ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-semibold text-slate-100">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="email@dominio.com"
          className="w-full rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-slate-50 outline-none ring-emerald-500/60 transition focus:border-emerald-500/60 focus:ring"
        />
      </div>

      {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}

      <SubmitButton />
    </form>
  );
}
