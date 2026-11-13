-- ==============================================================================
-- SPRINTSTUDY - CRIAÇÃO DA BASE DE DADOS DO ZERO (SCHEMA COMPLETO)
-- Arquitetura MVC com API Gateway & Row Level Security (RLS)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA DE UTILIZADORES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE,
  password TEXT, 
  ab_group TEXT NOT NULL CHECK (ab_group IN ('A', 'B')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. TABELA DE SESSÕES DE ESTUDO (SPRINTS DE 45 MIN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  study_topic TEXT NOT NULL,
  duration_minutes INT DEFAULT 45,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------------
-- 3. ÍNDICES DE PERFORMANCE
-- ------------------------------------------------------------------------------
-- Acelera a consulta de histórico de sessões por utilizador
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Acelera o cálculo da Prova Social (sessões ativas nos últimos 45 min)
CREATE INDEX IF NOT EXISTS idx_sessions_status_started_at ON sessions(status, started_at);

-- ------------------------------------------------------------------------------
-- 4. ATIVAÇÃO DE ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. POLÍTICAS DE SEGURANÇA (RLS)
-- ==============================================================================
-- NOTA ARQUITETURAL:
-- Todas as operações críticas passam pelo API Gateway (/api/...) no Next.js.
-- O servidor comunica com o Supabase utilizando a SUPABASE_SERVICE_ROLE_KEY (ou
-- secret key sb_secret_...), que possui o atributo BYPASSRLS nativo no PostgreSQL.
-- Isto garante que a tabela 'users' fica protegida contra leitura direta de
-- qualquer cliente anónimo no frontend.
-- ==============================================================================


-- --- POLÍTICAS DA TABELA USERS ---
-- Bloqueada para anon (leitura/escrita pública no browser proibida).
-- Apenas utilizadores autenticados pelo Supabase Auth podem consultar o seu registo:
CREATE POLICY "Utilizador gere o seu próprio perfil"
ON users
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- --- POLÍTICAS DA TABELA SESSIONS ---
-- 1. Leitura: permite ver sessões de utilizadores e alimentar o banner de prova social
CREATE POLICY "Leitura de sessions"
ON sessions
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Inserção: permite registar novas sessões de estudo iniciadas
CREATE POLICY "Inserção de sessions"
ON sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. Atualização: permite atualizar o estado da sessão (concluída ou desistência)
CREATE POLICY "Atualização de sessions"
ON sessions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
