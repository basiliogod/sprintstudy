// Implementar gestão do ID do utilizador na sessão do usuário, localStorage e grupo A ou B

'use client';

import { supabase } from './supabaseClient';

const STORAGE_KEY_USER_ID = 'studysprint_user_id';
const STORAGE_KEY_AB_GROUP = 'studysprint_ab_group';

export async function getOrCreateUserSession() {
  if (typeof window === 'undefined') return null;

  let userId = localStorage.getItem(STORAGE_KEY_USER_ID);
  let abGroup = localStorage.getItem(STORAGE_KEY_AB_GROUP);

  // Se já existe localmente, devolve a sessão atual
  if (userId && abGroup) {
    return { userId, abGroup };
  }

  // Se for a primeira visita, define aleatoriamente o grupo A ou B (50/50)
  abGroup = Math.random() < 0.5 ? 'A' : 'B';

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ ab_group: abGroup }])
      .select('id, ab_group')
      .single();

    if (error) {
      console.error('Erro ao registar utilizador anónimo no Supabase:', error);
      userId = crypto.randomUUID();
    } else if (data) {
      userId = data.id;
    }
  } catch (err) {
    console.error('Falha de rede ao contactar Supabase:', err);
    userId = crypto.randomUUID();
  }

  localStorage.setItem(STORAGE_KEY_USER_ID, userId);
  localStorage.setItem(STORAGE_KEY_AB_GROUP, abGroup);

  return { userId, abGroup };
}