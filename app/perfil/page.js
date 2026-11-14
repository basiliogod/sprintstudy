// Rota '/perfil' que serve como página de perfil do utilizador
// VIEW desacoplada: consome dados prontos do API Gateway (/api/profile)
// Inclui Alerta de Urgência de Streak, Congeladores (Streak Freeze) e Gráfico Semanal

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiProfileGet, apiAuthPost } from '@/lib/apiClient';
import Link from 'next/link';
import SemesterClimb from '@/components/SemesterClimb';

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    completedCount: 0,
    totalMinutes: 0,
    streak: 0,
    focusLevel: 'Iniciante do Foco',
    studiedToday: false,
    streakExpiresToday: false,
    weeklyBreakdown: [],
    thisWeekSprints: 0,
    streakFreezes: 0,
    nextFreezeProgress: 0,
  });

  useEffect(() => {
    async function loadUserData() {
      setLoading(true);

      try {
        const data = await apiProfileGet();

        if (data?.user) {
          setUsername(data.user.username);
          if (data.user.username) {
            localStorage.setItem('studysprint_username', data.user.username);
          }
          if (data.user.id) {
            localStorage.setItem('studysprint_user_id', data.user.id);
          }
        }

        if (data?.stats) {
          setStats((prev) => ({ ...prev, ...data.stats }));
        }

        if (Array.isArray(data?.sessions)) {
          setSessions(data.sessions);
        }
      } catch (err) {
        console.error('Erro ao carregar perfil via API Gateway:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await apiAuthPost({ action: 'logout' });
    } catch (e) {
      console.error('Erro ao terminar sessão:', e);
    }
    localStorage.removeItem('studysprint_username');
    localStorage.removeItem('studysprint_user_id');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-sm text-zinc-500">
        A carregar perfil e métricas de foco...
      </div>
    );
  }

  // Encontra o dia com mais minutos na semana para calibrar a escala das barras
  const maxWeeklyMinutes = Math.max(
    135,
    ...(stats.weeklyBreakdown?.map((d) => d.minutes) || [135])
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 space-y-8">
      {/* Cabeçalho do Perfil */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 text-xl font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              {username ? username.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
                {username ? `@${username}` : 'Modo Convidado'}
              </h1>
              <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {stats.focusLevel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!username ? (
            <Link
              href="/login"
              className="w-full sm:w-auto rounded-xl bg-indigo-600 px-4 py-2 text-center text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              Criar Conta para Salvar Histórico
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition"
            >
              Terminar Sessão
            </button>
          )}
        </div>
      </div>

      {/* Cartões de Estatísticas / Gamificação */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak / Sequência Diária (com indicador de urgência) */}
        <div
          className={`rounded-2xl border p-5 text-center shadow-xs transition ${
            stats.streakExpiresToday
              ? 'border-orange-300 bg-orange-50/50 dark:border-orange-900/60 dark:bg-orange-950/20'
              : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          <div className="text-3xl font-extrabold text-orange-500 flex items-center justify-center gap-1.5">
            {stats.streak}
          </div>
          <div className="mt-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Dias de Sequência (Streak)
          </div>

          {stats.streakExpiresToday ? (
            <div className="mt-1.5 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 animate-pulse">
              Expira hoje às 23:59!
            </div>
          ) : stats.studiedToday && stats.streak > 0 ? (
            <div className="mt-1.5 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              Seguro hoje
            </div>
          ) : (
            <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              Mantém o ritmo diário sem resetar
            </div>
          )}
        </div>

        {/* Minutos Totais de Foco */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
            {stats.totalMinutes}m
          </div>
          <div className="mt-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Minutos Focados
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            Tempo acumulado sem distrações
          </div>
        </div>

        {/* Sprints Completados */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.completedCount}
          </div>
          <div className="mt-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Sprints de 45m Concluídos
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            Blocos completos validados
          </div>
        </div>
      </div>

      {/* Cartão de Proteção: Congeladores de Sequência (Streak Freeze) */}
      <div className="rounded-3xl border border-sky-200/80 bg-sky-50/60 p-5 sm:p-6 dark:border-sky-900/40 dark:bg-sky-950/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-sky-950 dark:text-sky-200">
              Congeladores de Sequência (Streak Freeze)
            </h3>
            <span className="rounded-full bg-sky-200/70 px-2 py-0.5 text-xs font-extrabold text-sky-800 dark:bg-sky-900 dark:text-sky-200">
              {stats.streakFreezes} {stats.streakFreezes === 1 ? 'disponível' : 'disponíveis'}
            </span>
          </div>
          <p className="text-xs text-sky-800/80 dark:text-sky-300/80">
            Completa 5 sprints numa semana para ganhar 1 congelador que protege a tua sequência se falhares um dia.
          </p>
        </div>

        <div className="w-full sm:w-48 space-y-1 text-right">
          <div className="flex justify-between text-[11px] font-bold text-sky-900 dark:text-sky-300">
            <span>Progresso semanal</span>
            <span>{stats.nextFreezeProgress} / 5 sprints</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-sky-200 dark:bg-sky-900/60">
            <div
              className="h-full bg-sky-600 transition-all duration-500 rounded-full"
              style={{ width: `${(stats.nextFreezeProgress / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* A Escalada do Semestre (120 Dias) */}
      <SemesterClimb
        streak={stats.streak}
        streakFreezes={stats.streakFreezes}
        streakExpiresToday={stats.streakExpiresToday}
        studiedToday={stats.studiedToday}
        variant="full"
      />

      {/* Gráfico Semanal de Barras: Segunda a Domingo */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              Foco Semanal (Segunda a Domingo)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Minutos de estudo acumulados em cada dia da semana atual
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
            Semana Atual
          </span>
        </div>

        {/* Visualização das Barras de Seg a Dom */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-40">
            {stats.weeklyBreakdown?.map((dayData) => {
              const heightPercent =
                dayData.minutes > 0
                  ? Math.max(15, (dayData.minutes / maxWeeklyMinutes) * 100)
                  : 4;

              return (
                <div
                  key={dayData.day}
                  className="flex flex-col items-center justify-end h-full gap-2 group"
                >
                  {/* Minutos no topo da barra */}
                  <span className="text-[10px] sm:text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">
                    {dayData.minutes > 0 ? `${dayData.minutes}m` : '0'}
                  </span>

                  {/* Barra Vertical */}
                  <div className="w-full max-w-[36px] bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden flex flex-col justify-end h-28">
                    <div
                      className={`w-full transition-all duration-700 rounded-xl ${
                        dayData.isToday
                          ? 'bg-indigo-600 shadow-sm shadow-indigo-600/30'
                          : dayData.minutes > 0
                          ? 'bg-indigo-400/80 dark:bg-indigo-500/70'
                          : 'bg-transparent'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Rótulo do Dia */}
                  <span
                    className={`text-[11px] sm:text-xs font-bold ${
                      dayData.isToday
                        ? 'text-indigo-600 dark:text-indigo-400 underline underline-offset-4 decoration-2'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {dayData.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Histórico de Sessões de Estudo */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Histórico de Tarefas Concretizadas
        </h2>

        {sessions.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-500">
            Ainda não registaste nenhuma sessão de estudo.{' '}
            <Link href="/" className="text-indigo-600 hover:underline">
              Começa o teu primeiro Sprint de 45 minutos!
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {sessions.map((session) => {
              const dateStr = new Date(session.started_at).toLocaleDateString(
                'pt-PT',
                {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }
              );

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-3.5 text-sm"
                >
                  <div className="space-y-0.5 pr-4">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {session.study_topic}
                    </p>
                    <p className="text-xs text-zinc-400">{dateStr}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.status === 'completed' ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400">
                        +45 min
                      </span>
                    ) : session.status === 'cancelled' ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400">
                        Desistência
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400">
                        Iniciado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
