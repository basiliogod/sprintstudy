import { fetchRawAnalyticsData } from '@/models/analyticsModel';

/**
 * Serviço de Negócio para Computação de Métricas do Analytics Dashboard
 * Processa dados brutos para gerar KPIs globais, análise comparativa do Teste A/B e registos consolidados.
 */

export async function getAnalyticsSummary() {
  const { users, sessions } = await fetchRawAnalyticsData();

  // Mapeamento de utilizadores para acesso O(1)
  const userMap = new Map();
  for (const u of users) {
    userMap.set(u.id, u);
  }

  // Enriquecer sessões com dados do utilizador (username e grupo A/B)
  const enrichedSessions = sessions.map((s) => {
    const user = userMap.get(s.user_id);
    const abGroup = user?.ab_group || 'A';
    return {
      id: s.id,
      shortId: s.id ? s.id.slice(0, 8) : 'n/a',
      userId: s.user_id,
      username: user?.username || 'Estudante Anónimo',
      abGroup,
      studyTopic: s.study_topic || 'Sem tópico',
      durationMinutes: s.duration_minutes || 45,
      status: s.status,
      startedAt: s.started_at,
      completedAt: s.completed_at,
    };
  });

  // 1. Métricas Globais
  const distinctSessionUserIds = new Set(sessions.map((s) => s.user_id).filter(Boolean));
  const totalUsers = Math.max(users.length, distinctSessionUserIds.size);
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const cancelledSessions = sessions.filter((s) => s.status === 'cancelled').length;
  const startedSessions = sessions.filter((s) => s.status === 'started').length;

  const completionRate = totalSessions > 0
    ? Number(((completedSessions / totalSessions) * 100).toFixed(1))
    : 0;

  const cancellationRate = totalSessions > 0
    ? Number(((cancelledSessions / totalSessions) * 100).toFixed(1))
    : 0;

  const activeRate = totalSessions > 0
    ? Number(((startedSessions / totalSessions) * 100).toFixed(1))
    : 0;

  const totalFocusMinutes = sessions
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + (s.duration_minutes || 45), 0);

  const totalFocusHours = Number((totalFocusMinutes / 60).toFixed(1));

  const avgSessionDuration = completedSessions > 0
    ? Math.round(totalFocusMinutes / completedSessions)
    : 0;

  // Métrica Primária de Sucesso do Projeto (Launch Goal: 30 sessões completas por utilizadores diferentes)
  const uniqueUsersWithCompletedSession = new Set(
    sessions
      .filter((s) => s.status === 'completed' && s.user_id)
      .map((s) => s.user_id)
  ).size;

  const launchTarget = 30;
  const launchProgressPercent = Number(
    Math.min(100, (uniqueUsersWithCompletedSession / launchTarget) * 100).toFixed(1)
  );
  const isLaunchTargetAchieved = uniqueUsersWithCompletedSession >= launchTarget;

  // 2. Análise de Teste A/B
  // Grupo A: Controlo (sem banner de prova social comunitária)
  // Grupo B: Variante persuasiva (com banner em tempo real "X colegas a estudar agora")
  const usersGroupA = users.filter((u) => (u.ab_group || 'A') === 'A');
  const usersGroupB = users.filter((u) => u.ab_group === 'B');

  const sessionsGroupA = enrichedSessions.filter((s) => s.abGroup === 'A');
  const sessionsGroupB = enrichedSessions.filter((s) => s.abGroup === 'B');

  const distinctUsersA = new Set(sessionsGroupA.map((s) => s.userId).filter(Boolean)).size;
  const distinctUsersB = new Set(sessionsGroupB.map((s) => s.userId).filter(Boolean)).size;
  const countUsersA = Math.max(usersGroupA.length, distinctUsersA);
  const countUsersB = Math.max(usersGroupB.length, distinctUsersB);

  const completedA = sessionsGroupA.filter((s) => s.status === 'completed').length;
  const cancelledA = sessionsGroupA.filter((s) => s.status === 'cancelled').length;
  const startedA = sessionsGroupA.filter((s) => s.status === 'started').length;
  const rateA = sessionsGroupA.length > 0
    ? Number(((completedA / sessionsGroupA.length) * 100).toFixed(1))
    : 0;
  const minutesA = sessionsGroupA
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const completedB = sessionsGroupB.filter((s) => s.status === 'completed').length;
  const cancelledB = sessionsGroupB.filter((s) => s.status === 'cancelled').length;
  const startedB = sessionsGroupB.filter((s) => s.status === 'started').length;
  const rateB = sessionsGroupB.length > 0
    ? Number(((completedB / sessionsGroupB.length) * 100).toFixed(1))
    : 0;
  const minutesB = sessionsGroupB
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const diffPoints = Number((rateB - rateA).toFixed(1));
  const relativeUplift = rateA > 0
    ? Number((((rateB - rateA) / rateA) * 100).toFixed(1))
    : null;

  const abTesting = {
    hypothesis:
      'A exibição do gatilho persuasivo de prova social em tempo real (Grupo B) visa aumentar o rácio de conclusão de sprints de 45 minutos em relação ao grupo de controlo neutro (Grupo A).',
    groupA: {
      name: 'Grupo A (Controlo)',
      description: 'Interface padrão sem indicador de prova social comunitária',
      usersCount: countUsersA,
      totalSessions: sessionsGroupA.length,
      completedSessions: completedA,
      cancelledSessions: cancelledA,
      startedSessions: startedA,
      completionRate: rateA,
      totalFocusMinutes: minutesA,
      totalFocusHours: Number((minutesA / 60).toFixed(1)),
      avgSessionsPerUser: countUsersA > 0
        ? Number((sessionsGroupA.length / countUsersA).toFixed(1))
        : 0,
    },
    groupB: {
      name: 'Grupo B (Variante Persuasiva)',
      description: 'Interface com banner de prova social ("X estudantes a focar agora")',
      usersCount: countUsersB,
      totalSessions: sessionsGroupB.length,
      completedSessions: completedB,
      cancelledSessions: cancelledB,
      startedSessions: startedB,
      completionRate: rateB,
      totalFocusMinutes: minutesB,
      totalFocusHours: Number((minutesB / 60).toFixed(1)),
      avgSessionsPerUser: countUsersB > 0
        ? Number((sessionsGroupB.length / countUsersB).toFixed(1))
        : 0,
    },
    comparison: {
      diffPercentagePoints: diffPoints,
      relativeUplift: relativeUplift,
      hasWinner: diffPoints !== 0,
      winningGroup: diffPoints > 0 ? 'B' : diffPoints < 0 ? 'A' : 'Tied',
    },
  };

  const rawRestUrl =
    'https://awbgraeosgjjzczcshgj.supabase.co/rest/v1/sessions?select=*&apikey=sb_publishable_c-EkpWVyxUOf3O8W-JEhKQ_JqtLAlts';

  return {
    timestamp: new Date().toISOString(),
    metrics: {
      totalUsers,
      totalSessions,
      completedSessions,
      cancelledSessions,
      startedSessions,
      completionRate,
      cancellationRate,
      activeRate,
      totalFocusMinutes,
      totalFocusHours,
      avgSessionDuration,
      // Métrica Primária de Sucesso (North Star Metric)
      uniqueUsersWithCompletedSession,
      launchTarget,
      launchProgressPercent,
      isLaunchTargetAchieved,
    },
    abTesting,
    rawSessions: enrichedSessions,
    usersSummary: users.map((u) => ({
      id: u.id,
      username: u.username || 'Anónimo',
      abGroup: u.ab_group || 'A',
      createdAt: u.created_at,
    })),
    rawRestUrl,
  };
}
