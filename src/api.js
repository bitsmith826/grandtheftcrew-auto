const SERVER = 'https://play.grandtheftcrew.com/vice-api';

export function generateDeviceId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function call(path, body = null) {
  const url = SERVER + path;
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: body ? 'POST' : 'GET',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.message || data.error || `HTTP ${res.status}`);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    } catch (e) {
      lastErr = e;
      if (e.status && e.status < 500 && e.status !== 429) {
        throw e; // Don't retry client errors (400, 401, 409, etc.)
      }
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 1500));
      }
    }
  }
  throw lastErr;
}

export const api = {
  // Register or login player
  async register({ nickname, wallet, ref, token, device }) {
    return call('/api/player', {
      nickname: nickname || undefined,
      wallet,
      ref: ref || undefined,
      token: token || undefined,
      device: device || generateDeviceId(),
    });
  },

  // Get current account status
  async me(token) {
    return call('/api/me', { token });
  },

  // Get tasks status
  async tasks(token) {
    return call('/api/tasks', { token });
  },

  // Claim a task: 'checkin' | 'follow'
  async claimTask(token, kind) {
    return call('/api/tasks/claim', { token, kind });
  },

  // Start a game run
  async startRun(token, who = 'dog', device = null) {
    return call('/api/run/start', {
      token,
      who,
      device: device || generateDeviceId(),
    });
  },

  // Send periodic heartbeat / inputs
  async beat({ token, runId, tick, inputs, mark = null, from = 0 }) {
    return call('/api/run/beat', {
      token,
      runId,
      tick,
      inputs,
      mark,
      from,
    });
  },

  // Submit finished game results
  async finishRun({ token, runId, inputs, clientScore, device = null }) {
    return call('/api/run/finish', {
      token,
      runId,
      inputs,
      clientScore,
      untrusted: 0,
      device: device || generateDeviceId(),
    });
  },

  // Get leaderboard ranking
  async leaderboard(meNick = '') {
    const q = meNick ? `?me=${encodeURIComponent(meNick)}` : '';
    return call(`/api/leaderboard${q}`);
  },
};
