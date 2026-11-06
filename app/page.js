// Rota '/' que serve como página inicial da aplicação
// Irá conter o timer de 45 minutos

'use client';

import { useEffect, useState } from 'react';
import { getOrCreateUserSession } from '@/lib/userSession';
import Timer from '@/components/Timer';
import SocialProofBanner from '@/components/SocialProofBanner';
import RegisterModal from '@/components/RegisterModal';

export default function HomePage() {
  const [userSession, setUserSession] = useState(null);
  const [completedSprintData, setCompletedSprintData] = useState(null);

  useEffect(() => {
    async function initSession() {
      const session = await getOrCreateUserSession();
      setUserSession(session);
    }
    initSession();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 flex flex-col items-center">
      
      {/* Cabeçalho da Proposta de Valor */}
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Sprints de Estudo <span className="text-indigo-600 dark:text-indigo-400">Sem Distrações</span>
        </h1>
        <p className="max-w-lg text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mx-auto">
          Compromete-te com um bloco de 45 minutos de foco absoluto. Sem ruído, sem redes sociais e com suporte comunitário.
        </p>
      </div>

      {/* VARIANTE DO TESTE A/B: Exibida apenas para o Grupo B */}
      {userSession?.abGroup === 'B' && <SocialProofBanner />}

      {/* Temporizador Central */}
      <Timer 
        userSession={userSession} 
        onSprintComplete={(data) => setCompletedSprintData(data)} 
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