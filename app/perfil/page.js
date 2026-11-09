// Rota '/perfil' que serve como página de perfil do utilizador
// Irá conter estatísticas de estudo, histórico de sessões, progresso e streak
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

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
  });

  useEffect(() => {
    async function loadUserData() {
      setLoading(true);

      const storedUser = localStorage.getItem('studysprint_username');
      setUsername(storedUser);

      // Obter utilizador autenticado atual (anónimo ou registado)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUserId =
        session?.user?.id || localStorage.getItem('studysprint_user_id');

      if (!currentUserId) {
        setLoading(false);
        return;
      }

      // Se ainda não temos username no state mas o utilizador já tem perfil registado
      if (!storedUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('username')
          .eq('id', currentUserId)
          .maybeSingle();

        if (userData?.username) {
          setUsername(userData.username);
          localStorage.setItem('studysprint_username', userData.username);
        }
      }

      // Procurar sessões do utilizador
      const { data: userSessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', currentUserId)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar sessões:', error);
      } else if (userSessions) {
        setSessions(userSessions);
        computeStatistics(userSessions);
      }

      setLoading(false);
    }

    loadUserData();
  }, []);

  // Calcular métricas, Streak diário e Nível de Foco
  const computeStatistics = (sessionList) => {
    const completed = sessionList.filter((s) => s.status === 'completed');
    const completedCount = completed.length;
    const totalMinutes = completed.reduce(
      (acc, s) => acc + (s.duration_minutes || 45),
      0
    );

    // 1. Cálculo da Sequência Diária (Streak)
    // Agrupar dias únicos em que houve pelo menos uma sessão completada
    const uniqueDays = Array.from(
      new Set(
        completed.map((s) =>
          new Date(s.completed_at || s.started_at).toISOString().split('T')[0]
        )
      )
    ).sort((a, b) => new Date(b) - new Date(a)); // Mais recente para mais antigo

    let streak = 0;
    if (uniqueDays.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // O streak está ativo se estudou hoje ou se estudou ontem
      let checkDate = new Date();
      if (!uniqueDays.includes(todayStr) && uniqueDays.includes(yesterdayStr)) {
        checkDate = yesterday;
      }

      for (const dayStr of uniqueDays) {
        const expectedStr = checkDate.toISOString().split('T')[0];
        if (dayStr === expectedStr) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 2. Cálculo do Nível de Foco 
    let focusLevel = 'Novato do Foco';
    if (totalMinutes >= 450) {
      focusLevel = 'Mestre do Estudo';
    } else if (totalMinutes >= 225) {
      focusLevel = 'Estudante Focado';
    } else if (totalMinutes >= 90) {
      focusLevel = 'Explorador Consistente';
    } else if (totalMinutes >= 45) {
      focusLevel = 'Iniciante do Foco';
    }

    setStats({
      completedCount,
      totalMinutes,
      streak,
      focusLevel,
    });
  };

  const handleLogout = async () => {
    localStorage.removeItem('studysprint_username');
    localStorage.removeItem('studysprint_user_id');
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-sm text-zinc-500">
        A carregar perfil e métricas de foco...
      </div>
    );
  }

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
        {/* Streak / Sequência Diária */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900 shadow-xs">
          <div className="text-3xl font-extrabold text-orange-500 flex items-center justify-center gap-1.5">
             {stats.streak}
          </div>
          <div className="mt-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Dias de Sequência (Streak)
          </div>
          <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            Mantém o ritmo diário sem resetar
          </div>
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
                        +45 min ✓
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