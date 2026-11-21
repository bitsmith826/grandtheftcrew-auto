// Lógica pura del juego. Determinista: misma semilla + mismas pulsaciones = misma partida.
// Sin DOM, sin Math.random, sin Math.sin/cos: el servidor (Node) la importa tal cual para
// repetir la partida y validar la puntuación.
//
// Dos acciones:
//   A = saltar (gata) / embestir (perro): hay que estar en el aire mientras se cruza un
//       obstáculo de suelo (barrera, coche patrulla, hueco).
//   B = disparar: derriba el primer obstáculo disparable (dron, bidones explosivos) que esté a tiro.
// El personaje elegido solo cambia el aspecto: las reglas son las mismas para los dos.

export const TICK_RATE = 60;
export const PLAYER_HALF = 18;          // medio ancho de la caja de choque del personaje
export const PX_PER_METER = 20;
export const MAX_TICKS = 60 * 60 * 15;  // 15 minutos de tope (seguridad)
export const GOAL_M = 2500;             // meta del diario: el aeropuerto de Vice, ~700 m después de llegar a 5★
export const GOAL_X = GOAL_M * 20;      // en px de mundo (PX_PER_METER = 20)
export const ESCAPE_BONUS = 5000;
const CLEAR_RUNWAY = 2200;              // los últimos px antes de la meta no tienen obstáculos

// salto / embestida
export const JUMP_PX = 340;             // distancia que se recorre en el aire
export const JUMP_RECOVER = 6;          // ticks en el suelo antes de poder volver a saltar
export const JUMP_LIMIT_PX = 70;        // saltar con el obstáculo a menos de esto = "al límite"
const ONEUP_TICKS = 2; // la vida extra solo se coge a ±2 tics de lo alto del salto (ventana de ~80 ms): difícil a propósito
// disparo
export const SHOT_RANGE = 420;          // alcance (px por delante del personaje)
export const SHOT_CLOSE = 130;          // acertar con el blanco más cerca que esto = "al límite"
export const SHOT_COOLDOWN = 12;        // ticks tras un acierto
export const SHOT_MISS_COOLDOWN = 30;   // ticks tras un fallo (y rompe el combo)

export const ACT_A = 1;
export const ACT_B = 2;

const STAR_DIST = [0, 6000, 14000, 24000, 36000];
const STAR_SPEED = [0, 7, 8.2, 9.4, 10.6, 11.8];
const REACT_TICKS = [0, 34, 30, 26, 22, 19];
const MAX_SPEED = 14;

export const OBSTACLES = {
  barrera:  { need: 'A', w: 34 },
  patrulla: { need: 'A', w: 110 },      // el coche mide 150, pero se perdona pisar el parachoques (20 px por lado)
  hueco:    { need: 'A', w: 96 },
  dron:     { need: 'B', w: 40 },
  bidones:  { need: 'B', w: 44 },       // furgón blindado (antes bidones): demasiado alto para saltarlo
  // hoja GTA 2
  hidrante: { need: 'A', w: 40 },       // boca de incendios reventada
  perritos: { need: 'A', w: 70 },       // carrito de perritos
  moto:     { need: 'A', w: 70 },       // moto de policía
  pandillero: { need: 'B', w: 36 },     // pandillero apuntándote
  noticias: { need: 'B', w: 40 },       // helicóptero de la tele
  // juego unificado: niveles avanzados
  poli:     { need: 'B', w: 36, vel: 4 }, // policía que viene CORRIENDO hacia ti: hay que tumbarlo a tiros
  basura:   { need: 'A', w: 80 },         // cubo de basura volcado y bolsas (sustituye a las alcantarillas)
  maton:    { need: 'B', w: 36 },         // matón con bate esperándote (sustituye al helicóptero)
  carrito:  { need: 'A', w: 60 },
  borracho: { need: 'A', w: 100 },        // turista borracho tirado en la acera (nivel 1)
  flamencos:{ need: 'A', w: 70 },         // flamencos de plástico y una tumbona (nivel 1)
  // nivel 2 (arte de ChatGPT)
  fuego:    { need: 'A', w: 50 },         // cubo de basura ardiendo
  lowrider: { need: 'A', w: 140 },        // lowrider botando (se perdona pisar los parachoques)
  banda:    { need: 'B', w: 36 },         // pandillero apuntándote
  driveby:  { need: 'B', w: 60 },         // coche del tiroteo: a tiros revienta
  // nivel 3 (Downtown)
  dron3:    { need: 'B', w: 40 },         // dron de la policía (nivel 3): a tiros cae destrozado
  heli5:    { need: 'B', w: 60 },         // helicóptero de la policía (nivel 5): a tiros cae ardiendo
  montacargas: { need: 'A', w: 100 },     // nivel 4
  cajas:    { need: 'A', w: 70 },
  cyber:    { need: 'A', w: 130 },        // camioneta de acero (se perdona pisar los parachoques)
  escopeta: { need: 'B', w: 36 },         // guardia con escopeta
  robot:    { need: 'B', w: 36, vel: 4 }, // robot que viene corriendo
  blindado: { need: 'B', w: 70 },         // furgón blindado GTC: a tiros revienta
  limo:     { need: 'A', w: 160 },        // limusina negra (se perdona pisar los parachoques)
  taxi:     { need: 'A', w: 140 },
  valla:    { need: 'A', w: 60 },         // valla de POLICE LINE
  suv:      { need: 'A', w: 150 },        // todoterreno del servicio secreto
  swat:     { need: 'B', w: 36, vel: 4 }, // SWAT que viene corriendo con su escudo
  guard:    { need: 'B', w: 36 },         // guardia del casino apuntándote
  // nivel 5 (autopista)
  pinchos:  { need: 'A', w: 120 },
  maletas:  { need: 'A', w: 150 },        // tren de carritos de equipaje (se perdona pisar los extremos)
  control:  { need: 'A', w: 175 },        // control policial: dos coches morro con morro
  tanque:   { need: 'B', w: 150 },        // tanque: a tiros queda ardiendo
  swatk:    { need: 'B', w: 36 },         // SWAT de rodillas tras su escudo
  soldado:  { need: 'B', w: 36, vel: 4 }, // soldado que viene corriendo         // carrito de la compra volcado con trastos (sustituye a la boca de incendios)
  // (hueco y noticias siguen definidos para Dúo/Meme Wars, pero ningún nivel los usa ya)
};

const TYPE_WEIGHTS = {
  playa:  { A: { barrera: 2, patrulla: 2, basura: 3, carrito: 1, perritos: 2, moto: 1 }, B: { bidones: 1, pandillero: 2, maton: 3 } },
  centro: { A: { barrera: 2, patrulla: 3, basura: 1, carrito: 2, perritos: 1, moto: 2 }, B: { bidones: 2, pandillero: 3, maton: 2 } },
};

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

// ---------- reglas ----------

export function starsAt(dist, minStars, table = STAR_DIST) {
  let s = 0;
  for (let i = 0; i < table.length; i++) if (dist >= table[i]) s = i + 1;
  return Math.max(s, minStars);
}

export function targetSpeed(stars, dist) {
  if (stars < 5) return STAR_SPEED[stars];
  const extra = (dist - STAR_DIST[4]) * 0.00005;
  return Math.min(MAX_SPEED, STAR_SPEED[5] + Math.max(0, extra));
}

export function multPct(combo) {
  return 100 + Math.min(combo, 10) * 25;
}

// holgura a cada lado si se salta centrado sobre un obstáculo de ancho w
const jumpSlack = (w, jp = JUMP_PX) => (jp - (w + 2 * PLAYER_HALF)) / 2;

// ---------- creación ----------

export function createSim(cfg) {
  // nivel del juego unificado: estrellas mínimas y a qué distancia sube cada una (cfg.minStars, cfg.starDist)
  const minStars = cfg.minStars || (cfg.modifier === 'maxima_busqueda' ? 3 : 1);
  const starDist = cfg.starDist || STAR_DIST;
  const stars = starsAt(0, minStars, starDist);
  return {
    cfg,
    rng: mulberry32(cfg.seed),
    minStars,
    starDist,
    // dificultad del nivel: salto más corto = margen más estrecho; reactMul < 1 = obstáculos más juntos
    jumpPx: cfg.jumpPx || JUMP_PX,
    reactMul: cfg.reactMul || 1,
    pickupChance: cfg.pickupChance ?? 0.16,
    finishBonus: cfg.finishBonus ?? ESCAPE_BONUS,
    coinValue: cfg.modifier === 'dia_de_cobro' ? 20 : 10,
    coinChance: cfg.modifier === 'dia_de_cobro' ? 0.9 : 0.55,
    tick: 0,
    dist: 0,
    prevDist: 0,
    speed: targetSpeed(stars, 0),
    stars,
    alive: true,
    deathBy: null,
    finished: false,
    goalX: cfg.endless ? Infinity : cfg.goalM ? cfg.goalM * PX_PER_METER : GOAL_X, // libre: sin meta
    obstacles: [],
    coins: [],
    coinsMissed: [], // solo para dibujarlas: las que se quedaron atrás sin coger
    nextX: 900,
    // salto
    jumpStart: -1,
    jumpEnd: -1,
    canJumpAt: 0,
    jumpFresh: false,
    jumpLead: 0,
    // disparo
    shotReadyAt: 0,
    shots: 0,
    misses: 0,
    // puntuación
    bonus: 0,
    score: 0,
    meters: 0,
    coinsTaken: 0,
    passed: 0,
    limits: 0,
    combo: 0,
    maxCombo: 0,
    inputs: [], // tick * 4 + acción (bits A=1, B=2)
    // recogidas al estilo GTA: corazón = vida extra · chaleco = blindaje unos segundos · estrella = soborno (-1★ un rato)
    pickups: [],
    lives: 0,
    armorUntil: 0,
    maccaUntil: 0, // Macca corre delante y se come los obstáculos
    bribeUntil: 0,
    rampageUntil: 0,
    hitUntil: 0,
  };
}

export const isAirborne = (s) => s.tick >= s.jumpStart && s.tick < s.jumpEnd;

// ---------- generación del circuito ----------

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

function pickType(s, need) {
  return bagPick(s, 'type' + need, (s.cfg.weights || TYPE_WEIGHTS[s.cfg.district] || TYPE_WEIGHTS.playa)[need]);
}

function addObstacle(s, x, type) {
  const def = OBSTACLES[type];
  const o = { type, need: def.need, x, w: def.w, v: s.rng(), touched: false, done: false, cleared: false, limit: false, pts: 0 };
  s.obstacles.push(o);
  return o;
}

// separación mínima entre dos obstáculos seguidos (de borde final a borde inicial)
function minGap(prev, need, nextW, sp, jp) {
  if (!prev) return 0;
  if (prev.need === 'A' && need === 'A') {
    // aterrizar, recuperarse y volver a saltar centrado
    return 2 * PLAYER_HALF + jumpSlack(prev.w, jp) + jumpSlack(nextW, jp) + JUMP_RECOVER * sp + 24;
  }
  if (prev.need === 'B' && need === 'B') return sp * (SHOT_COOLDOWN + 6);
  return 60;
}

function generate(s) {
  const x0 = s.nextX;
  if (x0 >= s.goalX - CLEAR_RUNWAY) {
    // pista del aeropuerto: una última fila de monedas hasta el avión y nada más
    for (let i = 0; i < 12; i++) s.coins.push({ x: x0 + 200 + i * 60, i: i % 4, n: 4, taken: false, air: true }); // también en el aire (de 4 en 4: un salto por grupo)
    s.nextX = Infinity;
    return;
  }
  const st = starsAt(x0, s.minStars, s.starDist);
  const sp = targetSpeed(st, x0);
  const react = REACT_TICKS[st] * s.reactMul;
  const jp = s.jumpPx;
  const rng = s.rng;

  const patterns = { uno: 4, dos: 4, carrera: 1 };
  if (st >= 2) patterns.tres = 3;
  if (st >= 4) patterns.cuatro = 2;
  const pattern = bagPick(s, 'pat' + Object.keys(patterns).length, patterns);
  const n = { uno: 1, dos: 2, tres: 3, cuatro: 4, carrera: 0 }[pattern];

  let x = x0;
  let prev = null;
  const last = { A: null, B: null };
  for (let i = 0; i < n; i++) {
    const need = bagPick(s, 'need', { A: 11, B: 9 });
    const type = pickType(s, need);
    const w = OBSTACLES[type].w;
    // la separación se mide contra el anterior y contra el último del mismo tipo de acción
    // (entre dos saltos puede haber un dron en medio, pero hay que aterrizar igual)
    let at = prev ? x + minGap(prev, need, w, sp, jp) : x;
    if (OBSTACLES[type].vel) at += 160; // el que corre hacia ti se come parte del hueco: margen extra
    const same = last[need];
    if (same) at = Math.max(at, same.x + same.w + minGap(same, need, w, sp, jp));
    if (prev) at += sp * rng() * (react * 0.6);
    const o = addObstacle(s, at, type);
    x = o.x + o.w;
    prev = o;
    last[need] = o;
  }

  // Vida extra (1UP, 29 oct, cliente): una por tramo en los niveles que la llevan (cfg.oneUp), pasada
  // la mitad. Flota encima del centro de un obstáculo de saltar y solo se coge en lo alto del salto:
  // hay que saltar ese obstáculo justo a tiempo, centrado (no vale con pasarlo). Sin dados: no cambia
  // el resto de la generación
  if (s.cfg.oneUp && !s.oneUpPlaced && x0 >= s.goalX * 0.45 && prev && prev.need === 'A') {
    s.oneUpPlaced = true;
    s.pickups.push({ x: prev.x + prev.w / 2, kind: 'life', taken: false, apex: true });
  }

  // respiro tras el patrón, con fila de monedas
  const breath = sp * (react + 30 + rng() * 40) * (pattern === 'carrera' ? 1.6 : 1) + (prev && prev.need === 'A' ? jp : 0);
  if (pattern === 'carrera' || bagPick(s, 'coin', { y: s.coinChance, n: 1 - s.coinChance }) === 'y') {
    const nc = pattern === 'carrera' ? 9 : 5;
    const start = x + 60 + (prev && prev.need === 'A' ? jp * 0.5 : 0);
    const step = Math.min(36, (breath - 160) / nc);
    if (step > 18) {
      // monedas en el aire (20 oct, cliente): solo se cogen saltando, y valen más. Así no todo el que
      // corre sin fallar acaba con la misma puntuación: hay que arriesgar un salto entre obstáculos
      for (let i = 0; i < nc; i++) s.coins.push({ x: start + i * step, i, n: nc, taken: false, air: true });
    }
  }
  if (breath > 420 && bagPick(s, 'pk', { y: s.pickupChance, n: 1 - s.pickupChance }) === 'y') {
    // Macca (el caimán rosa) solo aparece cuando ya lo has rescatado (cfg.macca)
    const kind = bagPick(s, s.cfg.macca ? 'kindM' : 'kind', s.cfg.macca ? { macca: 20, heart: 8, vest: 20, star: 18, cash: 22, skull: 12 } : { heart: 28, vest: 20, star: 18, cash: 22, skull: 12 });
    s.pickups.push({ x: x + breath - 140, kind, taken: false });
  }
  s.nextX = x + breath;
}

// ---------- un tick ----------

function award(s, o, close) {
  if (close) {
    o.limit = true;
    s.limits++;
    s.combo++;
    if (s.combo > s.maxCombo) s.maxCombo = s.combo;
  } else {
    s.combo = 0;
  }
  o.pts = Math.floor(((close ? 75 : 25) * multPct(s.combo)) / 100) * (s.tick < s.rampageUntil ? 2 : 1);
}

export function step(s, act = 0) {
  const ev = [];
  if (!s.alive) return ev;

  act = (act | 0) & 3; // solo bits A/B: nada de valores raros llegados de fuera
  if (act) s.inputs.push(s.tick * 4 + act);

  // A: saltar / embestir
  if (act & ACT_A && s.tick >= s.canJumpAt) {
    const ticks = Math.ceil(s.jumpPx / s.speed);
    s.jumpStart = s.tick;
    s.jumpEnd = s.tick + ticks;
    s.canJumpAt = s.jumpEnd + JUMP_RECOVER;
    s.jumpFresh = true;
    // distancia hasta el siguiente obstáculo de suelo, para el "al límite"
    const next = s.obstacles.find((o) => o.need === 'A' && !o.touched && o.x + o.w >= s.dist - PLAYER_HALF);
    s.jumpLead = next ? next.x - (s.dist + PLAYER_HALF) : Infinity;
    ev.push({ t: 'jump' });
  }

  // B: disparar al primer blanco a tiro
  if (act & ACT_B && s.tick >= s.shotReadyAt) {
    s.shots++;
    let target = null;
    for (const o of s.obstacles) {
      if (o.need !== 'B' || o.cleared || o.touched) continue;
      const lead = o.x - (s.dist + PLAYER_HALF);
      if (lead > 0 && lead <= SHOT_RANGE) {
        target = o;
        break;
      }
      if (lead > SHOT_RANGE) break;
    }
    if (target) {
      target.cleared = true;
      award(s, target, target.x - (s.dist + PLAYER_HALF) <= SHOT_CLOSE);
      if (target.type === 'bidones') {
        s.bonus += 150; // el furgón blindado suelta fajos de billetes
        target.cash = 150;
      }
      s.shotReadyAt = s.tick + SHOT_COOLDOWN;
      ev.push({ t: 'shot', o: target, combo: s.combo });
    } else {
      s.misses++;
      s.combo = 0;
      s.shotReadyAt = s.tick + SHOT_MISS_COOLDOWN;
      ev.push({ t: 'miss' });
    }
  }

  const target = targetSpeed(s.stars, s.dist);
  if (s.speed < target) s.speed = Math.min(target, s.speed + 0.02);
  else if (s.speed > target) s.speed = Math.max(target, s.speed - 0.02);
  s.prevDist = s.dist;
  s.dist += s.speed;

  const ns = Math.max(s.minStars, starsAt(s.dist, s.minStars, s.starDist) - (s.tick < s.bribeUntil ? 1 : 0));
  if (ns > s.stars) {
    s.stars = ns;
    ev.push({ t: 'star', stars: ns });
  } else if (ns < s.stars) s.stars = ns;

  while (s.nextX < s.dist + 1600) generate(s);

  // los que corren hacia ti arrancan cuando están a menos de 520 px (siempre en el mismo tick: determinista)
  for (const o of s.obstacles) {
    const vel = OBSTACLES[o.type].vel;
    if (!vel || o.cleared || o.touched) continue;
    if (o.x - s.dist < 520) o.x -= vel;
  }

  // Macca va unos pasos por delante y se zampa lo que encuentra
  if (s.tick < s.maccaUntil) {
    for (const o of s.obstacles) {
      if (o.done || o.touched || o.cleared || o.eaten) continue;
      const lead = o.x - s.dist;
      if (lead > 170) break;
      if (lead < 0) continue;
      o.eaten = true;
      o.cleared = true;
      const pts = 100 * (s.tick < s.rampageUntil ? 2 : 1);
      s.bonus += pts;
      ev.push({ t: 'chomp', o, pts });
    }
  }

  const air = isAirborne(s);
  const pL = s.dist - PLAYER_HALF;
  const pR = s.dist + PLAYER_HALF;
  for (const o of s.obstacles) {
    if (o.done) continue;
    if (o.x > pR) break;
    if (o.x + o.w < pL) {
      o.done = true;
      s.passed++;
      s.bonus += o.pts;
      ev.push({ t: 'pass', o });
      continue;
    }
    const ok = o.eaten || (o.need === 'A' ? air : o.cleared);
    if (!o.touched) {
      o.touched = true;
      if (ok && o.need === 'A') {
        if (s.jumpFresh) {
          award(s, o, s.jumpLead <= JUMP_LIMIT_PX);
          s.jumpFresh = false;
        } else {
          o.pts = Math.floor((25 * multPct(s.combo)) / 100);
        }
      }
      ev.push({ t: 'touch', o, combo: s.combo });
    }
    if (!ok) {
      if (s.tick < s.armorUntil || s.tick < s.hitUntil) {
        // blindado (o recién golpeado): lo atraviesa
        o.cleared = true;
        o.smashed = true;
        if (s.tick < s.armorUntil) ev.push({ t: 'armorHit', o });
        continue;
      }
      if (s.lives > 0) {
        s.lives--;
        s.hitUntil = s.tick + 60;
        s.combo = 0;
        o.cleared = true;
        o.smashed = true;
        ev.push({ t: 'lifeLost', o, lives: s.lives });
        continue;
      }
      s.alive = false;
      s.deathBy = o.type;
      ev.push({ t: 'death', o });
      break;
    }
  }

  for (const pk of s.pickups) {
    if (pk.taken || pk.done || pk.x > s.dist) continue;
    // flotan en el aire: solo se cogen saltando (20 oct, cliente); si pasas por debajo, se pierden
    if (!isAirborne(s)) {
      pk.done = true;
      continue;
    }
    // la vida extra está más alta: solo justo en lo alto del salto
    if (pk.apex) {
      if (Math.abs(s.tick - (s.jumpStart + s.jumpEnd) / 2) > ONEUP_TICKS) {
        pk.done = true;
        continue;
      }
    }
    pk.taken = true;
    if (pk.kind === 'heart') s.lives = Math.min(2, s.lives + 1);
    else if (pk.kind === 'vest') s.armorUntil = s.tick + 300;
    else if (pk.kind === 'star') s.bribeUntil = s.tick + 900;
    else if (pk.kind === 'skull') s.rampageUntil = s.tick + 480;
    else if (pk.kind === 'macca') s.maccaUntil = s.tick + 420;
    s.bonus += pk.kind === 'cash' ? 250 : pk.kind === 'life' ? 0 : 50; // la vida la da la partida (campaign.js)
    ev.push({ t: 'pickup', pk });
  }
  if (s.pickups.length > 12) s.pickups = s.pickups.filter((pk) => !pk.taken && !pk.done);

  while (s.coins.length && s.coins[0].x <= s.dist && !s.coins[0].taken) {
    const c = s.coins.shift();
    if (c.air && !isAirborne(s)) {
      // pasó por debajo sin saltar: se pierde, pero se sigue viendo (si desaparecía parecía cogida)
      s.coinsMissed.push(c);
      if (s.coinsMissed.length > 30) s.coinsMissed.shift();
      continue;
    }
    c.taken = true;
    s.coinsTaken++;
    s.bonus += c.air ? s.coinValue * 3 : s.coinValue;
    ev.push({ t: 'coin', c });
  }

  if (s.obstacles.length > 40) s.obstacles = s.obstacles.filter((o) => o.x + o.w > s.dist - 1200);

  s.tick++;
  s.meters = Math.floor(s.dist / PX_PER_METER);
  s.score = s.meters + s.bonus;
  if (s.alive && s.dist >= s.goalX) {
    s.alive = false;
    s.finished = true;
    s.deathBy = 'escape';
    s.bonus += s.finishBonus;
    s.score = s.meters + s.bonus;
    ev.push({ t: 'finish' });
  }
  if (s.tick >= MAX_TICKS && s.alive) {
    s.alive = false;
    s.deathBy = 'tiempo';
    ev.push({ t: 'death', o: null });
  }
  return ev;
}

export function summary(s) {
  return {
    score: s.score,
    meters: s.meters,
    coins: s.coinsTaken,
    passed: s.passed,
    limits: s.limits,
    maxCombo: s.maxCombo,
    stars: s.stars,
    ticks: s.tick,
    deathBy: s.deathBy,
    finished: s.finished,
  };
}

// Comprueba que la lista de pulsaciones que llega del cliente está bien formada ANTES de repetirla:
// enteros, ticks estrictamente crecientes y dentro de la partida, acción 1..3, tamaño acotado.
export function validateInputs(inputs) {
  if (!Array.isArray(inputs)) return 'inputs no es una lista';
  if (inputs.length > MAX_TICKS) return 'demasiadas pulsaciones';
  let prev = -1;
  for (const v of inputs) {
    if (!Number.isInteger(v) || v < 0) return 'pulsación no entera';
    const tick = Math.floor(v / 4);
    const act = v % 4;
    if (act < 1 || tick >= MAX_TICKS) return 'pulsación fuera de rango';
    if (tick <= prev) return 'ticks desordenados o repetidos';
    prev = tick;
  }
  return null;
}

// Repite una partida entera a partir de la semilla y las pulsaciones. Para el servidor.
// inputs: lista de tick * 4 + acción, en orden. El servidor monta `cfg` él mismo (dailyConfig de
// api.js para el diario): NUNCA se acepta seed/district/modifier del cliente.
// Devuelve el resumen con `valid` = false si la lista es inválida o sobran pulsaciones tras el final.
export function simulate(cfg, inputs) {
  const bad = validateInputs(inputs);
  if (bad) return { valid: false, reason: bad };
  const s = createSim(cfg);
  let i = 0;
  while (s.alive) {
    let act = 0;
    if (i < inputs.length && inputs[i] >> 2 === s.tick) act = inputs[i++] & 3;
    step(s, act);
  }
  if (i < inputs.length) return { valid: false, reason: 'pulsaciones después del final' };
  return { valid: true, ...summary(s) };
}

// Bot de referencia (menú de fondo y pruebas): salta centrado y dispara a `shootLead` px.
export function botAction(s, shootLead = 260) {
  let act = 0;
  if (s.tick >= s.shotReadyAt) {
    const t = s.obstacles.find((o) => o.need === 'B' && !o.cleared && !o.touched);
    if (t) {
      const lead = t.x - (s.dist + PLAYER_HALF);
      if (lead > 0 && lead <= Math.min(shootLead, SHOT_RANGE)) act |= ACT_B;
    }
  }
  if (s.tick >= s.canJumpAt && !isAirborne(s)) {
    const t = s.obstacles.find((o) => o.need === 'A' && !o.touched);
    if (t) {
      const lead = t.x - (s.dist + PLAYER_HALF);
      if (lead <= jumpSlack(t.w, s.jumpPx) && lead > -t.w) act |= ACT_A;
    }
  }
  return act;
}
