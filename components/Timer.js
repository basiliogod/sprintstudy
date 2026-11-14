// Temporizador de 45 minutos para sessão de estudo
// VIEW desacoplada: comunica exclusivamente com o API Gateway (/api/sessions)
// Inclui micro-compromissos, sons ambientes múltiplos, sino tibetano e fecho dopaminérgico

'use client';

import { useState, useEffect, useRef } from 'react';
import { apiSessionsStart, apiSessionsUpdate } from '@/lib/apiClient';
import confetti from 'canvas-confetti';

const SPRINT_DURATION_SECONDS = 45 * 60; // 45 minutos fixos (Efeito Ancoragem)
const STORAGE_KEY_ACTIVE_SPRINT = 'studysprint_active_sprint';

const AMBIENT_SOUNDS = [
  {
    id: 'lofi',
    name: 'Lo-Fi Beats',
    src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'rain',
    name: 'Chuva Suave',
    src: 'https://cdn.pixabay.com/download/audio/2022/05/13/audio_257112ce99.mp3?filename=soundsforyou-soft-rain-ambient-111154.mp3',
  },
  {
    id: 'cafe',
    name: 'Café & Biblioteca',
    src: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_6872fe6dc2.mp3?filename=freesound_community-ambience-coffee-shop-5-17059.mp3',
  },
];

// Função de síntese acústica do Sino Tibetano / Gongo de Meditação (Web Audio API)
function playMeditationBell() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playHarmonic = (freq, gainLevel, decay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decay);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + decay);
    };

    // Harmónicos ricos de tigela tibetana
    playHarmonic(432, 0.45, 5.0);
    playHarmonic(864, 0.18, 3.5);
    playHarmonic(1296, 0.09, 2.2);
    playHarmonic(216, 0.3, 5.5);
  } catch (e) {
    console.error('Erro ao tocar sino de meditação:', e);
  }
}

export default function Timer({ userSession, onSprintComplete }) {
  const [topic, setTopic] = useState('');
  const [timeLeft, setTimeLeft] = useState(SPRINT_DURATION_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [tabSwitches, setTabSwitches] = useState(0);

  // Micro-compromissos pré-Sprint (iniciam desmarcados)
  const [phoneCheck, setPhoneCheck] = useState(false);
  const [waterCheck, setWaterCheck] = useState(false);

  // Seleção e reprodução de sons ambientes
  const [selectedSoundId, setSelectedSoundId] = useState('lofi');
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Notificações visuais de estado
  const [restoredNotice, setRestoredNotice] = useState(false);
  const [abandonedNotice, setAbandonedNotice] = useState(false);

  // Fecho Dopaminérgico da Tarefa pós-timer
  const [reviewingTask, setReviewingTask] = useState(false);
  const [taskOutcome, setTaskOutcome] = useState(null);

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
        e.returnValue = '';
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
            handleSprintZeroReached();
          }
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              handleSprintZeroReached();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isActive, timeLeft]);

  // 5. Iniciar Sprint de 45 minutos (via API Gateway)
  const handleStartSprint = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsActive(true);
    setTabSwitches(0);
    setRestoredNotice(false);
    setAbandonedNotice(false);
    setReviewingTask(false);
    setTaskOutcome(null);

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

  // 6. Momento em que o relógio bate 00:00 -> Toca o Sino e Abre a Avaliação Dopaminérgica
  const handleSprintZeroReached = () => {
    clearInterval(timerIntervalRef.current);
    setIsActive(false);

    // Toca o sino tibetano de finalização!
    playMeditationBell();

    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
    }

    // Abre o ecrã de fecho da tarefa antes de avançar para a celebração final
    setReviewingTask(true);
  };

  // 7. Confirmação do Fecho da Tarefa com Efeito Riscado e Confetes
  const handleConfirmTaskOutcome = async (outcome) => {
    setTaskOutcome(outcome);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_SPRINT);

    // Efeito de celebração dopaminérgica
    try {
      confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
    } catch (e) {}

    // Grava conclusão na base de dados
    if (sessionId) {
      try {
        await apiSessionsUpdate(sessionId, { status: 'completed' });
      } catch (err) {
        console.error('Erro ao atualizar conclusão via API Gateway:', err);
      }
    }

    // Aguarda 1.2 segundos para o utilizador ver a tarefa riscada com satisfação
    setTimeout(() => {
      setReviewingTask(false);
      if (onSprintComplete) {
        onSprintComplete({ topic, duration: 45, outcome });
      }
    }, 1200);
  };

  // 8. Cancelar Sprint (via API Gateway)
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

  // Gestão dos Sons Ambiente
  const currentSound = AMBIENT_SOUNDS.find((s) => s.id === selectedSoundId) || AMBIENT_SOUNDS[0];

  // Sincronização e reprodução automática contínua dos sons ambiente
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioPlaying) {
      if (audio.src !== currentSound.src) {
        audio.src = currentSound.src;
        audio.load();
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn('Erro ao reproduzir som ambiente:', err);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [selectedSoundId, audioPlaying, currentSound.src]);

  const handleSelectSound = (soundId) => {
    if (soundId === selectedSoundId) {
      // Se clicou no som que já está selecionado, alterna entre tocar e pausar
      setAudioPlaying((prev) => !prev);
    } else {
      // Se clicou num som diferente, muda a faixa e toca automaticamente de imediato
      setSelectedSoundId(soundId);
      setAudioPlaying(true);
    }
  };

  const toggleSound = () => {
    setAudioPlaying((prev) => !prev);
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
        <div className="mb-4 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-300 flex items-center justify-between animate-fade-in">
          <span>Sessão recuperada! Continuas no teu Sprint de 45 minutos.</span>
          <button
            type="button"
            onClick={() => setRestoredNotice(false)}
            className="text-indigo-500 hover:text-indigo-700 font-semibold text-xs ml-2"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Alerta de sessão anterior cancelada por abandono */}
      {abandonedNotice && !isActive && (
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300 flex items-center justify-between animate-fade-in">
          <span>O teu Sprint anterior foi cancelado por abandono antes da conclusão.</span>
          <button
            type="button"
            onClick={() => setAbandonedNotice(false)}
            className="text-amber-600 hover:text-amber-800 font-semibold text-xs ml-2"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Áudio Ambiente (gestão contínua controlada via useEffect) */}
      <audio ref={audioRef} loop preload="auto" />

      {/* ======================================================== */}
      {/* ESTADO 1: ECRÃ DE AVALIAÇÃO DOPAMINÉRGICA PÓS-SPRINT    */}
      {/* ======================================================== */}
      {reviewingTask ? (
        <div className="space-y-6 py-4 animate-scale-up">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              45 minutos cumpridos
            </span>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
              Sino de Conclusão!
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Conseguiste cumprir o teu objetivo?
            </p>

            <div
              className={`text-lg font-semibold px-4 py-2 rounded-xl border transition-all ${
                taskOutcome
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 line-through dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
              }`}
            >
              {topic}
            </div>
          </div>

          {!taskOutcome ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmTaskOutcome('concluido')}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-3 text-xs transition shadow-sm active:scale-95"
              >
                Sim, com sucesso
              </button>
              <button
                type="button"
                onClick={() => handleConfirmTaskOutcome('parcial')}
                className="rounded-xl border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold py-3 px-3 text-xs transition active:scale-95"
              >
                Parcialmente
              </button>
              <button
                type="button"
                onClick={() => handleConfirmTaskOutcome('mais_tempo')}
                className="rounded-xl border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-semibold py-3 px-3 text-xs transition active:scale-95"
              >
                Preciso de mais tempo
              </button>
            </div>
          ) : (
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse py-2">
              Tarefa registada! A guardar progresso...
            </div>
          )}
        </div>
      ) : !isActive ? (
        /* ======================================================== */
        /* ESTADO 2: ANTES DE INICIAR O SPRINT                      */
        /* ======================================================== */
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

          {/* Micro-compromissos pré-Sprint (Gatilho de Intenção de Gollwitzer) */}
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40 text-left space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Checklist de Foco Profundo
            </span>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={phoneCheck}
                  onChange={(e) => setPhoneCheck(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Telemóvel virado para baixo ou noutra divisão</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={waterCheck}
                  onChange={(e) => setWaterCheck(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span>Água por perto e sem abas de redes sociais abertas</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
            <span>Duração: <strong>45 min</strong></span>
            <span>Sino de conclusão automático</span>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-indigo-600 py-4 text-base font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.99]"
          >
            Iniciar Sprint Focado (1 Clique)
          </button>
        </form>
      ) : (
        /* ======================================================== */
        /* ESTADO 3: DURANTE O SPRINT ATIVO                         */
        /* ======================================================== */
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

          {/* Seletor de Sons Ambiente (Lo-Fi, Chuva, Café) */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 px-1">
              <span>Som Ambiente de Foco:</span>
              <button
                type="button"
                onClick={toggleSound}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
              >
                {audioPlaying ? 'Pausar Som' : 'Tocar Som'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {AMBIENT_SOUNDS.map((sound) => {
                const isSelected = selectedSoundId === sound.id;
                const isPlayingThis = isSelected && audioPlaying;

                return (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() => handleSelectSound(sound.id)}
                    className={`rounded-xl px-2 py-2 text-xs font-medium border transition flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold dark:bg-indigo-950/60 dark:text-indigo-300'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {isPlayingThis && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse shrink-0" />
                    )}
                    <span className="truncate">{sound.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desistir do Sprint */}
          <div className="pt-2">
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
