// Variante persuasiva B (banner com "X colegas a estudar agora")

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SocialProofBanner() {
  const [activeCount, setActiveCount] = useState(1);

  useEffect(() => {
    async function fetchRealActiveSessions() {
      try {
        const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString();
        const { count, error } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'started')
          .gte('started_at', fortyFiveMinutesAgo);

        if (!error && count !== null) {
          // Usa o valor real; se for 0, coloca pelo menos 1 (o próprio utilizador a começar)
          setActiveCount(Math.max(1, count));
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