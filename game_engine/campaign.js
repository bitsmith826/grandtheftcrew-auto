// La partida completa del juego unificado: niveles de runner y asaltos con jefe, con 3 vidas.
// Determinista y sin DOM, como las dos simulaciones que usa: el servidor repite la partida entera
// con `simulate(cfg, inputs)` y obtiene la misma puntuación.
//
//   cartel ─► runner del nivel ─► cartel ─► asalto (salas + jefe) ─► cartel ─► siguiente nivel …
//
// - Morir en un tramo cuesta una vida y se repite ESE tramo (con otro trazado: intento + 1).
// - Los puntos de cada tramo se suman siempre, también si caes en él (solo pierdes la vida). Con 3
//   vidas, repetir un tramo como mucho da 3 intentos extra: no se puede "farmear".
// - Entradas: [tick, 0, acción] en el runner (bits A/B) y [tick, 1, tipo, x, y] en el asalto.
//   Solo se graban las que se aplican; durante los carteles no se graba nada.
import * as Run from './sim.js';
import * as Shoot from './shoot/sim.js';
import { LEVELS } from './levels.js';

export const TICK_RATE = 60;
export const LIVES = 3;
export const CARD_TICKS = 150; // cartel entre tramos (2,5 s; incluye la animación de muerte o de llegada)
export const REWARD_TICKS = 480; // cartel de recompensa (Macca / Musk): 8 s, que dé tiempo a leerlo (con 5 se quedaba corto)
export const MAX_TICKS = 60 * 60 * 40; // 40 minutos de tope

export const hashString = Run.hashString;

function segSeed(c, kind) {
  return Run.hashString(`${c.cfg.seed}:${c.level}:${kind}:${c.attempt}`);
}

// cartel: qué se anuncia y qué tramo viene después
function card(c, kind, next) {
  c.seg = 'card';
  c.card = { kind, level: c.level, attempt: c.attempt };
  c.cardT = kind === 'rescue' || kind === 'reward' ? REWARD_TICKS : CARD_TICKS;
  c.next = next;
}

export function createCampaign(cfg) {
  const c = {
    cfg: { seed: cfg.seed >>> 0, who: cfg.who === 'cat' ? 'cat' : 'dog' },
    tick: 0,
    level: 0,
    attempt: 0,
    seg: 'card', // card | run | shoot
    card: null,
    cardT: 0,
    next: 'run',
    sim: null, // simulación del tramo en curso (o la del tramo que acaba de terminar, durante el cartel)
    lives: LIVES,
    oneUps: {}, // niveles en los que ya se cogió la vida extra
    macca: false, // Macca rescatado (tras el asalto al casino): desde entonces aparece en los runners
    banked: 0, // puntos de los tramos superados
    score: 0,
    alive: true,
    won: false,
    deathBy: null,
    stats: { meters: 0, coins: 0, limits: 0, kills: 0, heads: 0, shots: 0, hits: 0, maxCombo: 0, segments: 0 },
    inputs: [],
  };
  card(c, 'level', 'run');
  return c;
}

function startSegment(c) {
  const lv = LEVELS[c.level];
  if (c.next === 'run') {
    c.sim = Run.createSim({ ...lv.run, oneUp: !!lv.run.oneUp && !c.oneUps[c.level], seed: segSeed(c, 'run'), who: c.cfg.who, macca: c.macca });
    c.seg = 'run';
  } else {
    // startStop solo lo usa el atajo de pruebas (main.js, en local): empezar en una sala concreta
    c.sim = Shoot.createSim({ seed: segSeed(c, 'shoot'), who: c.cfg.who, stops: lv.assault.stops, startStop: c.debugStop | 0 });
    c.debugStop = 0;
    c.seg = 'shoot';
  }
}

function addStats(c, kind, s) {
  const st = c.stats;
  if (kind === 'run') {
    st.meters += s.meters;
    st.coins += s.coinsTaken;
    st.limits += s.limits;
  } else {
    st.kills += s.totalKills;
    st.heads += s.heads;
    st.shots += s.shots;
    st.hits += s.hits;
  }
  st.maxCombo = Math.max(st.maxCombo, s.maxCombo);
}

// el tramo en curso ha terminado (sim.alive === false)
function segmentOver(c, ev) {
  const s = c.sim;
  const kind = c.seg;
  const passed = kind === 'run' ? s.finished : s.won;
  if (passed) {
    c.banked += s.score;
    addStats(c, kind, s);
    c.stats.segments++;
    ev.push({ t: 'segDone', kind, score: s.score });
    if (kind === 'run' && LEVELS[c.level].assault) {
      c.attempt = 0;
      card(c, 'assault', 'shoot');
    } else if (c.level === LEVELS.length - 1) {
      c.alive = false;
      c.won = true;
      c.deathBy = 'escape';
      ev.push({ t: 'gameWon' });
    } else {
      // el despacho de la Trump Tower tenía a Macca en una jaula: al ganar ese asalto, lo rescatas (y te
      // da una moneda con la cara de Trump); en el hangar, Musk te da una bolsa de monedas
      let next = 'level';
      if (kind === 'shoot' && LEVELS[c.level].assault.rescue === 'macca' && !c.macca) {
        c.macca = true;
        c.banked += 5000;
        next = 'rescue';
        ev.push({ t: 'rescue', who: 'macca' });
      } else if (kind === 'shoot' && LEVELS[c.level].assault.reward) {
        c.banked += 5000;
        next = 'reward';
        ev.push({ t: 'reward', who: LEVELS[c.level].assault.reward });
      }
      const lv = c.level;
      c.level++;
      c.attempt = 0;
      card(c, next, 'run');
      if (next !== 'level') c.card.from = lv; // de qué nivel es la recompensa (para su dibujo)
    }
    return;
  }
  // al caer pierdes lo ganado en ese tramo y lo repites (20 oct: antes se quedaba, y morir daba más
  // puntos que jugar perfecto). Con la última vida no hay repetición: lo ganado se conserva
  c.lives--;
  if (c.lives <= 0) c.banked += s.score;
  addStats(c, kind, s);
  ev.push({ t: 'lifeLost', kind, lives: c.lives, lost: c.lives > 0 ? s.score : 0 });
  if (c.lives <= 0) {
    c.alive = false;
    c.deathBy = s.deathBy || kind;
    ev.push({ t: 'gameOver' });
    return;
  }
  c.attempt++;
  card(c, 'retry', kind);
  c.card.lost = s.score; // para el cartel: lo que se ha perdido al caer
}

// input: null | { k: 0, act } (runner) | { k: 1, type, x, y } (asalto).
// Devuelve { sub, ev }: eventos de la simulación del tramo y eventos de la partida.
export function step(c, input) {
  const ev = [];
  let sub = [];
  if (!c.alive) return { sub, ev };

  if (c.seg === 'card') {
    if (--c.cardT <= 0) {
      startSegment(c);
      ev.push({ t: 'segStart', kind: c.seg, level: c.level, attempt: c.attempt });
    }
  } else if (c.seg === 'run') {
    let act = input && input.k === 0 ? (input.act | 0) & 3 : 0;
    if (act) c.inputs.push([c.tick, 0, act]);
    sub = Run.step(c.sim, act);
    // vida extra: siempre suma, también por encima de 3 (cliente, 29 oct). Una por nivel y partida:
    // si caes en ese tramo después de cogerla, al repetirlo ya no está (si no, se recuperaba cada caída)
    for (const e of sub) {
      if (e.t !== 'pickup' || e.pk.kind !== 'life') continue;
      c.lives++;
      c.oneUps[c.level] = true;
      ev.push({ t: 'oneUp', lives: c.lives });
    }
    if (!c.sim.alive) segmentOver(c, ev);
  } else if (c.seg === 'shoot') {
    let act = null;
    if (input && input.k === 1 && (input.type === 1 || input.type === 2)) {
      const x = Math.max(Shoot.X_MIN, Math.min(Shoot.X_MAX, input.x | 0));
      const y = Math.max(0, Math.min(540, input.y | 0));
      act = { type: input.type, x, y };
      c.inputs.push([c.tick, 1, act.type, x, y]);
    }
    sub = Shoot.step(c.sim, act);
    if (!c.sim.alive) segmentOver(c, ev);
  }

  c.score = c.banked + (c.alive && c.seg !== 'card' && c.sim ? c.sim.score : 0);
  c.tick++;
  if (c.alive && c.tick >= MAX_TICKS) {
    c.alive = false;
    c.deathBy = 'tiempo';
    ev.push({ t: 'gameOver' });
  }
  return { sub, ev };
}

export function summary(c) {
  const st = c.stats;
  return {
    score: c.banked,
    level: c.level + 1,
    lives: Math.max(0, c.lives),
    won: c.won,
    deathBy: c.deathBy,
    ticks: c.tick,
    meters: st.meters,
    coins: st.coins,
    limits: st.limits,
    kills: st.kills,
    heads: st.heads,
    accuracy: st.shots ? Math.round((100 * st.hits) / st.shots) : 0,
    maxCombo: st.maxCombo,
    segments: st.segments,
  };
}

// Comprueba la forma de la lista de entradas antes de repetirla.
export function validateInputs(inputs) {
  if (!Array.isArray(inputs)) return 'inputs no es una lista';
  if (inputs.length > MAX_TICKS) return 'demasiadas entradas';
  let prev = -1;
  for (const a of inputs) {
    if (!Array.isArray(a) || !a.every(Number.isInteger)) return 'entrada mal formada';
    const tick = a[0];
    if (tick < 0 || tick >= MAX_TICKS || tick <= prev) return 'ticks desordenados o fuera de rango';
    if (a[1] === 0) {
      if (a.length !== 3 || a[2] < 1 || a[2] > 3) return 'acción de runner no válida';
    } else if (a[1] === 1) {
      if (a.length !== 5 || (a[2] !== 1 && a[2] !== 2)) return 'acción de asalto no válida';
      if (a[3] < Shoot.X_MIN || a[3] > Shoot.X_MAX || a[4] < 0 || a[4] > 540) return 'coordenadas fuera de pantalla';
    } else return 'tipo de entrada desconocido';
    prev = tick;
  }
  return null;
}

// Repite una partida entera. Para el servidor: cfg = { seed, who } que fija EL SERVIDOR.
export function simulate(cfg, inputs) {
  const bad = validateInputs(inputs);
  if (bad) return { valid: false, reason: bad };
  const c = createCampaign(cfg);
  let i = 0;
  while (c.alive) {
    let input = null;
    if (i < inputs.length && inputs[i][0] === c.tick) {
      const a = inputs[i++];
      // cada entrada tiene que caer en un tramo de su tipo: si no, la lista está manipulada
      if ((a[1] === 0 && c.seg !== 'run') || (a[1] === 1 && c.seg !== 'shoot')) return { valid: false, reason: 'entrada fuera de su tramo' };
      input = a[1] === 0 ? { k: 0, act: a[2] } : { k: 1, type: a[2], x: a[3], y: a[4] };
    }
    step(c, input);
  }
  if (i < inputs.length) return { valid: false, reason: 'entradas después del final' };
  return { valid: true, ...summary(c) };
}

// Bot de pruebas (y del menú de fondo): juega cada tramo con el bot de su juego.
export function botInput(c, shootDelay = 30) {
  if (c.seg === 'run') return { k: 0, act: Run.botAction(c.sim) };
  if (c.seg === 'shoot') {
    const a = Shoot.botAction(c.sim, shootDelay);
    return a ? { k: 1, ...a } : null;
  }
  return null;
}
