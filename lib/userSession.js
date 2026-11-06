// Implementar gestão do ID do utilizador na sessão do usuário, localStorage e grupo A ou B

'use client';

import { supabase } from './supabaseClient';

const STORAGE_KEY_AB_GROUP = 'studysprint_ab_group';

export async function getOrCreateUserSession() {
  if (typeof window === 'undefined') return null;

  try {
    // Verificar se já existe uma sessão de autenticação ativa no Supabase
    let { data: { session } } = await supabase.auth.getSession();

    // Se não existir, autenticar o utilizador anonimamente
    if (!session?.user) {
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      
      if (authError || !authData?.user) {
        console.error('Erro ao autenticar anonimamente:', authError);
        return null;
      }
      session = authData.session;
    }

    const userId = session.user.id;

    // Gerir ou recuperar o grupo A/B no localStorage
    let abGroup = localStorage.getItem(STORAGE_KEY_AB_GROUP);
    if (!abGroup) {
      abGroup = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem(STORAGE_KEY_AB_GROUP, abGroup);
    }

    // Verificar se a linha na tabela pública 'users' já existe para este auth.uid()
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('id, ab_group')
      .eq('id', userId)
      .maybeSingle();

    if (selectError) {
      console.error('Erro ao verificar utilizador na tabela users:', selectError);
    }

    // Se ainda não existir na tabela 'users', cria o registo com o mesmo UUID do Auth
    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            ab_group: abGroup,
          },
        ]);

      if (insertError) {
        console.error('Erro ao sincronizar perfil em users:', insertError);
      }
    } else if (existingUser.ab_group) {
      // Se já existia na BD, garante que o frontend usa o mesmo grupo original
      abGroup = existingUser.ab_group;
      localStorage.setItem(STORAGE_KEY_AB_GROUP, abGroup);
    }

    return { userId, abGroup };

  } catch (err) {
    console.error('Erro inesperado na sessão do utilizador:', err);
    return null;
  }
}
