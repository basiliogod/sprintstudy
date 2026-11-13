import { Suspense } from 'react';
import { getAnalyticsSummary } from '@/services/analyticsService';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export const metadata = {
  title: 'Analytics Dashboard - SprintStudy',
  description: 'Painel de métricas e avaliação de apenas leitura do docente.',
};

async function AnalyticsContent({ searchParamsPromise }) {
  const searchParams = await searchParamsPromise;
  const token = searchParams?.token;
  const expectedToken = process.env.ANALYTICS_SECRET_TOKEN || 'chave_secreta';

  // 1. Validação de Token de Leitura
  const isAuthenticated = Boolean(token && token === expectedToken);

  if (!isAuthenticated) {
    const hasAttemptedToken = Boolean(token);

    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:py-24">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 sm:p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="inline-block rounded-lg bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Acesso Restrito - Docente
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            SprintStudy - Analytics Dashboard
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Painel de avaliação de apenas leitura com métricas de produto, resultados experimentais de A/B testing e dados brutos da base de dados.
          </p>

          {hasAttemptedToken && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              O token fornecido é inválido. Por favor, verifique a chave secreta configurada.
            </div>
          )}

          {/* Formulário de autenticação direto sem depender de fetch do cliente */}
          <form action="/analytics" method="GET" className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="token"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400"
              >
                Chave de Acesso (Token)
              </label>
              <input
                id="token"
                name="token"
                type="text"
                defaultValue={token || ''}
                placeholder="Insira o token de leitura..."
                autoComplete="off"
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Aceder ao Dashboard
            </button>
          </form>

          <div className="mt-8 border-t border-zinc-100 pt-6 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Requisito do projeto: Acesso de visualização garantido até à publicação de notas finais. Formato: <span className="font-mono text-zinc-700 dark:text-zinc-300">/analytics?token=chave_secreta</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Obtenção dos dados no servidor (Server-Side Rendering)
  // Elimina qualquer erro de "Failed to fetch" ou bloqueios por Adblockers no browser
  try {
    const data = await getAnalyticsSummary();
    return <AnalyticsDashboard initialData={data} token={token} />;
  } catch (err) {
    console.error('Erro ao renderizar Analytics no servidor:', err);
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:py-24">
        <div className="rounded-3xl border border-rose-200 bg-white p-8 sm:p-10 shadow-sm dark:border-rose-900/60 dark:bg-zinc-900">
          <h2 className="text-lg font-bold text-rose-700 dark:text-rose-400">
            Erro ao carregar dados do servidor
          </h2>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            Não foi possível consultar os dados da base de dados. Detalhe: {err.message}
          </p>
          <a
            href={`/analytics?token=${encodeURIComponent(token)}`}
            className="mt-6 inline-block rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-zinc-900"
          >
            Tentar Novamente
          </a>
        </div>
      </div>
    );
  }
}

export default function AnalyticsPage(props) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <div className="inline-block animate-pulse rounded-full bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            A preparar o dashboard de analytics...
          </div>
        </div>
      }
    >
      <AnalyticsContent searchParamsPromise={props.searchParams} />
    </Suspense>
  );
}
