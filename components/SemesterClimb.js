'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const TOTAL_SEMESTER_DAYS = 120;
const SUMMIT_ALTITUDE_METERS = 4810; // Altitude simbólica (Pico do Semestre)

const CAMPS = [
  { day: 0, altitude: 0, name: 'Acampamento Base', label: 'Base', stage: 'Início do Semestre' },
  { day: 30, altitude: 1200, name: 'Planalto dos Fundamentos', label: 'Camp 1 (Dia 30)', stage: 'Primeiras Entregas' },
  { day: 60, altitude: 2400, name: 'Encosta Intercalar', label: 'Camp 2 (Dia 60)', stage: 'Frequências e Testes' },
  { day: 90, altitude: 3600, name: 'Crista dos Exames', label: 'Camp 3 (Dia 90)', stage: 'Reta Final / Projetos' },
  { day: 120, altitude: 4810, name: 'Pico do Semestre', label: 'Cume (Dia 120)', stage: 'Semestre Concluído!' },
];

export default function SemesterClimb({
  streak = 0,
  streakFreezes = 0,
  streakExpiresToday = false,
  studiedToday = false,
  variant = 'full', // 'full' (Perfil) ou 'compact' (Home)
}) {
  const currentStep = Math.min(TOTAL_SEMESTER_DAYS, Math.max(0, streak || 0));
  const progressPercent = Number(((currentStep / TOTAL_SEMESTER_DAYS) * 100).toFixed(1));
  const currentAltitude = Math.round((currentStep / TOTAL_SEMESTER_DAYS) * SUMMIT_ALTITUDE_METERS);

  // Próximo marco / acampamento
  const nextCamp = CAMPS.find((c) => c.day > currentStep) || CAMPS[CAMPS.length - 1];
  const daysToNextCamp = Math.max(0, nextCamp.day - currentStep);

  // Posição física do escalador no SVG
  const pathRef = useRef(null);
  const [climberPos, setClimberPos] = useState({ x: 50, y: 155 });

  const pathD =
    'M 50,155 C 130,155 150,128 215,125 C 285,122 315,98 380,95 C 450,92 480,68 545,65 C 615,62 650,35 710,30';

  useEffect(() => {
    if (pathRef.current) {
      try {
        const totalLength = pathRef.current.getTotalLength();
        const targetLength = (progressPercent / 100) * totalLength;
        const point = pathRef.current.getPointAtLength(targetLength);
        if (point) {
          setClimberPos({ x: point.x, y: point.y });
        }
      } catch {
        // Fallback analítico se getPointAtLength falhar
        const t = progressPercent / 100;
        setClimberPos({
          x: 50 + t * 660,
          y: 155 - t * 125,
        });
      }
    }
  }, [progressPercent]);

  // ==============================================================
  // VARIANTE COMPACTA (Home Page)
  // ==============================================================
  if (variant === 'compact') {
    return (
      <div className="w-full max-w-xl mb-6 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
              Escalada do Semestre
            </span>
            <span className="ml-2 text-zinc-500 dark:text-zinc-400 font-mono">
              Dia {currentStep} de 120 ({progressPercent}%)
            </span>
          </div>

          <Link
            href="/perfil"
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
          >
            Ver Detalhes
          </Link>
        </div>

        {/* Barra de Progresso da Escalada com Marcações dos 4 Patamares */}
        <div className="space-y-1.5">
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 transition-all duration-700 rounded-full"
              style={{ width: `${Math.max(3, progressPercent)}%` }}
            />
          </div>

          {/* Rótulos dos Acampamentos */}
          <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
            <span>Base (0d)</span>
            <span>Camp 1 (30d)</span>
            <span>Camp 2 (60d)</span>
            <span>Camp 3 (90d)</span>
            <span>Cume (120d)</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px] border-t border-zinc-100 dark:border-zinc-800/80">
          <span className="text-zinc-600 dark:text-zinc-400 font-medium truncate">
            Altitude: <strong className="font-mono text-zinc-900 dark:text-zinc-200">{currentAltitude}m</strong>
            {currentStep < 120 && (
              <span className="ml-1 text-zinc-500">
                (Faltam {daysToNextCamp} {daysToNextCamp === 1 ? 'dia' : 'dias'} para {nextCamp.name})
              </span>
            )}
          </span>

          {currentStep > 0 && (
            <span className="text-orange-600 dark:text-orange-400 font-bold shrink-0 text-[10px]">
              {streakExpiresToday ? 'Queda à meia-noite se não estudares!' : 'Patamar seguro hoje'}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ==============================================================
  // VARIANTE COMPLETA (Página de Perfil)
  // ==============================================================
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs space-y-6">
      
      {/* Cabeçalho da Escalada */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
              Jornada de 120 Dias
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
              1 Semestre Académico
            </span>
          </div>

          <h2 className="mt-2 text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
            A Escalada do Semestre (Pico dos 120 Dias)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Cada dia de sprint consecutivo sobe 1 patamar rumo ao Cume. Se perderes a sequência, voltas ao Acampamento Base.
          </p>
        </div>

        {/* Altitude Atual e Progresso */}
        <div className="text-left sm:text-right">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Altitude Atual</span>
          <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {currentAltitude}m <span className="text-xs font-medium text-zinc-400">/ 4.810m</span>
          </p>
          <span className="text-[11px] font-mono text-zinc-500">
            Dia {currentStep} de 120 ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* SVG da Montanha & Trilho Vetorial */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-50/80 p-3 sm:p-4 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
        <svg
          viewBox="0 0 760 190"
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Gradiente da Linha de Escalada */}
            <linearGradient id="climbTrailGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>

            {/* Gradiente da Silhueta da Montanha */}
            <linearGradient id="mountainSilhouetteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Silhueta da Montanha (Preenchimento) */}
          <path
            d={`${pathD} L 710,180 L 50,180 Z`}
            fill="url(#mountainSilhouetteGrad)"
          />

          {/* Linha do Trilho Completo (Fundo pontilhado) */}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="4 5"
            className="text-zinc-300 dark:text-zinc-700"
          />

          {/* Linha do Trilho Percorrido (Sólido com Gradiente) */}
          <path
            ref={pathRef}
            d={pathD}
            fill="none"
            stroke="url(#climbTrailGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - progressPercent}
            className="transition-all duration-1000 ease-out"
          />

          {/* Patamares / Acampamentos ao longo da curva */}
          {/* Base: (50, 155) */}
          <circle cx="50" cy="155" r="5" className={currentStep >= 0 ? 'fill-indigo-600' : 'fill-zinc-400'} />
          <text x="50" y="175" textAnchor="middle" className="text-[10px] font-mono fill-zinc-500 font-bold">
            Base (0d)
          </text>

          {/* Camp 1: (215, 125) */}
          <circle cx="215" cy="125" r="5" className={currentStep >= 30 ? 'fill-indigo-600' : 'fill-zinc-400 dark:fill-zinc-600'} />
          <text x="215" y="145" textAnchor="middle" className="text-[10px] font-mono fill-zinc-500 font-bold">
            Camp 1 (30d)
          </text>

          {/* Camp 2: (380, 95) */}
          <circle cx="380" cy="95" r="5" className={currentStep >= 60 ? 'fill-indigo-600' : 'fill-zinc-400 dark:fill-zinc-600'} />
          <text x="380" y="115" textAnchor="middle" className="text-[10px] font-mono fill-zinc-500 font-bold">
            Camp 2 (60d)
          </text>

          {/* Camp 3: (545, 65) */}
          <circle cx="545" cy="65" r="5" className={currentStep >= 90 ? 'fill-indigo-600' : 'fill-zinc-400 dark:fill-zinc-600'} />
          <text x="545" y="85" textAnchor="middle" className="text-[10px] font-mono fill-zinc-500 font-bold">
            Camp 3 (90d)
          </text>

          {/* Cume: (710, 30) */}
          <circle cx="710" cy="30" r="6" className={currentStep >= 120 ? 'fill-emerald-500' : 'fill-zinc-400 dark:fill-zinc-600'} />
          <text x="710" y="15" textAnchor="middle" className="text-[11px] font-mono fill-indigo-600 dark:fill-indigo-400 font-extrabold">
            CUME (120d)
          </text>

          {/* Marcador do Escalador na Posição Atual */}
          {currentStep > 0 && (
            <g transform={`translate(${climberPos.x}, ${climberPos.y})`} className="transition-all duration-700">
              <circle r="12" className="fill-indigo-400/30 animate-ping" />
              <circle r="6" className="fill-indigo-600 dark:fill-indigo-400 shadow-md" />
            </g>
          )}
        </svg>
      </div>

      {/* Alertas Psicológicos de Urgência e Mosquetão (Streak Freeze) */}
      <div className="space-y-3">
        {streakExpiresToday ? (
          <div className="rounded-2xl border border-orange-300 bg-orange-50/80 p-4 text-xs font-semibold text-orange-900 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <strong>Alerta de Queda:</strong> A tua posição no <strong>Dia {currentStep} ({currentAltitude}m)</strong> expira hoje às 23:59. Completa 1 Sprint de 45 minutos para não caíres até ao Acampamento Base!
            </div>
            {streakFreezes > 0 ? (
              <span className="shrink-0 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                {streakFreezes} Congelador salvaguarda
              </span>
            ) : (
              <span className="shrink-0 text-[11px] text-orange-700 dark:text-orange-300 font-mono">
                Sem proteção ativa
              </span>
            )}
          </div>
        ) : studiedToday && currentStep > 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
            <span>
              <strong>Altitude Segura!</strong> O teu acampamento de hoje no <strong>Dia {currentStep}</strong> está garantido. Continua a subida amanhã!
            </span>
            <span className="font-mono text-[11px]">
              {daysToNextCamp > 0 ? `Faltam ${daysToNextCamp}d para ${nextCamp.name}` : 'Cume atingido!'}
            </span>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span>
              Objetivo Atual: <strong>{nextCamp.name}</strong> ({nextCamp.altitude}m) • {nextCamp.stage}
            </span>
            <span className="font-mono text-zinc-500 font-medium">
              Faltam {daysToNextCamp} {daysToNextCamp === 1 ? 'dia consecutivo' : 'dias consecutivos'}
            </span>
          </div>
        )}
      </div>

      {/* Tabela dos 4 Acampamentos do Semestre */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {CAMPS.slice(1).map((camp) => {
          const isReached = currentStep >= camp.day;
          return (
            <div
              key={camp.day}
              className={`rounded-2xl border p-3.5 space-y-1 transition ${
                isReached
                  ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/20'
                  : 'border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Dia {camp.day}
                </span>
                <span
                  className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 ${
                    isReached
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {isReached ? 'Superado' : `${camp.altitude}m`}
                </span>
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                {camp.name}
              </h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                {camp.stage}
              </p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
