import { NextResponse } from 'next/server';
import { updateSessionStatus, getSessionById } from '@/models/sessionModel';

/**
 * API Gateway / Controller: /api/sessions/[id]
 * PATCH: Conclui ('completed') ou cancela ('cancelled') um Sprint
 */

export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da sessão é obrigatório.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { status } = body;

    if (!['completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: "O estado deve ser 'completed' ou 'cancelled'." },
        { status: 400 }
      );
    }

    const updatedSession = await updateSessionStatus(id, {
      status,
      completedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (err) {
    console.error('Erro em PATCH /api/sessions/[id]:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar sessão de estudo.' },
      { status: 500 }
    );
  }
}

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const session = await getSessionById(id);
    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (err) {
    if (err?.digest === 'NEXT_PRERENDER_INTERRUPTED') throw err;
    console.error('Erro em GET /api/sessions/[id]:', err);
    return NextResponse.json(
      { error: 'Erro ao obter sessão.' },
      { status: 500 }
    );
  }
}
