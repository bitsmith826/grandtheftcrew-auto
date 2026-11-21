// Lógica pura del shooter. Determinista: misma semilla + mismos disparos = misma partida.
// Sin DOM, sin Math.random ni trigonometría: el servidor la puede importar en Node para repetir
// la partida y validar la puntuación. Coordenadas en el espacio lógico 960 x 540 de cada parada.
import { STOPS } from './stages.js';

// paradas de esta partida: las del asalto del nivel (cfg.stops) o, por defecto, la ruta de Meme Wars
export const stopsOf = (s) => s.cfg.stops || STOPS;

export const TICK_RATE = 60;
export const MAX_HEARTS = 5;
export const MAG = 8;                 // balas por cargador
export const RELOAD_TICKS = 50;
export const WALK_TICKS = 90;         // caminar de una parada a la siguiente
export const BOSS_INTRO = 360;        // antes de cada jefe, 6 s de presentación (dibujo, nombre y su truco)
export const MAX_TICKS = 60 * 60 * 10;

const RISE = 14;
const FIRE = 12;
const HIDE = 14;

// Mascotas rivales (parodias). hp = disparos para tumbarla. w/h = caja a escala 1.
// (medidas ajustadas a los sprites de ChatGPT: de cintura para arriba)
export const KINDS = {
  dodge:  { hp: 1, w: 94, h: 120, pts: 100, aimMul: 1 },
  peep:   { hp: 1, w: 100, h: 118, pts: 100, aimMul: 0.9 },
  waf:    { hp: 1, w: 86, h: 120, pts: 120, aimMul: 0.85 },
  popkat: { hp: 1, w: 70, h: 108, pts: 150, aimMul: 0.7 },   // pequeña y rápida
  civ:    { hp: 1, w: 100, h: 106, pts: -300, aimMul: 1 },   // holder de $GTC: no se dispara
  // villanos cripto
  rugpull: { hp: 1, w: 96, h: 116, pts: 120, aimMul: 0.85 },
  bear:    { hp: 1, w: 104, h: 122, pts: 120, aimMul: 1.1 },
  clown:   { hp: 1, w: 90, h: 120, pts: 120, aimMul: 0.9 },
  merc:    { hp: 1, w: 104, h: 120, pts: 150, aimMul: 0.8 },  // ametralladora: dispara antes
  // serie B
  shark:   { hp: 1, w: 96, h: 120, pts: 150, aimMul: 0.75 },
  robot:   { hp: 2, w: 96, h: 120, pts: 220, aimMul: 1 },    // blindado: el único que aguanta dos tiros
  bug:     { hp: 1, w: 88, h: 120, pts: 150, aimMul: 0.7 },
  agent:   { hp: 1, w: 92, h: 120, pts: 150, aimMul: 0.75 },
  // juego unificado (arte de ChatGPT)
  chad:    { hp: 1, w: 112, h: 122, pts: 120, aimMul: 0.9 },  // Gigachad, portero del club
  dogemob: { hp: 1, w: 104, h: 122, pts: 130, aimMul: 0.85 }, // Doge mafioso
  pepe:    { hp: 1, w: 110, h: 122, pts: 130, aimMul: 0.85 }, // Pepe pandillero (nivel 2)
  stonks:  { hp: 1, w: 110, h: 122, pts: 140, aimMul: 0.8 },  // crupier Stonks (nivel 3)
  grumpy:  { hp: 1, w: 110, h: 122, pts: 150, aimMul: 0.75 }, // Grumpy Cat del servicio secreto (nivel 3)
  dogenaut:{ hp: 1, w: 110, h: 122, pts: 150, aimMul: 0.75 }, // Doge astronauta (nivel 4)
  wojak:   { hp: 1, w: 110, h: 122, pts: 120, aimMul: 0.9 },  // Wojak con capucha (nivel 2)
};

// Jefe (más fácil desde el 8 oct 2026: era casi imposible para una persona)
export const BOSS = { hp: 18, w: 300, h: 250, every: 150, projT: 115 };

// Jefes del juego unificado. Cada uno con su mecánica:
//  chulo   — va y viene lanzando botellas (como GIGA DODGE): revienta las botellas o dale a él.
//  gemelos — dos a la vez; si tumbas a uno y no tumbas al otro en 3 s, el primero se levanta.
//  trump   — se esconde tras el atril (las balas rebotan) y solo es vulnerable cuando grita al micro.
//  musk    — de vez en cuando carga el núcleo: si no le das 4 veces mientras carga, el láser te quita
//            un corazón; los tiros durante la carga hacen el doble. Es el último jefe y el más duro: con
//            media vida se enfada (más rápido, tira más a menudo y siempre de dos en dos).
export const BOSS_DEFS = {
  dodge: { hp: 18, w: 300, h: 250, speed: 1.5, every: 150 },
  chulo: { hp: 16, w: 230, h: 190, speed: 1.2, every: 150, range: [350, 610] }, // más pequeño y sin salirse del escritorio
  gemelos: { hp: 10, w: 190, h: 200, speed: 1.2, every: 200, revive: 180 }, // tras las mesas del sótano
  trump: { hp: 24, w: 200, h: 170, speed: 1.0, every: 85, hide: 130, shout: 60 }, // más duro (19 oct): más vida, se mueve más, tira más y grita menos rato
  musk: { hp: 28, w: 220, h: 190, speed: 1.5, every: 95, calm: 190, charge: 100, need: 6, rage: 1.5 }, // el más duro (19 oct)
};
const defOf = (b) => BOSS_DEFS[b.kind] || BOSS_DEFS.dodge;
// Musk con media vida o menos: enfadado
export const enraged = (b) => !!BOSS_DEFS[b.kind]?.rage && b.hp <= b.max / 2;
export const bossSpeed = (b) => defOf(b).speed * (enraged(b) ? defOf(b).rage : 1);
export const aliveBosses = (s) => s.bosses.filter((b) => b.state !== 'dead');

// ---------- utilidades deterministas ----------

export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const irange = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));

// «Bolsas» (20 oct, cliente: que no haya partidas más fáciles que otras): en vez de sortear cada
// cosa por separado, se baraja un mazo con las proporciones exactas y se van sacando cartas. Cada
// partida trae el mismo reparto de obstáculos, monedas, objetos y enemigos; lo que cambia es el orden.
function bagPick(s, key, table) {
  const bags = s.bags || (s.bags = {});
  let bag = bags[key];
  if (!bag || !bag.length) {
    let total = 0;
    for (const k in table) total += table[k];
    bag = [];
    for (const k in table) {
      if (!(table[k] > 0)) continue;
      const n = Math.max(1, Math.round((20 * table[k]) / total));
      for (let i = 0; i < n; i++) bag.push(k);
    }
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(s.rng() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    bags[key] = bag;
  }
  return bag.pop();
}


export const multPct = (combo) => 100 + Math.min(combo, 10) * 10;

// ---------- creación ----------

export const X_MIN = -400;
export const X_MAX = 1360;

export function createSim(cfg) {
  return {
    cfg,
    rng: mulberry32(cfg.seed),
    tick: 0,
    stop: cfg.startStop | 0, // pruebas (?boss, solo modo libre): empezar en otra parada; forma parte de la partida

    phase: 'walk', // walk | fight | end
    phaseT: 0,
    enemies: [],
    nextId: 1,
    spawnIn: 40,
    kills: 0, // en la parada actual
    hearts: MAX_HEARTS,
    ammo: MAG,
    reloadUntil: 0,
    boss: null, // el primer jefe (compatibilidad con el dibujo)
    bosses: [],
    projectiles: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    shots: 0,
    hits: 0,
    heads: 0,
    totalKills: 0,
    civHits: 0,
    alive: true,
    won: false,
    deathBy: null,
    inputs: [], // [tick, tipo, x, y]  tipo 1 = disparo, 2 = recargar
  };
}

// ---------- cajas de impacto ----------

// alto del cuerpo entero respecto al de cintura para arriba
export const BODY_K = 2.05;

export function enemyBox(e) {
  const k = KINDS[e.kind];
  const sp = e.spot;
  if (sp.body) {
    // cuerpo entero (puertas, pasillos, escenario): los pies en sp.y; entra de lado, no sube
    const h = k.h * BODY_K * sp.s;
    const w = k.w * 0.85 * sp.s;
    let x0 = sp.x - w / 2;
    let x1 = sp.x + w / 2;
    let y0 = sp.y - h;
    let y1 = sp.y;
    if (sp.clip) {
      const [cx, cy, cw, ch] = sp.clip;
      x0 = Math.max(x0, cx);
      x1 = Math.min(x1, cx + cw);
      y0 = Math.max(y0, cy);
      y1 = Math.min(y1, cy + ch);
    }
    return { x0, y0, x1, y1, headY: sp.y - h + h * 0.2 };
  }
  const w = k.w * sp.s;
  const h = k.h * sp.s;
  // cuánto ha asomado (0..1)
  let up = 1;
  if (e.state === 'rise') up = e.t / RISE;
  else if (e.state === 'hide') up = 1 - e.t / HIDE;
  let x0 = sp.x - w / 2;
  let y0 = sp.y - h * up;
  let x1 = sp.x + w / 2;
  let y1 = sp.y;
  if (sp.clip) {
    const [cx, cy, cw, ch] = sp.clip;
    x0 = Math.max(x0, cx);
    x1 = Math.min(x1, cx + cw);
    y0 = Math.max(y0, cy);
    y1 = Math.min(y1, cy + ch);
  }
  return { x0, y0, x1, y1, headY: sp.y - h * up + h * 0.42 };
}

export function bossBox(b) {
  const D = defOf(b);
  const x0 = b.x - D.w / 2;
  let up = 1;
  if (b.state === 'rise') up = b.t / 40;
  const y0 = b.y - D.h * up - (b.lift && b.phase === 'shout' ? b.lift : 0); // al gritar se levanta
  return { x0, y0, x1: x0 + D.w, y1: b.y, headY: y0 + D.h * 0.45 };
}

// posición de un proyectil del jefe (se acerca a la pantalla: crece)
export function projPos(p) {
  const k = p.t / BOSS.projT;
  return { x: p.x0 + (p.x1 - p.x0) * k, y: p.y0 + (p.y1 - p.y0) * k, r: 10 + 40 * k * k };
}

// ---------- un tick ----------

function startFight(s) {
  s.phase = 'fight';
  s.phaseT = 0;
  s.kills = 0;
  s.spawnIn = 30;
  const st = stopsOf(s)[s.stop];
  if (st.boss) {
    const kind = st.bossKind || 'dodge';
    const D = BOSS_DEFS[kind] || BOSS_DEFS.dodge;
    const mk = (x, lo, hi, attackIn) => ({ kind, hp: D.hp, max: D.hp, x, lo, hi, y: st.bossY, dir: 1, state: 'rise', t: 0, attackIn, phase: 'fight', phaseT: 0, downAt: -1, chargeHits: 0, lift: st.shoutLift || 0 });
    if (kind === 'gemelos') s.bosses = [mk(300, 200, 420, 90), mk(660, 540, 760, 190)];
    else s.bosses = [mk(480, D.range ? D.range[0] : 320, D.range ? D.range[1] : 640, 90)];
    if (kind === 'trump') s.bosses[0].phase = 'hide';
    s.boss = s.bosses[0];
  }
  // cebo invisible: en algún momento de cada sala aparece un enemigo que no se dibuja
  s.ghostIn = irange(s.rng, 90, 420);
}

// Cebo para bots: un enemigo normal en los datos, pero que NO se dibuja (ver render.js). Una
// persona no puede verlo; un bot que lee el estado del juego le dispara. Se pone en un sitio sin
// enemigos reales cerca, para que nadie le dé por accidente al disparar a otro.
function spawnGhost(s, st) {
  const kind = Object.keys(st.kinds).find((k) => k !== 'civ') || 'dodge';
  const k = KINDS[kind];
  for (let tries = 0; tries < 12; tries++) {
    const spot = { x: irange(s.rng, 120, 840), y: irange(s.rng, 90, 200), s: 0.45, type: 'rise', ghost: true };
    const w = k.w * spot.s * 1.6;
    const h = k.h * spot.s * 1.4;
    const clash = st.spots.some((sp) => {
      const sw = (KINDS[kind].w * sp.s * (sp.body ? 1 : 1.2)) / 2 + 40;
      const sh = KINDS[kind].h * sp.s * (sp.body ? BODY_K : 1.2) + 40;
      return Math.abs(sp.x - spot.x) < sw + w / 2 && spot.y > sp.y - sh - 20 && spot.y - h < sp.y + 20;
    }) || (st.boss && s.bosses.some((b) => Math.abs(b.x - spot.x) < 260));
    if (clash) continue;
    s.enemies.push({ id: s.nextId++, kind, spot, state: 'rise', t: 0, aim: 120, hp: 1, ghost: true, skin: 0 });
    return;
  }
}

function spawn(s, st) {
  const busy = new Set(s.enemies.filter((e) => !e.ghost).map((e) => e.spot));
  const free = st.spots.filter((sp) => !busy.has(sp));
  if (!free.length) return;
  const spot = free[Math.floor(s.rng() * free.length)];
  let kind = bagPick(s, 'kinds' + s.stop, st.kinds); // mismo reparto de enemigos en todas las partidas
  // un solo civil a la vez; y los civiles solo tienen dibujo de cintura para arriba: en puertas y
  // escenario (cuerpo entero) no salen. En ambos casos sale el primer enemigo de la sala.
  const firstFoe = Object.keys(st.kinds).find((k) => k !== 'civ') || 'dodge';
  if (kind === 'civ' && (spot.body || s.enemies.some((e) => e.kind === 'civ'))) kind = firstFoe;
  const aim = Math.floor(irange(s.rng, st.aim[0], st.aim[1]) * KINDS[kind].aimMul);
  // los civiles tienen 4 aspectos (bailarina, camarero, moneda HODL, abuela)
  const skin = kind === 'civ' ? Math.floor(s.rng() * 4) : 0;
  s.enemies.push({ id: s.nextId++, kind, spot, state: 'rise', t: 0, aim, hp: KINDS[kind].hp, hat: kind === 'waf', skin });
}

function award(s, base, head, speedFrac) {
  s.combo++;
  if (s.combo > s.maxCombo) s.maxCombo = s.combo;
  const pts = base + (head ? 100 : 0) + Math.floor(100 * Math.max(0, speedFrac));
  const total = Math.floor((pts * multPct(s.combo)) / 100);
  s.score += total;
  return total;
}

function shoot(s, x, y, ev) {
  if (s.tick < s.reloadUntil) {
    ev.push({ t: 'click' });
    return;
  }
  if (s.ammo <= 0) {
    ev.push({ t: 'click' });
    return;
  }
  s.ammo--;
  s.shots++;
  ev.push({ t: 'shot', x, y });
  if (s.ammo === 0) s.reloadUntil = s.tick + RELOAD_TICKS + 10;

  // 1) proyectiles del jefe (están delante de todo)
  for (const p of s.projectiles) {
    const q = projPos(p);
    const dx = x - q.x;
    const dy = y - q.y;
    if (dx * dx + dy * dy <= (q.r + 20) * (q.r + 20)) {
      p.dead = true;
      s.hits++;
      const pts = award(s, 50, false, 0);
      ev.push({ t: 'proj', x: q.x, y: q.y, pts });
      return;
    }
  }
  // 2) enemigos, de delante (más grandes) a atrás
  const order = s.enemies.filter((e) => e.state !== 'dead' && !(e.state === 'rise' && e.t < 5)).sort((a, b) => b.spot.s - a.spot.s);
  for (const e of order) {
    const bx = enemyBox(e);
    if (x < bx.x0 || x > bx.x1 || y < bx.y0 || y > bx.y1) continue;
    if (e.ghost) {
      // disparo a un cebo invisible: para el juego es un fallo; para el servidor, una pista de bot
      s.ghostHits = (s.ghostHits || 0) + 1;
      s.combo = 0;
      ev.push({ t: 'ghost', x, y, tick: s.tick });
      return;
    }
    s.hits++;
    if (e.kind === 'civ') {
      s.civHits++;
      s.combo = 0;
      s.score = Math.max(0, s.score + KINDS.civ.pts);
      e.state = 'dead';
      e.t = 0;
      ev.push({ t: 'civ', e, pts: KINDS.civ.pts });
      return;
    }
    const head = y <= bx.headY;
    e.hp--;
    if (e.hp > 0) {
      e.hat = false;
      const pts = award(s, 50, false, 0);
      ev.push({ t: 'hat', e, pts });
      return;
    }
    if (head) s.heads++;
    const speed = e.state === 'aim' ? 1 - e.t / e.aim : e.state === 'rise' ? 1 : 0;
    const pts = award(s, KINDS[e.kind].pts, head, speed);
    e.state = 'dead';
    e.t = 0;
    s.kills++;
    s.totalKills++;
    ev.push({ t: 'kill', e, head, pts });
    return;
  }
  // 3) los jefes
  for (const b of s.bosses) {
    if (b.state === 'dead') continue;
    const bx = bossBox(b);
    if (x < bx.x0 || x > bx.x1 || y < bx.y0 || y > bx.y1) continue;
    // Trump escondido tras el atril: la bala rebota
    if (b.kind === 'trump' && b.phase !== 'shout') {
      s.combo = 0;
      ev.push({ t: 'block', x, y });
      return;
    }
    s.hits++;
    const head = y <= bx.headY;
    let dmg = head ? 2 : 1;
    if (b.kind === 'musk') {
      // El Dorado: con el oro encima, fuera de la carga cada tiro hace 1 (aunque sea a la cabeza);
      // el daño de verdad se le hace mientras carga el núcleo (×2). Antes se le bajaba media vida
      // nada más empezar
      if (b.phase === 'charge') {
        dmg *= 2;
        b.chargeHits++;
      } else dmg = 1;
    }
    b.hp -= dmg;
    if (enraged(b) && !b.raged && b.hp > 0) {
      b.raged = true;
      ev.push({ t: 'rage', b });
    }
    if (head) s.heads++;
    const pts = award(s, head ? 40 : 20, false, 0);
    ev.push({ t: 'bosshit', head, pts, x, y, b });
    if (b.hp <= 0) {
      b.state = 'dead';
      b.t = 0;
      b.downAt = s.tick;
      if (aliveBosses(s).length) {
        ev.push({ t: 'twinDown', b }); // queda el otro gemelo: date prisa
        return;
      }
      s.score += 3000;
      ev.push({ t: 'bossdown', b });
      // con el jefe abatido se acaba el tiroteo: lo que había en el aire se apaga y sus
      // ayudantes se esconden sin disparar
      for (const p of s.projectiles) {
        const q = projPos(p);
        ev.push({ t: 'defuse', x: q.x, y: q.y });
      }
      s.projectiles = [];
      for (const e of s.enemies) {
        if (e.state === 'dead' || e.state === 'hide') continue;
        e.state = 'hide';
        e.t = 0;
      }
    }
    return;
  }
  s.combo = 0;
  ev.push({ t: 'miss', x, y });
}

function hurt(s, ev, by) {
  s.hearts--;
  s.combo = 0;
  ev.push({ t: 'hurt', by });
  if (s.hearts <= 0) {
    s.alive = false;
    s.deathBy = by;
    ev.push({ t: 'death' });
  }
}

// act: null o { type: 1 (disparo) | 2 (recargar), x, y }
export function step(s, act) {
  const ev = [];
  if (!s.alive) return ev;

  // solo tipos 1/2 y coordenadas enteras dentro de la pantalla (los márgenes de las pantallas anchas
  // caen fuera de 0..960, por eso X admite de -400 a 1360)
  if (act && (act.type === 1 || act.type === 2)) {
    const x = Math.max(X_MIN, Math.min(X_MAX, act.x | 0));
    const y = Math.max(0, Math.min(540, act.y | 0));
    act = { type: act.type, x, y };
    s.inputs.push([s.tick, act.type, x, y]);
    if (act.type === 1 && s.phase === 'fight') shoot(s, x, y, ev);
    else if (act.type === 2 && s.ammo < MAG && s.tick >= s.reloadUntil) {
      s.reloadUntil = s.tick + RELOAD_TICKS;
      s.ammo = 0;
      ev.push({ t: 'reload' });
    }
  }
  if (s.reloadUntil && s.tick + 1 === s.reloadUntil) {
    s.ammo = MAG;
    ev.push({ t: 'reloaded' });
  }

  s.phaseT++;
  if (s.phase === 'walk') {
    if (s.phaseT >= WALK_TICKS + (stopsOf(s)[s.stop].boss ? BOSS_INTRO : 0)) {
      startFight(s);
      ev.push({ t: 'arrive', stop: s.stop });
    }
  } else if (s.phase === 'fight') {
    const st = stopsOf(s)[s.stop];
    // enemigos
    for (const e of s.enemies) {
      e.t++;
      if (e.state === 'rise' && e.t >= RISE) {
        e.state = 'aim';
        e.t = 0;
      } else if (e.state === 'aim' && e.t >= (e.kind === 'civ' ? 100 : e.aim)) {
        e.state = e.kind === 'civ' || e.ghost ? 'hide' : 'fire';
        e.t = 0;
        if (e.kind !== 'civ' && !e.ghost) hurt(s, ev, e.kind);
        if (!s.alive) return ev;
      } else if (e.state === 'fire' && e.t >= FIRE) {
        e.state = 'hide';
        e.t = 0;
      } else if (e.state === 'hide' && e.t >= HIDE) e.gone = true;
      else if (e.state === 'dead' && e.t >= 30) e.gone = true;
    }
    s.enemies = s.enemies.filter((e) => !e.gone);

    // jefes: van y vienen, asoman, lanzan cosas y cada uno hace lo suyo
    for (const b of s.bosses) {
      const D = defOf(b);
      b.t++;
      if (b.state === 'dead') {
        // gemelos: si el otro sigue en pie pasado el plazo, este se levanta
        if (b.kind === 'gemelos' && aliveBosses(s).length && s.tick - b.downAt >= D.revive) {
          b.state = 'fight';
          b.hp = Math.ceil(D.hp / 2);
          b.t = 0;
          ev.push({ t: 'revive', b });
        }
        continue;
      }
      if (b.state === 'rise') {
        if (b.t >= 40) {
          b.state = 'fight';
          b.t = 0;
        }
        continue;
      }
      b.x += b.dir * bossSpeed(b);
      if (b.x > b.hi || b.x < b.lo) b.dir = -b.dir;
      b.phaseT++;
      let canThrow = true;
      if (b.kind === 'trump') {
        if (b.phase === 'hide' && b.phaseT >= D.hide) {
          b.phase = 'shout';
          b.phaseT = 0;
          ev.push({ t: 'shout', b });
        } else if (b.phase === 'shout' && b.phaseT >= D.shout) {
          b.phase = 'hide';
          b.phaseT = 0;
        }
        canThrow = b.phase === 'hide';
      } else if (b.kind === 'musk') {
        if (b.phase === 'fight' && b.phaseT >= D.calm) {
          b.phase = 'charge';
          b.phaseT = 0;
          b.chargeHits = 0;
          ev.push({ t: 'charge', b });
        } else if (b.phase === 'charge' && b.phaseT >= D.charge) {
          b.phase = 'fight';
          b.phaseT = 0;
          if (b.chargeHits < D.need) {
            ev.push({ t: 'laser', b });
            hurt(s, ev, 'boss');
            if (!s.alive) return ev;
          } else ev.push({ t: 'chargeBroken', b });
        }
        canThrow = b.phase === 'fight';
      }
      if (canThrow && --b.attackIn <= 0) {
        b.attackIn = Math.round((D.every - Math.min(30, s.phaseT >> 6)) / (enraged(b) ? D.rage : 1));
        // un proyectil; dos solo cuando ya le queda poca vida (Musk enfadado, siempre dos)
        const n = enraged(b) || (b.hp <= b.max / 3 && s.rng() < 0.5) ? 2 : 1;
        for (let i = 0; i < n; i++)
          s.projectiles.push({ x0: b.x + (i ? 40 : -40), y0: b.y - 200, x1: 140 + s.rng() * 540, y1: 330 + s.rng() * 120, t: 0, kind: b.kind });
        ev.push({ t: 'throw', b });
      }
    }
    for (const p of s.projectiles) {
      if (p.dead) continue;
      if (++p.t >= BOSS.projT) {
        p.dead = true;
        hurt(s, ev, 'boss');
        if (!s.alive) return ev;
      }
    }
    s.projectiles = s.projectiles.filter((p) => !p.dead);

    // aparición de enemigos
    if (s.ghostIn > 0 && --s.ghostIn === 0) spawnGhost(s, st);
    const foes = s.enemies.filter((e) => e.kind !== 'civ' && e.state !== 'dead' && !e.ghost).length;
    const needMore = st.boss ? aliveBosses(s).length > 0 : s.kills + foes < st.quota + 0;
    if (needMore && s.enemies.filter((e) => e.state !== 'dead' && !e.ghost).length < st.maxActive) {
      if (--s.spawnIn <= 0) {
        spawn(s, st);
        s.spawnIn = irange(s.rng, 25, 60);
      }
    }

    // ¿parada despejada?
    const cleared = st.boss ? s.bosses.length > 0 && !aliveBosses(s).length : s.kills >= st.quota;
    // tras tumbar al jefe, 2,5 s para verlo caer y leer el cartel antes de pasar a lo siguiente
    if (cleared && st.boss) s.bossWait = (s.bossWait || 0) + 1;
    if (cleared && (!st.boss || s.bossWait >= 150) && !s.enemies.some((e) => e.state !== 'dead' && e.kind !== 'civ' && !e.ghost) && !s.projectiles.length) {
      if (s.stop === stopsOf(s).length - 1) {
        s.phase = 'end';
        s.won = true;
        s.alive = false;
        s.score += s.hearts * 500 + Math.floor((2000 * s.hits) / Math.max(1, s.shots));
        ev.push({ t: 'win' });
      } else {
        s.stop++;
        s.phase = 'walk';
        s.phaseT = 0;
        s.enemies = [];
        ev.push({ t: 'walk' });
      }
    }
  }

  s.tick++;
  if (s.tick >= MAX_TICKS && s.alive) {
    s.alive = false;
    s.deathBy = 'tiempo';
    ev.push({ t: 'death' });
  }
  return ev;
}

export function summary(s) {
  return {
    score: s.score,
    kills: s.totalKills,
    heads: s.heads,
    accuracy: s.shots ? Math.round((100 * s.hits) / s.shots) : 0,
    maxCombo: s.maxCombo,
    stop: s.stop,
    won: s.won,
    hearts: s.hearts,
    ticks: s.tick,
    deathBy: s.deathBy,
  };
}

// Comprueba que la lista de acciones que llega del cliente está bien formada ANTES de repetirla:
// [tick, tipo, x, y] con enteros, ticks estrictamente crecientes, tipo 1|2, coordenadas en pantalla.
export function validateInputs(inputs) {
  if (!Array.isArray(inputs)) return 'inputs no es una lista';
  if (inputs.length > MAX_TICKS) return 'demasiadas acciones';
  let prev = -1;
  for (const a of inputs) {
    if (!Array.isArray(a) || a.length !== 4 || !a.every(Number.isInteger)) return 'acción mal formada';
    const [tick, type, x, y] = a;
    if (tick < 0 || tick >= MAX_TICKS || tick <= prev) return 'ticks desordenados o fuera de rango';
    if (type !== 1 && type !== 2) return 'tipo de acción desconocido';
    if (x < X_MIN || x > X_MAX || y < 0 || y > 540) return 'coordenadas fuera de pantalla';
    prev = tick;
  }
  return null;
}

// Repite la partida a partir de la semilla y la lista de acciones. Para el servidor.
// El servidor monta `cfg` él mismo: semilla suya y, en el diario, startStop siempre 0.
// Devuelve el resumen con `valid` = false si la lista es inválida o sobran acciones tras el final.
export function simulate(cfg, inputs) {
  const bad = validateInputs(inputs);
  if (bad) return { valid: false, reason: bad };
  const s = createSim(cfg);
  let i = 0;
  while (s.alive) {
    let act = null;
    if (i < inputs.length && inputs[i][0] === s.tick) {
      const [, type, x, y] = inputs[i++];
      act = { type, x, y };
    }
    step(s, act);
  }
  if (i < inputs.length) return { valid: false, reason: 'acciones después del final' };
  return { valid: true, ...summary(s) };
}

// Bot de pruebas: dispara a la cabeza del enemigo que lleva más tiempo apuntando.
export function botAction(s, delay = 25) {
  if (s.phase !== 'fight') return null;
  if (s.ammo === 0 && s.tick >= s.reloadUntil) return { type: 2, x: 0, y: 0 };
  if (s.tick < s.reloadUntil) return null;
  for (const p of s.projectiles) {
    if (p.t > 20) {
      const q = projPos(p);
      return { type: 1, x: q.x, y: q.y };
    }
  }
  const targets = s.enemies.filter((e) => !e.ghost && e.kind !== 'civ' && e.state === 'aim' && e.t >= Math.min(delay, e.aim - 5));
  if (targets.length) {
    const e = targets.sort((a, b) => b.t / b.aim - a.t / a.aim)[0];
    const bx = enemyBox(e);
    return { type: 1, x: (bx.x0 + bx.x1) / 2, y: bx.y0 + (bx.headY - bx.y0) / 2 };
  }
  const bb = s.bosses.find((b) => b.state === 'fight' && !(b.kind === 'trump' && b.phase !== 'shout'));
  if (bb && s.tick % 12 === 0) {
    const bx = bossBox(bb);
    return { type: 1, x: (bx.x0 + bx.x1) / 2, y: bx.y0 + 40 };
  }
  return null;
}
