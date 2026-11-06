// Modal de registo que aparece após o utilizador terminar a primeira sessão de estudo
// com username e password
// não obriga o utilizador a se registar,
// mas é persuasivo para que o faça de forma a não perder o progresso e ter acesso a funcionalidades adicionais

'use client';

import Link from 'next/link';

export default function RegisterModal({ sprintData, onClose }) {
  if (!sprintData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 text-center shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-scale-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl dark:bg-emerald-950/60">
          
        </div>
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
          Sprint de 45 minutos Concluído!
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Excelente foco na tarefa: <strong className="text-zinc-900 dark:text-zinc-200">"{sprintData.topic}"</strong>.
          Queres guardar a tua sequência e histórico para aceder noutros dispositivos?
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            Criar Conta Simples (Apenas Username e Senha)
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-zinc-200 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition"
          >
            Continuar apenas como Convidado
          </button>
        </div>
      </div>
    </div>
  );
}
