/**
 * Serviço de Métricas e Gamificação
 * Módulo puro de lógica de negócio: sem acoplamento com base de dados ou frameworks de UI.
 */

/**
 * Calcula a sequência de dias consecutivos de estudo (Streak)
 * @param {Array} completedSessions - Lista de sessões completadas
 * @returns {number} Número de dias consecutivos
 */
export function calculateStreak(completedSessions = []) {
  if (!Array.isArray(completedSessions) || completedSessions.length === 0) {
    return 0;
  }

  // Agrupa dias únicos ordenados do mais recente para o mais antigo
  const uniqueDays = Array.from(
    new Set(
      completedSessions.map((s) =>
        new Date(s.completed_at || s.started_at).toISOString().split('T')[0]
      )
    )
  ).sort((a, b) => new Date(b) - new Date(a));

  if (uniqueDays.length === 0) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // O streak continua ativo se estudou hoje OU se estudou ontem
  let checkDate = new Date();
  if (!uniqueDays.includes(todayStr) && uniqueDays.includes(yesterdayStr)) {
    checkDate = yesterday;
  } else if (!uniqueDays.includes(todayStr) && !uniqueDays.includes(yesterdayStr)) {
    // Se não estudou nem hoje nem ontem, o streak foi quebrado
    return 0;
  }

  let streak = 0;
  for (const dayStr of uniqueDays) {
    const expectedStr = checkDate.toISOString().split('T')[0];
    if (dayStr === expectedStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Determina o nível de foco cognitivo com base no total de minutos estudados
 * @param {number} totalMinutes
 * @returns {string} Nível de Foco
 */
export function calculateFocusLevel(totalMinutes = 0) {
  if (totalMinutes >= 450) return 'Mestre do Estudo';
  if (totalMinutes >= 225) return 'Estudante Focado';
  if (totalMinutes >= 90) return 'Explorador Consistente';
  if (totalMinutes >= 45) return 'Iniciante do Foco';
  return 'Novato do Foco';
}

/**
 * Agrega e calcula todas as estatísticas consolidadas de um utilizador
 * @param {Array} sessionList - Lista completa de sessões
 * @returns {Object} Estatísticas consolidadas
 */
export function calculateUserStats(sessionList = []) {
  const safeList = Array.isArray(sessionList) ? sessionList : [];
  const completed = safeList.filter((s) => s.status === 'completed');

  const completedCount = completed.length;
  const totalMinutes = completed.reduce(
    (acc, s) => acc + (s.duration_minutes || 45),
    0
  );

  const streak = calculateStreak(completed);
  const focusLevel = calculateFocusLevel(totalMinutes);

  return {
    completedCount,
    totalMinutes,
    streak,
    focusLevel,
  };
}
