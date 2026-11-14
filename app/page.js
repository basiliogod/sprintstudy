// Rota '/' que serve como página inicial da aplicação
// Irá conter o timer de 45 minutos e gatilhos de urgência de Streak e Congeladores

'use client';

import { useEffect, useState } from 'react';
import { getOrCreateUserSession } from '@/lib/apiClient';
import Timer from '@/components/Timer';
import SocialProofBanner from '@/components/SocialProofBanner';
import RegisterModal from '@/components/RegisterModal';
import SemesterClimb from '@/components/SemesterClimb';

export default function HomePage() {
  const [userSession, setUserSession] = useState(null);
  const [completedSprintData, setCompletedSprintData] = useState(null);

  const loadSession = async () => {
    const session = await getOrCreateUserSession();
    setUserSession(session);
  };

  useEffect(() => {
    loadSession();
  }, []);

  const stats = userSession?.stats;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 flex flex-col items-center">
      
      {/* Cabeçalho da Proposta de Valor */}
      <div className="text-center space-y-3 mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Sprints de Estudo <span className="text-indigo-600 dark:text-indigo-400">Sem Distrações</span>
        </h1>
        <p className="max-w-lg text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mx-auto">
          Compromete-te com um bloco de 45 minutos de foco absoluto. Sem ruído, sem redes sociais e com suporte comunitário.
        </p>
      </div>

      {/* GATILHO DE URGÊNCIA: O Streak expira hoje se não completar um Sprint */}
      {stats?.streakExpiresToday && (
        <div className="w-full max-w-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 rounded-2xl border border-orange-200 bg-orange-50/90 p-3 sm:px-4 text-xs font-semibold text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-200 shadow-xs animate-fade-in">
          <div>
            O teu Streak de <strong>{stats.streak} {stats.streak === 1 ? 'dia' : 'dias'}</strong> expira hoje às <strong>23:59</strong> se não completares 1 Sprint!
          </div>

          {stats.streakFreezes > 0 ? (
            <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
              {stats.streakFreezes} Congelador Protegendo
            </span>
          ) : (
            <span className="text-[11px] text-orange-700/80 dark:text-orange-300/80">
              {stats.nextFreezeProgress}/5 para Congelador
            </span>
          )}
        </div>
      )}

      {/* INDICADOR DE SUCESSO: Já estudou hoje */}
      {stats?.studiedToday && stats?.streak > 0 && (
        <div className="w-full max-w-xl mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs animate-fade-in">
          <span>Streak de {stats.streak} {stats.streak === 1 ? 'dia' : 'dias'} seguro hoje!</span>
          {stats.streakFreezes > 0 && (
            <span className="text-[11px] text-sky-700 dark:text-sky-400 font-bold">
              {stats.streakFreezes} {stats.streakFreezes === 1 ? 'Congelador ativo' : 'Congeladores ativos'}
            </span>
          )}
        </div>
      )}

      {/* VARIANTE DO TESTE A/B: Exibida apenas para o Grupo B */}
      {userSession?.abGroup === 'B' && <SocialProofBanner />}

      {/* Resumo da Escalada do Semestre (120 Dias) */}
      <SemesterClimb
        streak={stats?.streak || 0}
        streakFreezes={stats?.streakFreezes || 0}
        streakExpiresToday={stats?.streakExpiresToday || false}
        studiedToday={stats?.studiedToday || false}
        variant="compact"
      />

      {/* Temporizador Central */}
      <Timer 
        userSession={userSession} 
        onSprintComplete={(data) => {
          setCompletedSprintData(data);
          loadSession();
        }} 
      />

      {/* Pilares de Apoio Cognitivo */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl text-center">
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="text-indigo-600 dark:text-indigo-400 text-xl font-bold mb-1">45 min</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">O padrão ideal para foco profundo sem fadiga mental</div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="text-indigo-600 dark:text-indigo-400 text-xl font-bold mb-1">1 Clique</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Começa imediatamente como convidado sem burocracias</div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-4 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="text-indigo-600 dark:text-indigo-400 text-xl font-bold mb-1">Streak Diário</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Mantém a tua sequência ativa todos os dias</div>
        </div>
      </div>

      {/* Modal de Conclusão */}
      <RegisterModal
        sprintData={completedSprintData}
        onClose={() => setCompletedSprintData(null)}
      />
    </div>
  );
}
