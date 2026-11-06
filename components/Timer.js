// Temporizador de 45 minutos para sessão de estudo

'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import confetti from 'canvas-confetti';

const SPRINT_DURATION_SECONDS = 45 * 60; // 45 minutos fixos (Efeito Ancoragem)

export default function Timer({ userSession, onSprintComplete }) {
  const [topic, setTopic] = useState('');
  const [timeLeft, setTimeLeft] = useState(SPRINT_DURATION_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);

  const audioRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Detetar perda de foco (mudança de separador) para dissuadir distrações
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        setTabSwitches((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  // Contagem decrescente do temporizador
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleCompleteSprint();
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isActive, timeLeft]);

  // Iniciar Sprint de 45 minutos (Grava 'started' na BD)
  const handleStartSprint = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsActive(true);
    setTabSwitches(0);

    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            user_id: userSession?.userId,
            study_topic: topic.trim(),
            duration_minutes: 45,
            status: 'started',
            started_at: new Date().toISOString(),
          },
        ])
        .select('id')
        .single();

      if (!error && data) {
        setSessionId(data.id);
      }
    } catch (err) {
      console.error('Erro ao registar início de sessão:', err);
    }
  };

  // Concluir Sprint com Sucesso (Grava 'completed' na BD)
  const handleCompleteSprint = async () => {
    clearInterval(timerIntervalRef.current);
    setIsActive(false);

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
        await supabase
          .from('sessions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      } catch (err) {
        console.error('Erro ao atualizar conclusão no Supabase:', err);
      }
    }

    if (onSprintComplete) {
      onSprintComplete({ topic, duration: 45 });
    }
  };

  // Cancelar Sprint (Grava 'cancelled' na BD para o teste A/B)
  const handleCancelSprint = async () => {
    if (!confirm('Tens a certeza que queres desistir deste Sprint de 45 minutos? A tua sequência será afetada.')) {
      return;
    }

    clearInterval(timerIntervalRef.current);
    setIsActive(false);
    setTimeLeft(SPRINT_DURATION_SECONDS);

    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
    }

    if (sessionId) {
      try {
        await supabase
          .from('sessions')
          .update({
            status: 'cancelled',
            completed_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      } catch (err) {
        console.error('Erro ao cancelar sessão no Supabase:', err);
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