import { createCampaign, step, summary, simulate } from '../game_engine/campaign.js';
import * as Run from '../game_engine/sim.js';
import * as Shoot from '../game_engine/shoot/sim.js';
import { api } from './api.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function wouldHitGhost(s, x, y) {
  for (const e of s.enemies) {
    if (e.ghost && e.state !== 'dead') {
      const bx = Shoot.enemyBox(e);
      if (x >= bx.x0 - 20 && x <= bx.x1 + 20 && y >= bx.y0 - 20 && y <= bx.y1 + 20) {
        return true;
      }
    }
  }
  return false;
}

function wouldHitCiv(s, x, y) {
  for (const e of s.enemies) {
    if (e.kind === 'civ' && e.state !== 'dead') {
      const bx = Shoot.enemyBox(e);
      if (x >= bx.x0 - 10 && x <= bx.x1 + 10 && y >= bx.y0 - 10 && y <= bx.y1 + 10) {
        return true;
      }
    }
  }
  return false;
}

// Humanizer Action Generators: Simulates realistic human aim, latency, and tactical choices
function humanShootAction(s) {
  if (s.phase !== 'fight') return null;
  if (s.ammo === 0 && s.tick >= s.reloadUntil) return { type: 2, x: 0, y: 0 };
  if (s.tick < s.reloadUntil) return null;

  // Intercept incoming bottle/projectile if safe
  for (const p of s.projectiles) {
    if (p.t > 18) {
      const q = Shoot.projPos(p);
      const jx = Math.floor((Math.random() - 0.5) * 4);
      const jy = Math.floor((Math.random() - 0.5) * 4);
      const candX = Math.round(q.x + jx);
      const candY = Math.round(q.y + jy);
      if (!wouldHitGhost(s, candX, candY) && !wouldHitCiv(s, candX, candY)) {
        return { type: 1, x: candX, y: candY };
      }
    }
  }

  // Preemptive reload when safe and ammo is low
  const activeAimers = s.enemies.filter((e) => !e.ghost && e.kind !== 'civ' && e.state === 'aim');
  if (activeAimers.length === 0 && s.ammo <= 3 && s.tick >= s.reloadUntil && Math.random() < 0.25) {
    return { type: 2, x: 0, y: 0 };
  }

  // Natural human imperfection: ~1-2 stray shots per game to break 100% accuracy bot signature
  if (s.ammo > 3 && Math.random() < 0.012) {
    const missX = 480 + Math.floor((Math.random() - 0.5) * 300);
    const missY = 40 + Math.floor(Math.random() * 40); // Top wall/sky
    if (!wouldHitGhost(s, missX, missY) && !wouldHitCiv(s, missX, missY)) {
      return { type: 1, x: missX, y: missY };
    }
  }

  // Realistic human reaction time: between 18 and 26 ticks (300ms - 430ms)
  const humanDelay = 18 + Math.floor(Math.random() * 8);
  const targets = s.enemies.filter(
    (e) => !e.ghost && e.kind !== 'civ' && e.state === 'aim' && e.t >= Math.min(humanDelay, e.aim - 5)
  );

  if (targets.length) {
    const e = targets.sort((a, b) => b.t / b.aim - a.t / a.aim)[0];
    const bx = Shoot.enemyBox(e);
    const isHeadshot = Math.random() < 0.80;
    const targetY = isHeadshot ? bx.y0 + (bx.headY - bx.y0) / 2 : bx.headY + 18;
    const targetX = (bx.x0 + bx.x1) / 2;

    for (let attempt = 0; attempt < 5; attempt++) {
      const jx = Math.floor((Math.random() - 0.5) * 6);
      const jy = Math.floor((Math.random() - 0.5) * 4);
      const candX = Math.round(targetX + jx);
      const candY = Math.round(targetY + jy);
      if (!wouldHitGhost(s, candX, candY) && !wouldHitCiv(s, candX, candY)) {
        return { type: 1, x: candX, y: candY };
      }
    }
  }

  // Boss targeting (El Chulo, etc.)
  const bb = s.bosses.find((b) => b.state === 'fight' && !(b.kind === 'trump' && b.phase !== 'shout'));
  if (bb && s.tick % 15 === 0) {
    const bx = Shoot.bossBox(bb);
    const candX = Math.round((bx.x0 + bx.x1) / 2);
    const candY = Math.round(bx.y0 + 40);
    if (!wouldHitGhost(s, candX, candY)) {
      return { type: 1, x: candX, y: candY };
    }
  }

  return null;
}

// 1. Quick run (~14s) to quickly unlock daily check-in
export async function executeQuickRun(account, onProgress) {
  const who = account.who || 'dog';
  const start = await api.startRun(account.token, who, account.device);
  if (!start.runId) {
    throw new Error('Gagal mendapatkan tiket game dari server');
  }

  const cfg = { seed: start.seed, who };
  const camp = createCampaign(cfg);
  const expectedSim = simulate(cfg, []);

  const totalTicks = expectedSim.ticks;
  const startTime = Date.now();
  let beatSent = 0;

  while (camp.alive) {
    for (let t = 0; t < 60; t++) {
      if (!camp.alive) break;
      step(camp, null);
    }

    const elapsed = Date.now() - startTime;
    const expectedElapsed = (camp.tick / 60) * 1000;
    const wait = expectedElapsed - elapsed;
    if (wait > 0) await sleep(wait);

    try {
      await api.beat({
        token: account.token,
        runId: start.runId,
        tick: camp.tick,
        inputs: [],
        mark: null,
        from: beatSent,
      });
    } catch {}

    if (onProgress) {
      const pct = Math.min(100, Math.round((camp.tick / totalTicks) * 100));
      onProgress({ tick: camp.tick, totalTicks, percent: pct, score: camp.score });
    }
  }

  const result = summary(camp);
  const finish = await api.finishRun({
    token: account.token,
    runId: start.runId,
    inputs: camp.inputs,
    clientScore: result.score,
    device: account.device,
  });

  return {
    accepted: finish.status === 'accepted',
    status: finish.status,
    score: finish.score || result.score,
    best: finish.best,
  };
}

// 2. Humanized Boost Run (~90-95s): Level 1 Full Clear (Runner + Assault Boss El Chulo) -> ~24.000 - 25.000+ points!
export async function executeBoostRun(account, onProgress) {
  const who = account.who || 'dog';
  const start = await api.startRun(account.token, who, account.device);
  if (!start.runId) {
    throw new Error('Gagal mendapatkan tiket game dari server');
  }

  const cfg = { seed: start.seed, who };
  const camp = createCampaign(cfg);
  const startTime = Date.now();
  let beatSent = 0;

  // Complete Level 1 (Runner + Assault Boss El Chulo)
  while (camp.alive && camp.level === 0) {
    for (let t = 0; t < 60; t++) {
      if (!camp.alive || camp.level > 0) break;
      let input = null;

      if (camp.seg === 'run') {
        const act = Run.botAction(camp.sim, 260 + Math.floor((Math.random() - 0.5) * 30));
        if (act) input = { k: 0, act };
      } else if (camp.seg === 'shoot') {
        const act = humanShootAction(camp.sim);
        if (act) input = { k: 1, ...act };
      }

      step(camp, input);
    }

    const elapsed = Date.now() - startTime;
    const expectedElapsed = (camp.tick / 60) * 1000;
    const wait = expectedElapsed - elapsed;
    if (wait > 0) await sleep(wait);

    const from = beatSent;
    const upto = camp.inputs.length;
    const chunk = camp.inputs.slice(from, upto);

    try {
      await api.beat({
        token: account.token,
        runId: start.runId,
        tick: camp.tick,
        inputs: chunk,
        from,
      });
      beatSent = upto;
    } catch {}

    if (onProgress) {
      onProgress({
        tick: camp.tick,
        score: camp.score,
        seg: camp.seg,
        lives: camp.lives,
        inputsCount: camp.inputs.length,
      });
    }
  }

  // Conclude session naturally after Level 1 clear
  while (camp.alive) {
    for (let t = 0; t < 60; t++) {
      if (!camp.alive) break;
      step(camp, null);
    }
    const elapsed = Date.now() - startTime;
    const expectedElapsed = (camp.tick / 60) * 1000;
    const wait = expectedElapsed - elapsed;
    if (wait > 0) await sleep(wait);

    const from = beatSent;
    const upto = camp.inputs.length;
    const chunk = camp.inputs.slice(from, upto);

    try {
      await api.beat({
        token: account.token,
        runId: start.runId,
        tick: camp.tick,
        inputs: chunk,
        from,
      });
      beatSent = upto;
    } catch {}
  }

  const result = summary(camp);
  const finish = await api.finishRun({
    token: account.token,
    runId: start.runId,
    inputs: camp.inputs,
    clientScore: result.score,
    device: account.device,
  });

  return {
    accepted: finish.status === 'accepted',
    status: finish.status,
    score: finish.score || result.score,
    best: finish.best || finish.score || result.score,
  };
}
