/**
 * Cliente HTTP para a View consumir o API Gateway (/api/...)
 * Centraliza os pedidos HTTP e a gestão de sessão no frontend
 */

function getCustomHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (typeof window !== 'undefined') {
    const storedUserId = localStorage.getItem('studysprint_user_id');
    const storedUsername = localStorage.getItem('studysprint_username');
    const storedAbGroup = localStorage.getItem('studysprint_ab_group');

    if (storedUserId) headers['x-user-id'] = storedUserId;
    if (storedUsername) headers['x-username'] = storedUsername;
    if (storedAbGroup) headers['x-ab-group'] = storedAbGroup;
  }

  return headers;
}

export async function apiAuthGet() {
  const res = await fetch('/api/auth', {
    method: 'GET',
    headers: getCustomHeaders(),
    credentials: 'same-origin',
  });
  return res.json();
}

export async function apiAuthPost(body) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: getCustomHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiSessionsGet(activeOnly = false) {
  const url = activeOnly ? '/api/sessions?activeOnly=true' : '/api/sessions';
  const res = await fetch(url, {
    method: 'GET',
    headers: getCustomHeaders(),
    credentials: 'same-origin',
  });
  return res.json();
}

export async function apiSessionsStart({ topic, durationMinutes = 45 }) {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: getCustomHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify({ topic, durationMinutes }),
  });
  return res.json();
}

export async function apiSessionsUpdate(sessionId, { status }) {
  const res = await fetch(`/api/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: getCustomHeaders(),
    credentials: 'same-origin',
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function apiProfileGet() {
  const res = await fetch('/api/profile', {
    method: 'GET',
    headers: getCustomHeaders(),
    credentials: 'same-origin',
  });
  return res.json();
}

/**
 * Obtém ou inicia a sessão do utilizador através do API Gateway (/api/auth)
 */
export async function getOrCreateUserSession() {
  if (typeof window === 'undefined') return null;

  try {
    const res = await apiAuthGet();

    if (res?.user) {
      const { id, abGroup, username } = res.user;

      localStorage.setItem('studysprint_user_id', id);
      if (abGroup) {
        localStorage.setItem('studysprint_ab_group', abGroup);
      }
      if (username) {
        localStorage.setItem('studysprint_username', username);
      }

      return {
        userId: id,
        abGroup: abGroup || 'A',
        username: username || null,
        stats: res.stats || null,
      };
    }

    return null;
  } catch (err) {
    console.error('Erro ao obter sessão no API Gateway:', err);
    return null;
  }
}
