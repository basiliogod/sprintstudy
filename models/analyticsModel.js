import { supabaseServer } from '@/lib/supabaseServer';

/**
 * Modelo de Acesso a Dados para o Painel de Analytics (Acesso de Leitura do Professor)
 * Executado exclusivamente no servidor via supabaseServer
 */

export async function fetchRawAnalyticsData() {
  try {
    // 1. Obter todos os utilizadores registados e respetivo grupo A/B
    const { data: users, error: usersError } = await supabaseServer
      .from('users')
      .select('id, username, ab_group, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Erro no analyticsModel ao buscar utilizadores:', usersError);
    }

    // 2. Obter todas as sessões de estudo (histórico completo)
    const { data: sessions, error: sessionsError } = await supabaseServer
      .from('sessions')
      .select('id, user_id, study_topic, duration_minutes, status, started_at, completed_at')
      .order('started_at', { ascending: false });

    if (sessionsError) {
      console.error('Erro no analyticsModel ao buscar sessões:', sessionsError);
    }

    return {
      users: users || [],
      sessions: sessions || [],
    };
  } catch (err) {
    console.error('Erro inesperado em fetchRawAnalyticsData:', err);
    throw new Error('Falha ao obter dados brutos de analytics da base de dados.');
  }
}
