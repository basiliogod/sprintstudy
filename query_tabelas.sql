-- 1. Tabela de utilizadores (convidados e registados)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE,
  password TEXT, 
  ab_group TEXT NOT NULL CHECK (ab_group IN ('A', 'B')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de sessões de estudo
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  study_topic TEXT NOT NULL,
  duration_minutes INT DEFAULT 45,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Políticas de acesso público
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público total a users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso público total a sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);