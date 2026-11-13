import { NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/services/analyticsService';

/**
 * Controller do API Gateway para Métricas do Professor
 * Endpoint: GET /api/analytics?token=...
 * Requer o token secreto configurado em ANALYTICS_SECRET_TOKEN no .env
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providedToken = searchParams.get('token') || request.headers.get('x-analytics-token');

    // Token esperado definido nas variáveis de ambiente (.env.local) com fallback seguro
    const expectedToken = process.env.ANALYTICS_SECRET_TOKEN || 'chave_secreta';

    if (!providedToken || providedToken !== expectedToken) {
      return NextResponse.json(
        {
          error: 'Acesso não autorizado. O token fornecido é inválido ou está em falta.',
          requirement: 'Utilize /analytics?token=chave_secreta para visualizar os dados.',
        },
        { status: 401 }
      );
    }

    const data = await getAnalyticsSummary();

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err) {
    if (err?.digest === 'NEXT_PRERENDER_INTERRUPTED') {
      throw err;
    }
    console.error('Erro na rota /api/analytics:', err);
    return NextResponse.json(
      { error: 'Falha ao processar métricas analíticas no servidor.' },
      { status: 500 }
    );
  }
}
