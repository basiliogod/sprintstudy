import { supabaseServer } from '@/lib/supabaseServer';

/**
 * Modelo de Acesso a Dados da tabela 'users'
 * Executado estritamente no servidor
 */

export async function findUserByUsername(username) {
  if (!username) return null;
  const cleanUsername = username.trim().toLowerCase();

  const { data, error } = await supabaseServer
    .from('users')
    .select('id, username, password, ab_group, created_at')
    .eq('username', cleanUsername)
    .maybeSingle();

  if (error) {
    console.error('Erro no userModel.findUserByUsername:', error);
    throw new Error('Falha ao consultar utilizador por username.');
  }

  return data;
}

export async function findUserById(id) {
  if (!id) return null;

  const { data, error } = await supabaseServer
    .from('users')
    .select('id, username, ab_group, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Erro no userModel.findUserById:', error);
    throw new Error('Falha ao consultar utilizador por ID.');
  }

  return data;
}

export async function createUser({ id, username, passwordHash, abGroup }) {
  const cleanUsername = username.trim().toLowerCase();

  const payload = {
    username: cleanUsername,
    password: passwordHash,
    ab_group: abGroup || 'A',
  };

  if (id) {
    payload.id = id;
  }

  const { data, error } = await supabaseServer
    .from('users')
    .upsert(payload)
    .select('id, username, ab_group, created_at')
    .single();

  if (error) {
    console.error('Erro no userModel.createUser:', error);
    throw error;
  }

  return data;
}

export async function upsertGuestUser({ id, abGroup }) {
  if (!id) return null;

  // Verifica se o registo já existe
  const existing = await findUserById(id);
  if (existing) {
    return existing;
  }

  const { data, error } = await supabaseServer
    .from('users')
    .insert([
      {
        id,
        ab_group: abGroup || 'A',
      },
    ])
    .select('id, username, ab_group, created_at')
    .single();

  if (error) {
    // Se o registo foi criado concorrentemente, ignora o erro e busca novamente
    const fallback = await findUserById(id);
    if (fallback) return fallback;
    console.error('Erro no userModel.upsertGuestUser:', error);
  }

  return data;
}
