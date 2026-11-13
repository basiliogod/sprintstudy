import { NextResponse } from 'next/server';
import {
  getSessionFromRequest,
  setSessionCookie,
  clearSessionCookie,
} from '@/lib/sessionCookie';
import { login, register, initGuestSession } from '@/services/authService';

/**
 * API Gateway / Controller: /api/auth
 */

export async function GET(req) {
  try {
    let session = getSessionFromRequest(req);

    if (!session || !session.userId) {
      // Inicia automaticamente uma sessão guest se não existir
      const guest = await initGuestSession();
      const response = NextResponse.json({
        user: {
          id: guest.id,
          username: guest.username,
          abGroup: guest.abGroup,
          isGuest: guest.isGuest,
        },
      });
      return setSessionCookie(response, {
        userId: guest.id,
        username: guest.username,
        abGroup: guest.abGroup,
        isGuest: guest.isGuest,
      });
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        username: session.username || null,
        abGroup: session.abGroup || 'A',
        isGuest: !!session.isGuest,
      },
    });
  } catch (err) {
    if (err?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw err;
    console.error('Erro em GET /api/auth:', err);
    return NextResponse.json(
      { error: 'Falha ao verificar sessão de autenticação.' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, username, password, abGroup } = body;
    const currentSession = getSessionFromRequest(req);

    if (action === 'logout') {
      const response = NextResponse.json({ success: true, message: 'Sessão terminada.' });
      return clearSessionCookie(response);
    }

    if (action === 'login') {
      const user = await login({ username, password });
      const response = NextResponse.json({
        success: true,
        user,
      });
      return setSessionCookie(response, {
        userId: user.id,
        username: user.username,
        abGroup: user.abGroup,
        isGuest: false,
      });
    }

    if (action === 'register') {
      const guestId = currentSession?.isGuest ? currentSession.userId : null;
      const finalAbGroup = abGroup || currentSession?.abGroup;

      const user = await register({
        username,
        password,
        abGroup: finalAbGroup,
        guestUserId: guestId,
      });

      const response = NextResponse.json({
        success: true,
        user,
      });
      return setSessionCookie(response, {
        userId: user.id,
        username: user.username,
        abGroup: user.abGroup,
        isGuest: false,
      });
    }

    if (action === 'guest' || action === 'init') {
      const guest = await initGuestSession({
        existingGuestId: body.userId || currentSession?.userId,
        preferredAbGroup: body.abGroup || currentSession?.abGroup,
      });

      const response = NextResponse.json({
        success: true,
        user: guest,
      });
      return setSessionCookie(response, {
        userId: guest.id,
        username: guest.username,
        abGroup: guest.abGroup,
        isGuest: guest.isGuest,
      });
    }

    return NextResponse.json(
      { error: 'Ação não suportada. Usa login, register, logout ou guest.' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Erro em POST /api/auth:', err);
    return NextResponse.json(
      { error: err.message || 'Erro inesperado no servidor.' },
      { status: 400 }
    );
  }
}
