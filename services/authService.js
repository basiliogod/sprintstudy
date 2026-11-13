import crypto from 'crypto';
import {
  findUserByUsername,
  findUserById,
  createUser,
  upsertGuestUser,
} from '@/models/userModel';

/**
 * Serviço de Autenticação e Gestão de Contas
 * Contém regras de negócio de senhas, validações e criação de sessões
 */

export function hashPassword(plainTextPassword) {
  if (!plainTextPassword || typeof plainTextPassword !== 'string') {
    throw new Error('A palavra-passe é obrigatória para encriptação.');
  }
  return crypto.createHash('sha256').update(plainTextPassword).digest('hex');
}

export function verifyPassword(plainTextPassword, storedHash) {
  if (!plainTextPassword || !storedHash) return false;
  const computedHash = hashPassword(plainTextPassword);
  
  // Comparação segura contra ataques de timing
  try {
    const a = Buffer.from(computedHash, 'utf8');
    const b = Buffer.from(storedHash, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return computedHash === storedHash;
  }
}

export async function login({ username, password }) {
  const cleanUsername = username?.trim().toLowerCase();
  if (!cleanUsername || !password) {
    throw new Error('Por favor, preenche todos os campos.');
  }

  const userFound = await findUserByUsername(cleanUsername);
  if (!userFound) {
    throw new Error('Utilizador não encontrado.');
  }

  const isValid = verifyPassword(password, userFound.password);
  if (!isValid) {
    throw new Error('Palavra-passe incorreta.');
  }

  return {
    id: userFound.id,
    username: userFound.username,
    abGroup: userFound.ab_group,
    isGuest: false,
  };
}

export async function register({ username, password, abGroup, guestUserId }) {
  const cleanUsername = username?.trim().toLowerCase();
  if (!cleanUsername || !password) {
    throw new Error('Por favor, preenche todos os campos.');
  }

  if (cleanUsername.length < 3) {
    throw new Error('O username deve ter pelo menos 3 caracteres.');
  }

  if (password.length < 4) {
    throw new Error('A palavra-passe deve ter pelo menos 4 caracteres.');
  }

  const existingUser = await findUserByUsername(cleanUsername);
  if (existingUser) {
    throw new Error('Este username já está escolhido. Escolhe outro.');
  }

  const passwordHash = hashPassword(password);
  const finalUserId = guestUserId || crypto.randomUUID();
  const finalGroup = abGroup || (Math.random() < 0.5 ? 'A' : 'B');

  const created = await createUser({
    id: finalUserId,
    username: cleanUsername,
    passwordHash,
    abGroup: finalGroup,
  });

  return {
    id: created.id,
    username: created.username,
    abGroup: created.ab_group,
    isGuest: false,
  };
}

export async function initGuestSession({ existingGuestId, preferredAbGroup } = {}) {
  let userId = existingGuestId;
  let abGroup = preferredAbGroup;

  if (!userId) {
    userId = crypto.randomUUID();
  }

  if (!abGroup || !['A', 'B'].includes(abGroup)) {
    abGroup = Math.random() < 0.5 ? 'A' : 'B';
  }

  // Se o utilizador já existir e já tiver username, mantemos o utilizador
  const existing = await findUserById(userId);
  if (existing && existing.username) {
    return {
      id: existing.id,
      username: existing.username,
      abGroup: existing.ab_group || abGroup,
      isGuest: false,
    };
  }

  // Cria ou assegura a linha na base de dados
  await upsertGuestUser({ id: userId, abGroup });

  return {
    id: userId,
    username: null,
    abGroup,
    isGuest: true,
  };
}
