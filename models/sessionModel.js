import { supabaseServer } from '@/lib/supabaseServer';

/**
 * Modelo de Acesso a Dados da tabela 'sessions'
 * Executado estritamente no servidor
 */

export async function createStudySession({ userId, studyTopic, durationMinutes = 45 }) {
  if (!userId || !studyTopic) {
    throw new Error('userId e studyTopic são obrigatórios para iniciar sessão.');
  }

  const { data, error } = await supabaseServer
    .from('sessions')
    .insert([
      {
        user_id: userId,
        study_topic: studyTopic.trim(),
        duration_minutes: durationMinutes,
        status: 'started',
        started_at: new Date().toISOString(),
      },
    ])
    .select('id, user_id, study_topic, duration_minutes, status, started_at')
    .single();

  if (error) {
    console.error('Erro no sessionModel.createStudySession:', error);
    throw error;
  }

  return data;
}

export async function updateSessionStatus(sessionId, { status, completedAt }) {
  if (!sessionId || !status) {
    throw new Error('sessionId e status são obrigatórios.');
  }

  const validStatuses = ['started', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Estado inválido: ${status}`);
  }

  const payload = {
    status,
    completed_at: completedAt || new Date().toISOString(),
  };

  const { data, error } = await supabaseServer
    .from('sessions')
    .update(payload)
    .eq('id', sessionId)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Erro no sessionModel.updateSessionStatus:', error);
    throw error;
  }

  return data;
}

export async function getSessionById(sessionId) {
  if (!sessionId) return null;

  const { data, error } = await supabaseServer
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('Erro no sessionModel.getSessionById:', error);
    throw error;
  }

  return data;
}

export async function getUserSessions(userId) {
  if (!userId) return [];

  const { data, error } = await supabaseServer
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Erro no sessionModel.getUserSessions:', error);
    throw error;
  }

  const sessions = data || [];
  const now = Date.now();

  // Sessões iniciadas cujo tempo de 45 min já expirou sem conclusão são tratadas como abandono/desistência
  for (const s of sessions) {
    if (s.status === 'started') {
      const startedTime = new Date(s.started_at).getTime();
      const elapsedMinutes = (now - startedTime) / (1000 * 60);
      const sessionDuration = s.duration_minutes || 45;

      if (elapsedMinutes > sessionDuration + 5) {
        s.status = 'cancelled';
        s.completed_at = new Date(startedTime + sessionDuration * 60 * 1000).toISOString();

        // Atualiza na base de dados de forma assíncrona
        updateSessionStatus(s.id, {
          status: 'cancelled',
          completedAt: s.completed_at,
        }).catch((err) => {
          console.error('Falha ao auto-cancelar sessão abandonada:', err);
        });
      }
    }
  }

  return sessions;
}

export async function getActiveSessionsCount() {
  const fortyFiveMinutesAgo = new Date(Date.now() - 45 * 60 * 1000).toISOString();

  const { count, error } = await supabaseServer
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'started')
    .gte('started_at', fortyFiveMinutesAgo);

  if (error) {
    console.error('Erro no sessionModel.getActiveSessionsCount:', error);
    return 1; // fallback razoável
  }

  return typeof count === 'number' ? Math.max(1, count) : 1;
}
