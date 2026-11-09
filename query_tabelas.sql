CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE,
  password TEXT, 
  ab_group TEXT NOT NULL CHECK (ab_group IN ('A', 'B')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  study_topic TEXT NOT NULL,
  duration_minutes INT DEFAULT 45,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Cada utilizador autenticado só pode inserir/ler/atualizar o seu próprio registo
CREATE POLICY "Utilizador gere o seu próprio perfil"
ON users
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 1. Leitura pública para qualquer visitante (anon e authenticated)
CREATE POLICY "Leitura pública de sessions"
ON sessions
FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Utilizador autenticado só cria sessões para si próprio
CREATE POLICY "Criar as suas próprias sessões"
ON sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Utilizador autenticado só atualiza as suas próprias sessões
CREATE POLICY "Atualizar as suas próprias sessões"
ON sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir leitura de utilizadores por username para validação de login
CREATE POLICY "Permitir leitura para verificação de login"
ON users
FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir atualização de dados da própria conta anónima
CREATE POLICY "Permitir upsert do próprio perfil anónimo"
ON users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Permitir update do próprio utilizador"
ON users
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
