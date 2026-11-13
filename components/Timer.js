// Temporizador de 45 minutos para sessão de estudo
// VIEW desacoplada: comunica exclusivamente com o API Gateway (/api/sessions)
// Suporta recuperação pós-refresh (F5), proteção beforeunload e auto-cancelamento por abandono

'use client';

import { useState, useEffect, useRef } from 'react';
import { apiSessionsStart, apiSessionsUpdate } from '@/lib/apiClient';
import confetti from 'canvas-confetti';

const SPRINT_DURATION_SECONDS = 45 * 60; // 45 minutos fixos (Efeito Ancoragem)
const STORAGE_KEY_ACTIVE_SPRINT = 'studysprint_active_sprint';

export default function Timer({ userSession, onSprintComplete }) {
  const [topic, setTopic] = useState('');
  const [timeLeft, setTimeLeft] = useState(SPRINT_DURATION_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);

  // Notificações visuais de estado
  const [restoredNotice, setRestoredNotice] = useState(false);
  const [abandonedNotice, setAbandonedNotice] = useState(false);

  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const sprintStartRef = useRef(null);

  // 1. Restaurar sessão ativa do localStorage ao carregar/recarregar a página
  useEffect(() => {
    try {
      const savedSprint = localStorage.getItem(STORAGE_KEY_ACTIVE_SPRINT);
      if (savedSprint) {
        const parsed = JSON.parse(savedSprint);
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - parsed.startTime) / 1000);
        const durationSeconds = parsed.durationSeconds || SPRINT_DURATION_SECONDS;
        const remainingSeconds = durationSeconds - elapsedSeconds;

        if (remainingSeconds > 0) {
          // --- SESSÃO ATIVA DETETADA: RETOMA O TIMER DO SEGUNDO EXATO ---
          setSessionId(parsed.sessionId);
          setTopic(parsed.topic);
          setTimeLeft(remainingSeconds);
          sprintStartRef.current = parsed.startTime;
          setIsActive(true);

          // Contabiliza a recarga/saída como distração
          const nextSwitches = (parsed.tabSwitches || 0) + 1;
          setTabSwitches(nextSwitches);
          setRestoredNotice(true);

          localStorage.setItem(
            STORAGE_KEY_ACTIVE_SPRINT,
            JSON.stringify({ ...parsed, tabSwitches: nextSwitches })
          );
        } else {
          // --- TEMPO EXPIROU COM A PÁGINA FECHADA: ABANDONO DO SPRINT ---
          apiSessionsUpdate(parsed.sessionId, { status: 'cancelled' }).catch(() => {});
          localStorage.removeItem(STORAGE_KEY_ACTIVE_SPRINT);
          setAbandonedNotice(true);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar sprint guardado:', err);
    }
  }, []);

  // 2. Proteger contra fecho ou recarregamento acidental (Aviso nativo do Browser)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isActive) {
        e.preventDefault();
        e.returnValue = ''; // Ativa o popup de confirmação de saída do navegador
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive]);

  // 3. Detetar perda de foco (mudança de separador) para dissuadir distrações
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setTabSwitches((prev) => {
          const next = prev + 1;
          try {
            const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_SPRINT);
            if (saved) {
              const parsed = JSON.parse(saved);
              localStorage.setItem(
                STORAGE_KEY_ACTIVE_SPRINT,
                JSON.stringify({ ...parsed, tabSwitches: next })
              );
            }
          } catch (e) {}
          return next;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  // 4. Contagem decrescente sincronizada com tempo real
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        if (sprintStartRef.current) {
          const elapsed = Math.floor((Date.now() - sprintStartRef.current) / 1000);
          const remaining = Math.max(0, SPRINT_DURATION_SECONDS - elapsed);
          setTimeLeft(remaining);

          if (remaining === 0) {
            handleCompleteSprint();
          }
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handleCompleteSprint();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isActive, timeLeft]);

  // Iniciar Sprint de 45 minutos (via API Gateway)
  const handleStartSprint = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsActive(true);
    setTabSwitches(0);
    setRestoredNotice(false);
    setAbandonedNotice(false);

    const startTime = Date.now();
    sprintStartRef.current = startTime;
    setTimeLeft(SPRINT_DURATION_SECONDS);

    try {
      const data = await apiSessionsStart({
        topic: topic.trim(),
        durationMinutes: 45,
      });

      if (data?.session?.id) {
        setSessionId(data.session.id);

        // Guarda o sprint ativo no localStorage para persistência a F5/reloads
        const activeData = {
          sessionId: data.session.id,
          topic: topic.trim(),
          startTime,
          durationSeconds: SPRINT_DURATION_SECONDS,
          tabSwitches: 0,
        };
        localStorage.setItem(STORAGE_KEY_ACTIVE_SPRINT, JSON.stringify(activeData));
      }
    } catch (err) {
      console.error('Erro ao registar início de sessão via API Gateway:', err);
    }
  };

  // Concluir Sprint com Sucesso (via API Gateway)
  const handleCompleteSprint = async () => {
    clearInterval(timerIntervalRef.current);
    setIsActive(false);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_SPRINT);
    setRestoredNotice(false);

    // Efeito de celebração
    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}

    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
    }

    if (sessionId) {
      try {
        await apiSessionsUpdate(sessionId, { status: 'completed' });
      } catch (err) {
        console.error('Erro ao atualizar conclusão via API Gateway:', err);
      }
    }

    if (onSprintComplete) {
      onSprintComplete({ topic, duration: 45 });
    }
  };

  // Cancelar Sprint (via API Gateway)
  const handleCancelSprint = async () => {
    if (!confirm('Tens a certeza que queres desistir deste Sprint de 45 minutos? A tua sequência será afetada.')) {
      return;
    }

    clearInterval(timerIntervalRef.current);
    setIsActive(false);
    setTimeLeft(SPRINT_DURATION_SECONDS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_SPRINT);
    setRestoredNotice(false);

    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
    }

    if (sessionId) {
      try {
        await apiSessionsUpdate(sessionId, { status: 'cancelled' });
      } catch (err) {
        console.error('Erro ao cancelar sessão via API Gateway:', err);
      }
    }
  };

  const toggleLoFiAudio = () => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setAudioPlaying(true);
    }
  };

  // Formatação MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressPercent = ((SPRINT_DURATION_SECONDS - timeLeft) / SPRINT_DURATION_SECONDS) * 100;

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-zinc-200 bg-white p-6 sm:p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-center">
      
      {/* Alerta de sessão recuperada pós-refresh/reabertura */}
      {restoredNotice && isActive && (
        <div className="mb-4 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300 flex items-center justify-between">
          <span>Sessão recuperada! Continuas no teu Sprint de 45 minutos.</span>
          <button
            type="button"
            onClick={() => setRestoredNotice(false)}
            className="text-indigo-500 hover:text-indigo-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alerta de sessão anterior cancelada por abandono */}
      {abandonedNotice && !isActive && (
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300 flex items-center justify-between">
          <span>O teu Sprint anterior foi cancelado por abandono antes da conclusão.</span>
          <button
            type="button"
            onClick={() => setAbandonedNotice(false)}
            className="text-amber-600 hover:text-amber-800 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Áudio Lo-Fi de Foco (Reciprocidade de Cialdini) */}
      <audio
        ref={audioRef}
        loop
        src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3"
      />

      {/* Antes de Iniciar o Sprint: Declaração de Compromisso */}
      {!isActive ? (
        <form onSubmit={handleStartSprint} className="space-y-6">
          <div className="text-left space-y-2">
            <label htmlFor="topic" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              O que vais concretizar nestes 45 minutos?
            </label>
            <input
              id="topic"
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="ex: Resolver ficha 3 de Estruturas de Dados ou ler Cap. 4"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
            <span>Duração: <strong>45 min</strong></span>
            <span>Sem distrações de telemóvel</span>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.99]"
          >
            Iniciar Sprint Focado (1 Clique)
          </button>
        </form>
      ) : (
        /* Durante o Sprint Ativo */
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Sprint em Progresso
          </div>

          <h3 className="text-lg font-medium text-zinc-800 dark:text-zinc-200 truncate px-4">
            Tarefa: <span className="font-bold text-indigo-600 dark:text-indigo-400">{topic}</span>
          </h3>

          {/* Relógio em Grande */}
          <div className="relative py-4">
            <span className="text-6xl sm:text-7xl font-extrabold tracking-tight font-mono text-zinc-900 dark:text-white">
              {formattedTime}
            </span>

            {/* Barra de Progresso Suave */}
            <div className="mt-6 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-indigo-600 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Dissuasor de Distração (Mudança de separador) */}
          {tabSwitches > 0 && (
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
              Saíste deste separador {tabSwitches} {tabSwitches === 1 ? 'vez' : 'vezes'}. Mantém o foco na tua tarefa!
            </div>
          )}

          {/* Controlos e Ferramenta de Suporte Gratuita */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={toggleLoFiAudio}
              className={`rounded-xl px-4 py-2 text-xs font-semibold border transition flex items-center gap-2 ${
                audioPlaying
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50'
                  : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
               {audioPlaying ? 'Pausar Som Lo-Fi' : 'Ativar Som Lo-Fi Gratuito'}
            </button>

            <button
              type="button"
              onClick={handleCancelSprint}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 dark:hover:bg-rose-950/40 transition"
            >
              Desistir do Sprint
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
