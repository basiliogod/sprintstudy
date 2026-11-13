// Variante persuasiva B (banner com "X colegas a estudar agora")
// VIEW desacoplada: consome os dados do API Gateway (/api/sessions?activeOnly=true)

'use client';

import { useEffect, useState } from 'react';
import { apiSessionsGet } from '@/lib/apiClient';

export default function SocialProofBanner() {
  const [activeCount, setActiveCount] = useState(1);

  useEffect(() => {
    async function fetchRealActiveSessions() {
      try {
        const data = await apiSessionsGet(true);
        if (data && typeof data.activeCount === 'number') {
          setActiveCount(data.activeCount);
        }
      } catch (err) {
        console.error('Erro ao obter contagem de prova social:', err);
      }
    }

    fetchRealActiveSessions();
    const interval = setInterval(fetchRealActiveSessions, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-6 flex items-center gap-2.5 rounded-full border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-xs font-medium text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 shadow-xs animate-fade-in">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-indigo-600" />
      </span>
      <span>
        {activeCount === 1 ? (
          <>Neste momento, <strong>1 estudante</strong> está focado em Sprint.</>
        ) : (
          <>Neste momento, <strong>{activeCount} estudantes</strong> da universidade estão a estudar em Sprint.</>
        )}
      </span>
    </div>
  );
}
