/**
 * Serviço de Métricas e Gamificação
 * Módulo puro de lógica de negócio: sem acoplamento com base de dados ou frameworks de UI.
 * Inclui cálculo dinâmico de Streak com ativação automática e passiva de Streak Freeze.
 */

/**
 * Converte qualquer objeto de data para string YYYY-MM-DD considerando o calendário local
 * @param {Date|string} date
 * @returns {string} Formato YYYY-MM-DD
 */
export function toLocalDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retorna a Segunda-feira da semana de uma data no formato YYYY-MM-DD
 * @param {Date|string} date
 * @returns {string} Segunda-feira YYYY-MM-DD
 */
export function getMondayDateString(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return toLocalDateString(monday);
}

/**
 * Calcula o Streak e gere o consumo automático de Congeladores (Streak Freeze)
 * @param {Array} completedSessions - Lista de sessões completadas
 * @returns {Object} Dados consolidados do streak e congeladores
 */
export function calculateStreakAndFreezes(completedSessions = []) {
  if (!Array.isArray(completedSessions) || completedSessions.length === 0) {
    return {
      streak: 0,
      streakFreezes: 0,
      totalFreezesEarned: 0,
      freezeUsedDates: [],
      activeFreezeDate: null,
      freezeUsedRecently: false,
      nextFreezeProgress: 0,
      thisWeekSprints: 0,
      studiedToday: false,
      streakExpiresToday: false,
    };
  }

  // 1. Obter dias únicos com pelo menos 1 sprint completo
  const uniqueDays = new Set(
    completedSessions.map((s) => toLocalDateString(s.completed_at || s.started_at))
  );

  // 2. Calcular congeladores ganhos:
  // Cada semana com >= 5 sprints concede 1 congelador de proteção (máximo de 3 acumulados)
  const weekCounts = new Map();
  for (const s of completedSessions) {
    const mondayKey = getMondayDateString(s.completed_at || s.started_at);
    weekCounts.set(mondayKey, (weekCounts.get(mondayKey) || 0) + 1);
  }

  let totalFreezesEarned = 0;
  for (const count of weekCounts.values()) {
    totalFreezesEarned += Math.floor(count / 5);
  }
  totalFreezesEarned = Math.min(3, totalFreezesEarned);

  // 3. Progresso da semana atual para o próximo congelador
  const now = new Date();
  const currentMondayKey = getMondayDateString(now);
  const thisWeekSprints = weekCounts.get(currentMondayKey) || 0;
  const nextFreezeProgress = thisWeekSprints % 5;

  // 4. Hoje e Ontem
  const todayStr = toLocalDateString(now);
  const studiedToday = uniqueDays.has(todayStr);

  // 5. Cálculo do Streak com Proteção Automática (Passiva)
  // O congelador ativa-se sozinho para cobrir dias falhados sem exigir intervenção do utilizador.
  let availableFreezes = totalFreezesEarned;
  let streak = 0;
  const freezeUsedDates = [];

  let checkDate = new Date(now);

  if (studiedToday) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Hoje ainda está a decorrer (não gasta freeze hoje, o aluno pode estudar até às 23:59).
    // Começa a verificação do streak contínuo a partir de ontem.
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Percorre até 120 dias no passado (limite do semestre)
  for (let i = 0; i < 120; i++) {
    const dateStr = toLocalDateString(checkDate);

    if (uniqueDays.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // O estudante falhou este dia!
      if (availableFreezes > 0) {
        // ATIVAÇÃO AUTOMÁTICA DO CONGELADOR:
        // Cobre o dia em falta e preserva o streak
        availableFreezes--;
        freezeUsedDates.push(dateStr);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Sem congeladores disponíveis: a sequência é quebrada
        break;
      }
    }
  }

  const streakExpiresToday = streak > 0 && !studiedToday;
  const activeFreezeDate = freezeUsedDates.length > 0 ? freezeUsedDates[0] : null;
  const freezeUsedRecently = Boolean(activeFreezeDate);

  return {
    streak,
    streakFreezes: availableFreezes,
    totalFreezesEarned,
    freezeUsedDates,
    activeFreezeDate,
    freezeUsedRecently,
    nextFreezeProgress,
    thisWeekSprints,
    studiedToday,
    streakExpiresToday,
  };
}

/**
 * Calcula a sequência de dias consecutivos de estudo (Streak)
 * @param {Array} completedSessions - Lista de sessões completadas
 * @returns {number} Número de dias consecutivos
 */
export function calculateStreak(completedSessions = []) {
  const result = calculateStreakAndFreezes(completedSessions);
  return result.streak;
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
 * Gera a distribuição de minutos estudados de Segunda a Domingo na semana atual
 * @param {Array} completedSessions
 * @param {Array} freezeUsedDates - Datas que foram salvas por congelador
 * @returns {Array} Array de 7 dias com minutos e proporção
 */
export function calculateWeeklyBreakdown(completedSessions = [], freezeUsedDates = []) {
  const daysShort = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const now = new Date();
  
  // Encontra a Segunda-feira da semana atual (ISO: 1 = Seg, 7 = Dom)
  const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (currentDayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const breakdown = [];

  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + i);
    const dateStr = toLocalDateString(targetDate);

    // Soma os minutos de sessões completadas neste dia
    const daySessions = completedSessions.filter((s) => {
      const sDateStr = toLocalDateString(s.completed_at || s.started_at);
      return sDateStr === dateStr;
    });

    const minutes = daySessions.reduce((acc, s) => acc + (s.duration_minutes || 45), 0);
    const isFrozen = freezeUsedDates.includes(dateStr);

    breakdown.push({
      day: daysShort[i],
      date: dateStr,
      minutes,
      count: daySessions.length,
      isToday: dateStr === toLocalDateString(now),
      isFuture: targetDate > now && dateStr !== toLocalDateString(now),
      isFrozen,
    });
  }

  return breakdown;
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

  const streakData = calculateStreakAndFreezes(completed);
  const focusLevel = calculateFocusLevel(totalMinutes);
  const weeklyBreakdown = calculateWeeklyBreakdown(completed, streakData.freezeUsedDates);

  return {
    completedCount,
    totalMinutes,
    streak: streakData.streak,
    focusLevel,
    studiedToday: streakData.studiedToday,
    streakExpiresToday: streakData.streakExpiresToday,
    weeklyBreakdown,
    thisWeekSprints: streakData.thisWeekSprints,
    streakFreezes: streakData.streakFreezes,
    nextFreezeProgress: streakData.nextFreezeProgress,
    freezeUsedRecently: streakData.freezeUsedRecently,
    activeFreezeDate: streakData.activeFreezeDate,
    totalFreezesEarned: streakData.totalFreezesEarned,
  };
}
