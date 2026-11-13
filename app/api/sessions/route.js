import { NextResponse } from 'next/server';
import { getSessionFromRequest, setSessionCookie } from '@/lib/sessionCookie';
import {
  createStudySession,
  getUserSessions,
  getActiveSessionsCount,
} from '@/models/sessionModel';
import { initGuestSession } from '@/services/authService';

/**
 * API Gateway / Controller: /api/sessions
 * GET: lista sessões do utilizador ou conta utilizadores ativos em tempo real
 * POST: inicia um novo Sprint de 45 minutos
 */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Rota pública para a prova social (Banner B)
    if (activeOnly) {
      const activeCount = await getActiveSessionsCount();
      return NextResponse.json({ activeCount });
    }

    // Listagem das sessões do utilizador autenticado ou guest
    const session = getSessionFromRequest(req);
    if (!session?.userId) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = await getUserSessions(session.userId);
    return NextResponse.json({ sessions });
  } catch (err) {
    if (err?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw err;
    console.error('Erro em GET /api/sessions:', err);
    return NextResponse.json(
      { error: 'Falha ao consultar sessões de estudo.' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    let session = getSessionFromRequest(req);
    let cookieToSet = null;

    // Se o utilizador ainda não tiver sessão, cria uma sessão guest automaticamente
    if (!session?.userId) {
      const guest = await initGuestSession();
      session = {
        userId: guest.id,
        username: guest.username,
        abGroup: guest.abGroup,
        isGuest: guest.isGuest,
      };
      cookieToSet = session;
    }

    const body = await req.json().catch(() => ({}));
    const { topic, durationMinutes } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { error: 'O tema da tarefa (study_topic) é obrigatório.' },
        { status: 400 }
      );
    }

    const newSession = await createStudySession({
      userId: session.userId,
      studyTopic: topic.trim(),
      durationMinutes: durationMinutes || 45,
    });

    const response = NextResponse.json(
      {
        success: true,
        session: newSession,
      },
      { status: 201 }
    );

    if (cookieToSet) {
      setSessionCookie(response, cookieToSet);
    }

    return response;
  } catch (err) {
    console.error('Erro em POST /api/sessions:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao iniciar sprint de estudo.' },
      { status: 500 }
    );
  }
}
