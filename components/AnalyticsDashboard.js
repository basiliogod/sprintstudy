'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsDashboard({ initialData, token }) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Filtros da Tabela
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Tenta re-obter os dados atualizados via rota segura
      const res = await fetch(`/api/platform-stats?token=${encodeURIComponent(token)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        router.refresh();
      }
    } catch {
      router.refresh();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleCopyUrl = (urlToCopy) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Filtragem de sessões brutas em memória (instantâneo)
  const filteredSessions = useMemo(() => {
    if (!data?.rawSessions) return [];

    return data.rawSessions.filter((s) => {
      const matchesSearch =
        searchQuery === '' ||
        s.studyTopic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || s.status === statusFilter;

      const matchesGroup =
        groupFilter === 'all' || s.abGroup === groupFilter;

      return matchesSearch && matchesStatus && matchesGroup;
    });
  }, [data?.rawSessions, searchQuery, statusFilter, groupFilter]);

  const { metrics, abTesting, timestamp, rawRestUrl } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 space-y-10">
      
      {/* 1. CABEÇALHO DO DASHBOARD */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              Acesso Read-Only Ativo
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              Launch Day (20 Nov)
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Painel de Analytics & Métricas
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Visualização para o docente: KPIs de adesão, teste A/B de persuasão e consulta de dados brutos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition disabled:opacity-50"
          >
            {refreshing ? 'A atualizar...' : 'Atualizar Dados'}
          </button>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
            {new Date(timestamp).toLocaleTimeString('pt-PT')}
          </span>
        </div>
      </div>

      {/* 2. MÉTRICAS GLOBAIS COM A MÉTRICA DE SUCESSO (30 SESSÕES / UTILIZADORES DIFERENTES) */}
      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Métricas Globais da Plataforma
        </h2>

        {/* Card Destaque: Métrica Primária de Sucesso do Projeto */}
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 p-6 sm:p-7 dark:border-indigo-900/60 dark:bg-gradient-to-br dark:from-indigo-950/40 dark:via-zinc-900 dark:to-purple-950/20 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-indigo-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  Métrica Primária de Sucesso (Launch Goal)
                </span>
                {metrics.isLaunchTargetAchieved ? (
                  <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Meta Atingida
                  </span>
                ) : (
                  <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Em Progresso ({metrics.launchProgressPercent}%)
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white mt-1.5">
                30 Sessões Completas por Utilizadores Diferentes
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Critério de validação do projeto: alcançar no mínimo 30 estudantes únicos a finalizar com sucesso um sprint completo de estudo focado de 45 minutos.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Progresso da Meta</span>
              <p className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {metrics.uniqueUsersWithCompletedSession || 0} <span className="text-lg font-bold text-zinc-400 dark:text-zinc-500">/ {metrics.launchTarget || 30}</span>
              </p>
              <span className="text-[11px] text-zinc-500 font-mono">
                {metrics.isLaunchTargetAchieved
                  ? 'Meta superada com sucesso!'
                  : `Faltam ${Math.max(0, (metrics.launchTarget || 30) - (metrics.uniqueUsersWithCompletedSession || 0))} utilizadores únicos`}
              </span>
            </div>
          </div>

          {/* Barra de Progresso da Meta */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
              <span>{metrics.launchProgressPercent || 0}% Concluído</span>
              <span>Alvo de Validação: 30 Utilizadores Únicos</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full transition-all duration-700 rounded-full ${
                  metrics.isLaunchTargetAchieved
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40'
                    : 'bg-indigo-600 shadow-sm shadow-indigo-600/30'
                }`}
                style={{ width: `${Math.min(100, metrics.launchProgressPercent || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Cards Complementares de KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Total Utilizadores
            </span>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-mono">
              {metrics.totalUsers}
            </p>
            <span className="text-[11px] text-zinc-400">Contas e convidados únicos</span>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Sprints Iniciados
            </span>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white font-mono">
              {metrics.totalSessions}
            </p>
            <span className="text-[11px] text-zinc-400">Sessões totais de 45 min</span>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Sprints Concluídos
            </span>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.completedSessions}
            </p>
            <span className="text-[11px] text-zinc-400">
              {metrics.completionRate}% taxa de conclusão
            </span>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Tempo de Foco Acumulado
            </span>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {metrics.totalFocusHours}h
            </p>
            <span className="text-[11px] text-zinc-400">
              {metrics.totalFocusMinutes} minutos totais
            </span>
          </div>
        </div>
      </section>

      {/* 3. TAXA DE CONCLUSÃO E DISTRIBUIÇÃO */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Taxa Geral de Conclusão e Desistência
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Distribuição do estado final de todos os sprints iniciados na aplicação
            </p>
          </div>
          <span className="text-sm font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {metrics.completedSessions} concluídas de {metrics.totalSessions} ({metrics.completionRate}%)
          </span>
        </div>

        {/* Barra de Progresso Segmentada */}
        <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${metrics.completionRate}%` }}
            title={`Concluídas: ${metrics.completionRate}%`}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${metrics.cancellationRate}%` }}
            title={`Canceladas/Desistências: ${metrics.cancellationRate}%`}
          />
          <div
            className="h-full bg-amber-400 transition-all duration-500"
            style={{ width: `${metrics.activeRate}%` }}
            title={`Em Curso: ${metrics.activeRate}%`}
          />
        </div>

        {/* Legenda dos Segmentos */}
        <div className="flex flex-wrap gap-4 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              Concluídas com sucesso: <strong>{metrics.completedSessions}</strong> ({metrics.completionRate}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500" />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              Canceladas / Abandonadas: <strong>{metrics.cancelledSessions}</strong> ({metrics.cancellationRate}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
              Em curso: <strong>{metrics.startedSessions}</strong> ({metrics.activeRate}%)
            </span>
          </div>
        </div>
      </section>

      {/* 4. RESULTADOS DE TESTE A/B */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Resultados do Teste Experimental A/B
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {abTesting.hypothesis}
            </p>
          </div>
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            Variável: Prova Social Dinâmica
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          {/* Card Grupo A - Controlo */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div>
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Grupo A
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                  {abTesting.groupA.name}
                </h3>
              </div>
              <span className="text-xs text-zinc-400">Sem Prova Social</span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {abTesting.groupA.description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-[11px] text-zinc-400">Utilizadores Atribuídos</span>
                <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                  {abTesting.groupA.usersCount}
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-[11px] text-zinc-400">Sprints Iniciados</span>
                <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                  {abTesting.groupA.totalSessions}
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-[11px] text-zinc-400">Concluídas / Canceladas</span>
                <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                  {abTesting.groupA.completedSessions} / {abTesting.groupA.cancelledSessions}
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <span className="text-[11px] text-zinc-400">Média Sprints / Aluno</span>
                <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                  {abTesting.groupA.avgSessionsPerUser}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-700/60 dark:bg-zinc-800/30">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Taxa de Conclusão Grupo A</span>
              <p className="text-2xl font-black text-zinc-800 dark:text-zinc-200 font-mono mt-0.5">
                {abTesting.groupA.completionRate}%
              </p>
            </div>
          </div>

          {/* Card Grupo B - Variante Persuasiva */}
          <div className="rounded-3xl border border-indigo-200 bg-white p-6 sm:p-7 dark:border-indigo-950/70 dark:bg-zinc-900 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-3 dark:border-indigo-950">
              <div>
                <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                  Grupo B
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mt-1">
                  {abTesting.groupB.name}
                </h3>
              </div>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Com Prova Social</span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {abTesting.groupB.description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-indigo-50/50 p-3 dark:bg-indigo-950/20">
                <span className="text-[11px] text-zinc-400">Utilizadores Atribuídos</span>
                <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                  {abTesting.groupB.usersCount}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50/50 p-3 dark:bg-indigo-950/20">
                <span className="text-[11px] text-zinc-400">Sprints Iniciados</span>
                <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                  {abTesting.groupB.totalSessions}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50/50 p-3 dark:bg-indigo-950/20">
                <span className="text-[11px] text-zinc-400">Concluídas / Canceladas</span>
                <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                  {abTesting.groupB.completedSessions} / {abTesting.groupB.cancelledSessions}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50/50 p-3 dark:bg-indigo-950/20">
                <span className="text-[11px] text-zinc-400">Média Sprints / Aluno</span>
                <p className="text-lg font-bold font-mono text-zinc-900 dark:text-white">
                  {abTesting.groupB.avgSessionsPerUser}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Taxa de Conclusão Grupo B</span>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono mt-0.5">
                {abTesting.groupB.completionRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Resumo do Impacto Experimental */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
              Comparativo de Eficácia Persuasiva
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Diferença absoluta: {abTesting.comparison.diffPercentagePoints > 0 ? `+${abTesting.comparison.diffPercentagePoints}` : abTesting.comparison.diffPercentagePoints} pontos percentuais na taxa de conclusão entre variantes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {abTesting.comparison.relativeUplift !== null && (
              <span className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {abTesting.comparison.relativeUplift >= 0 ? `+${abTesting.comparison.relativeUplift}% Uplift` : `${abTesting.comparison.relativeUplift}%`}
              </span>
            )}
            <span className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              Vencedor Atual: {abTesting.comparison.winningGroup === 'B' ? 'Grupo B (Persuasivo)' : abTesting.comparison.winningGroup === 'A' ? 'Grupo A (Controlo)' : 'Empate'}
            </span>
          </div>
        </div>
      </section>

      {/* 5. TABELA DE DADOS BRUTOS (READ-ONLY) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Tabela de Dados Brutos (Sessões Registadas)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Histórico detalhado de todas as sessões de estudo armazenadas no Supabase PostgreSQL.
            </p>
          </div>

          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
            {filteredSessions.length} de {data.rawSessions.length} sessões listadas
          </span>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por tópico, utilizador ou ID..."
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
          />

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 focus:outline-none"
            >
              <option value="all">Todos os Estados</option>
              <option value="completed">Apenas Concluídas</option>
              <option value="cancelled">Apenas Canceladas</option>
              <option value="started">Apenas Em Curso</option>
            </select>

            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 focus:outline-none"
            >
              <option value="all">Todos os Grupos A/B</option>
              <option value="A">Grupo A (Controlo)</option>
              <option value="B">Grupo B (Persuasivo)</option>
            </select>
          </div>
        </div>

        {/* Tabela Read-Only */}
        <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <th className="py-3 px-4 font-bold">ID Sessão</th>
                <th className="py-3 px-4 font-bold">Utilizador</th>
                <th className="py-3 px-4 font-bold">Grupo</th>
                <th className="py-3 px-4 font-bold">Tópico de Estudo</th>
                <th className="py-3 px-4 font-bold">Duração</th>
                <th className="py-3 px-4 font-bold">Estado</th>
                <th className="py-3 px-4 font-bold">Início</th>
                <th className="py-3 px-4 font-bold">Conclusão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-400">
                    Nenhuma sessão corresponde aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400" title={s.id}>
                      {s.shortId}...
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-white">
                      {s.username}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          s.abGroup === 'B'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        Grupo {s.abGroup}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200 max-w-[200px] truncate" title={s.studyTopic}>
                      {s.studyTopic}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                      {s.durationMinutes} min
                    </td>
                    <td className="py-3 px-4">
                      {s.status === 'completed' && (
                        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Concluída
                        </span>
                      )}
                      {s.status === 'cancelled' && (
                        <span className="inline-block rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          Cancelada
                        </span>
                      )}
                      {s.status === 'started' && (
                        <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Em Curso
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                      {s.startedAt ? new Date(s.startedAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                      {s.completedAt ? new Date(s.completedAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. ACESSO BRUTO À BASE DE DADOS (POSTGREST REST API) */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 shadow-2xs space-y-4">
        <div>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Acesso Direto à Base de Dados (REST API)
          </span>
          <h3 className="mt-2 text-base font-bold text-zinc-900 dark:text-white">
            Endpoint REST da Tabela de Sessões (Formato JSON)
          </h3>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Dados da base de dados que pode ser acedida bruta aqui ({rawRestUrl})
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
          <input
            type="text"
            readOnly
            value={rawRestUrl}
            className="flex-1 bg-transparent font-mono text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none truncate"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyUrl(rawRestUrl)}
              className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition"
            >
              {copied ? 'Copiado!' : 'Copiar URL'}
            </button>
            <a
              href={rawRestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 transition"
            >
              Abrir JSON
            </a>
          </div>
        </div>

        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
          Nota Técnica: O endpoint acima permite à equipa docente inspecionar os registos da tabela <code className="font-mono">sessions</code> em tempo real via PostgREST sem necessidade de credenciais administrativas ou criação de conta.
        </p>
      </section>

    </div>
  );
}
