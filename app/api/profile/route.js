import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionCookie';
import { findUserById } from '@/models/userModel';
import { getUserSessions } from '@/models/sessionModel';
import { calculateUserStats } from '@/services/metricsService';

/**
 * API Gateway / Controller: /api/profile
 * GET: Retorna o perfil do utilizador, métricas calculadas (Streak, Foco) e histórico
 */

export async function GET(req) {
  try {
    const session = getSessionFromRequest(req);

    if (!session?.userId) {
      return NextResponse.json({
        user: null,
        stats: {
          completedCount: 0,
          totalMinutes: 0,
          streak: 0,
          focusLevel: 'Novato do Foco',
        },
        sessions: [],
      });
    }

    // 1. Obtém utilizador no Model
    const user = await findUserById(session.userId);

    // 2. Obtém sessões do utilizador no Model
    const sessions = await getUserSessions(session.userId);

    // 3. Processa regras de negócio no Service
    const stats = calculateUserStats(sessions);

    return NextResponse.json({
      user: {
        id: session.userId,
        username: user?.username || session.username || null,
        abGroup: user?.ab_group || session.abGroup || 'A',
        isGuest: !user?.username,
      },
      stats,
      sessions,
    });
  } catch (err) {
    if (err?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw err;
    console.error('Erro em GET /api/profile:', err);
    return NextResponse.json(
      { error: 'Falha ao carregar perfil do utilizador.' },
      { status: 500 }
    );
  }
}
