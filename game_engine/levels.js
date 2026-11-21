// Los niveles del juego unificado: un tramo de runner (Dúo) que acaba en un sitio y el asalto a ese
// sitio (shooter por salas) que acaba en un jefe. El nivel 5 es solo runner: la huida en el jet.
// Datos puros: los usan la simulación (campaign.js) y el dibujo.

// ---------------------------------------------------------------- salas del asalto
// Coordenadas en el espacio 960 x 540. Cada `spot` es donde asoma un enemigo (borde superior de una
// cobertura); cada cobertura de `covers` tapa a los que asoman detrás. Mientras no haya imágenes se
// dibujan por código con esos rectángulos.

function door(id, title, look, diff, kinds) {
  return {
    id,
    name: title,
    quota: 6 + diff,
    maxActive: 2,
    aim: [110 - diff * 6, 145 - diff * 6],
    kinds,
    spots: [
      { x: 190, y: 300, s: 1.0, type: 'rise' },
      { x: 800, y: 290, s: 0.9, type: 'rise' },
      { x: 480, y: 250, s: 0.55, type: 'rise' },
    ],
    room: { ...look, title, covers: [{ r: [40, 300, 300, 140] }, { r: [700, 290, 200, 150] }, { r: [410, 250, 140, 40] }] },
  };
}

function corridor(id, title, look, diff, kinds) {
  return {
    id,
    name: title,
    quota: 8 + diff,
    maxActive: 3,
    aim: [95 - diff * 5, 125 - diff * 5],
    kinds,
    spots: [
      { x: 150, y: 320, s: 1.1, type: 'rise' },
      { x: 845, y: 270, s: 0.95, type: 'rise' },
      { x: 480, y: 240, s: 0.5, type: 'rise' },
      { x: 650, y: 285, s: 0.7, type: 'rise' },
    ],
    room: {
      ...look,
      title,
      covers: [{ r: [0, 320, 290, 130] }, { r: [755, 270, 180, 170] }, { r: [430, 240, 100, 36] }, { r: [595, 285, 110, 70] }],
    },
  };
}

function hall(id, title, look, diff, kinds) {
  return {
    id,
    name: title,
    quota: 10 + diff,
    maxActive: 3,
    aim: [80 - diff * 4, 110 - diff * 4],
    kinds,
    spots: [
      { x: 180, y: 330, s: 1.1, type: 'rise' },
      { x: 720, y: 300, s: 0.9, type: 'rise' },
      { x: 880, y: 300, s: 0.9, type: 'rise' },
      { x: 480, y: 290, s: 0.6, type: 'rise' },
    ],
    room: {
      ...look,
      title,
      covers: [{ r: [60, 330, 250, 120] }, { r: [630, 300, 330, 140] }, { r: [380, 290, 200, 40] }],
    },
  };
}

function office(id, title, look, diff, kinds, boss) {
  return {
    id,
    name: title,
    boss: true,
    bossKind: boss,
    quota: 0,
    maxActive: 1,
    aim: [90 - diff * 4, 120 - diff * 4],
    kinds,
    spots: [
      { x: 150, y: 300, s: 0.7, type: 'rise' },
      { x: 810, y: 300, s: 0.7, type: 'rise' },
    ],
    bossY: 300,
    room: {
      ...look,
      title,
      covers: [{ r: [300, 300, 360, 150], label: '' }, { r: [60, 300, 180, 90] }, { r: [720, 300, 180, 90] }],
    },
  };
}

// aspecto de cada sitio (dibujo provisional)
const CLUB = { top: '#1a0620', wall: '#3a0d3f', floorTop: '#2a0a2e', floorBottom: '#120414', neon: '#ff2d85', cover: '#5a1747' };
const HOOD = { top: '#1d1410', wall: '#3b2a1c', floorTop: '#2b2018', floorBottom: '#120c08', neon: '#7fd85b', cover: '#4a3a2a' };
const CASINO = { top: '#2a1a05', wall: '#5a3a08', floorTop: '#3a0b0b', floorBottom: '#1a0505', neon: '#ffd23f', cover: '#7a5410' };
const HANGAR = { top: '#0a1424', wall: '#1b2f4a', floorTop: '#1a2230', floorBottom: '#0a0e16', neon: '#22e5ff', cover: '#3a4a60' };

// enemigos de cada sitio (de momento los de Meme Wars; cambian cuando llegue el arte nuevo)
const K1 = { chad: 3, dogemob: 3, civ: 1 }; // Gigachad portero y Doge mafioso (arte de ChatGPT)
const K2 = { pepe: 3, wojak: 3, civ: 1 }; // Pepe y Wojak pandilleros (arte de ChatGPT)
const K3 = { stonks: 3, grumpy: 3, civ: 1 }; // crupier Stonks y Grumpy Cat (arte de ChatGPT)
const K4 = { robot: 2, dogenaut: 3, civ: 1 }; // robot (dos tiros) y Doge astronauta

// ---------------------------------------------------------------- niveles

export const LEVELS = [
  {
    id: 'l1',
    name: 'Vice Beach',
    run: {
      district: 'playa',
      goalM: 1100,
      minStars: 1,
      starDist: [0, 11000],
      finishBonus: 1500,
      pickupChance: 0.22,
      bg: 'l1', // fondo de ChatGPT (assets/bg/l1_run.jpg)
      dest: { id: 'l1', name: 'THE PINK PUSSYCAT', color: '#ff2d85', door: 0.278, floor: 0.8 },
      weights: {
        A: { barrera: 2, patrulla: 2, borracho: 2, perritos: 2, flamencos: 1 },
        B: { pandillero: 2, maton: 3, bidones: 1 },
      },
    },
    assault: {
      name: 'The Pink Pussycat',
      // salas con el arte de ChatGPT: los puntos de aparición están medidos sobre cada imagen
      // (tools/cut_vice_art.py recorta las coberturas con los mismos polígonos)
      stops: [
        {
          id: 'l1_asalto_1_puerta',
          name: 'THE PINK PUSSYCAT',
          quota: 6,
          maxActive: 2,
          aim: [110, 145],
          kinds: K1,
          spots: [
            { x: 312, y: 110, s: 0.5, type: 'rise', clip: [230, 0, 164, 144] }, // en el tejado, tras el pretil (izquierda); el recorte evita que se vea subir/caer por la pared
            { x: 737, y: 140, s: 0.5, type: 'rise', clip: [655, 0, 164, 160] }, // en el tejado, tras el pretil (derecha)
            { x: 892, y: 292, s: 0.8, type: 'rise', clip: [800, 0, 160, 300] }, // detrás del contenedor, en la parte alta de la tapa
            { x: 305, y: 305, s: 0.5, type: 'window', clip: [244, 198, 122, 107] }, // ventana grande
            { x: 685, y: 310, s: 0.5, type: 'window', clip: [642, 214, 86, 96] }, // ventana de la derecha
            { x: 500, y: 362, s: 0.5, type: 'door', body: true, from: -1, clip: [462, 222, 78, 142] }, // sale por la puerta (cuerpo entero)
          ],
          room: { ...CLUB, title: 'THE PINK PUSSYCAT', covers: [{ r: [0, 234, 340, 306] }, { r: [756, 290, 204, 250] }] },
        },
        {
          id: 'l1_asalto_2_pasillo',
          name: 'VIP ONLY',
          quota: 8,
          maxActive: 3,
          aim: [95, 125],
          kinds: K1,
          spots: [
            { x: 160, y: 256, s: 1.1, type: 'rise' }, // detrás del sillón
            { x: 866, y: 214, s: 1.0, type: 'rise' }, // detrás del altavoz
            { x: 485, y: 287, s: 0.45, type: 'door', body: true, from: -1, clip: [454, 122, 62, 166] }, // puerta del fondo (recortado al hueco: la hoja abierta de la derecha le tapa)
            { x: 736, y: 370, s: 0.95, type: 'door', body: true, from: -1, clip: [705, 52, 63, 320] }, // tras la cortina de cuentas (asoma desde el borde izquierdo: en espejo, el SECURITY de la camiseta salía al revés)
          ],
          room: { ...CLUB, title: 'VIP ONLY', covers: [{ r: [0, 224, 330, 316] }, { r: [770, 186, 190, 354] }] },
        },
        {
          id: 'l1_asalto_3_sala',
          name: 'LIVE SHOWS',
          quota: 10,
          maxActive: 3,
          aim: [80, 110],
          kinds: K1,
          spots: [
            { x: 155, y: 335, s: 0.85, type: 'rise' }, // detrás de la mesa volcada (más hundido: la mesa es redonda)
            { x: 750, y: 282, s: 0.66, type: 'rise' }, // detrás de la barra
            { x: 885, y: 280, s: 0.7, type: 'rise' }, // detrás de la barra (al fondo)
            { x: 375, y: 250, s: 0.56, type: 'stand', body: true, from: -1 }, // de pie en el escenario
          ],
          room: { ...CLUB, title: 'LIVE SHOWS', covers: [{ r: [60, 298, 200, 240] }, { r: [622, 255, 338, 285] }, { r: [196, 246, 388, 36] }] },
        },
        {
          id: 'l1_asalto_4_despacho',
          name: 'EL CHULO',
          boss: true,
          bossKind: 'chulo',
          quota: 0,
          maxActive: 1,
          aim: [90, 120],
          kinds: { chad: 1, dogemob: 1 },
          // sin ayudantes: en el despacho no hay dónde esconderse de forma creíble (sofá y caja fuerte
          // dejaban ver el corte de la cintura). El duelo es solo contra El Chulo y sus botellas.
          spots: [],
          bossY: 226, // borde de atrás del escritorio (fila 458 × 0,625 − 60 − 2); despacho por capas
          room: { ...CLUB, title: 'EL CHULO', covers: [{ r: [191, 236, 581, 143] }, { r: [0, 225, 154, 190] }, { r: [781, 291, 179, 100] }] },
        },
      ],
    },
  },
  {
    id: 'l2',
    name: 'El Barrio',
    run: {
      district: 'centro',
      goalM: 1200,
      minStars: 2,
      starDist: [0, 0, 12000],
      finishBonus: 2000,
      pickupChance: 0.16,
      reactMul: 0.95,
      bg: 'l2', // fondo de ChatGPT (assets/bg/l2_run.jpg)
      dest: { id: 'l2', name: 'LA CASA', color: '#7fd85b', door: 0.53, floor: 0.83, path: [[0.6, 0.83], [0.575, 0.72], [0.53, 0.62]] }, // acera → camino → escalones → puerta
      weights: {
        A: { fuego: 2, lowrider: 2, carrito: 2, patrulla: 1 },
        B: { banda: 3, poli: 2, driveby: 1 },
      },
    },
    assault: {
      name: 'La casa de la banda',
      // salas con el arte de ChatGPT: puntos medidos sobre cada imagen (coberturas en tools/cut_vice_art.py).
      // (y en pantalla = fila de la imagen × 0,625 − 60: la imagen se dibuja subida 60 px).
      // Pepe y Wojak solo tienen medio cuerpo: siempre asoman tras algo, nunca por una puerta
      stops: [
        {
          id: 'l2_asalto_1_callejon',
          name: 'EL CALLEJÓN',
          quota: 7,
          maxActive: 2,
          aim: [101, 136],
          kinds: K2,
          spots: [
            { x: 250, y: 316, s: 0.85, type: 'rise' }, // detrás del capó del lowrider (hundido: la cintura bajo el borde del capó)
            { x: 369, y: 308, s: 0.35, type: 'rise', clip: [345, 0, 48, 358] }, // detrás del cubo de basura del fondo
            { x: 806, y: 293, s: 0.9, type: 'rise' }, // detrás de los neumáticos
            { x: 711, y: 79, s: 0.42, type: 'window', clip: [678, -16, 66, 95] }, // ventana de la persiana rota
          ],
          room: { ...HOOD, title: 'EL CALLEJÓN', covers: [{ r: [0, 380, 342, 160] }, { r: [700, 350, 260, 190] }] },
        },
        {
          id: 'l2_asalto_2_patio',
          name: 'EL PATIO',
          quota: 9,
          maxActive: 3,
          aim: [87, 117],
          kinds: K2,
          spots: [
            { x: 95, y: 171, s: 1.0, type: 'rise' }, // detrás del sofá de lado
            { x: 307, y: 164, s: 0.5, type: 'rise', clip: [262, 0, 90, 200] }, // pegado detrás de la caja grande de encima de los palés (no del barril, que es más bajo)
            { x: 737, y: 98, s: 0.42, type: 'rise', clip: [685, 0, 105, 86] }, // asoma por encima del tejado de la caseta
            { x: 453, y: 199, s: 0.26, type: 'door', body: true, from: -1, clip: [439, 128, 29, 71] }, // sale de pie por la puerta de la casa (hueco: cols 703-748, filas 307-415 de la imagen)
          ],
          room: { ...HOOD, title: 'EL PATIO', covers: [{ r: [0, 174, 200, 366] }, { r: [188, 149, 245, 202] }, { r: [661, 163, 299, 220] }] },
        },
        {
          id: 'l2_asalto_3_salon',
          name: 'EL SALÓN',
          quota: 11,
          maxActive: 3, // sofá, barra (dos sitios) e isla de la cocina
          aim: [74, 104],
          kinds: K2,
          spots: [
            { x: 169, y: 200, s: 1.0, type: 'rise' }, // detrás del sofá volcado
            { x: 420, y: 160, s: 0.6, type: 'rise' }, // detrás de la barra del fondo, lado derecho
            { x: 300, y: 160, s: 0.6, type: 'rise', clip: [259, 0, 235, 400] }, // detrás de la barra, lado izquierdo (por encima del sofá)
            { x: 645, y: 190, s: 0.8, type: 'rise', clip: [581, 0, 160, 260] }, // detrás de la isla de la cocina, tras las cervezas
          ],
          room: { ...HOOD, title: 'EL SALÓN', covers: [{ r: [0, 200, 350, 340] }, { r: [259, 159, 235, 188] }, { r: [580, 201, 255, 339] }] },
        },
        {
          id: 'l2_asalto_4_sotano',
          name: 'LOS GEMELOS',
          boss: true,
          bossKind: 'gemelos',
          quota: 0,
          maxActive: 1,
          aim: [84, 114],
          kinds: { pepe: 1, wojak: 1 },
          // solo los gemelos, uno tras cada mesa (si tumbas a uno, tienes 3 s para tumbar al otro)
          spots: [],
          bossY: 254, // borde de los mostradores (sótano por capas: sala vacía + objetos sacados de la sala llena)
          room: { ...HOOD, title: 'LOS GEMELOS', covers: [{ r: [0, 289, 960, 251] }] },
        },
      ],
    },
  },
  {
    id: 'l3',
    name: 'Downtown',
    run: {
      district: 'centro',
      goalM: 1300,
      minStars: 3,
      starDist: [0, 0, 0, 13000],
      finishBonus: 2500,
      pickupChance: 0.12,
      reactMul: 0.88,
      jumpPx: 315,
      bg: 'l3',
      dest: { id: 'l3', name: 'TRUMP TOWER CASINO', color: '#ffd23f', door: 0.52, floor: 0.87 },
      weights: {
        A: { patrulla: 2, limo: 2, taxi: 2, valla: 2, suv: 1 },
        B: { swat: 3, dron3: 3, bidones: 1 },
      },
    },
    assault: {
      name: 'Trump Tower Casino',
      rescue: 'macca', // en el despacho está Macca enjaulado: al ganar, te da una moneda con la cara de Trump
      stops: [
        // salas con el arte de ChatGPT (y en pantalla = fila de la imagen × 0,625 − 60)
        {
          id: 'l3_asalto_1_vestibulo', name: 'LOBBY', quota: 9, maxActive: 3, aim: [92, 127], kinds: K3,
          coin: [480, 132, 124], // moneda gigante de Trump girando delante de la cascada (decorado, no se le dispara)
          // v2 (19 oct): 4 coberturas de frente con el borde recto (fila 524 de la imagen)
          spots: [
            { x: 137, y: 272, s: 0.62, type: 'rise', clip: [16, 0, 244, 330] }, // detrás del mostrador de recepción
            { x: 595, y: 274, s: 0.55, type: 'rise', clip: [528, 0, 135, 330] }, // detrás del cartel del cordón
            { x: 836, y: 272, s: 0.62, type: 'rise', clip: [729, 0, 215, 330] }, // detrás del mostrador de la caja
            { x: 727, y: 97, s: 0.21, type: 'stand', body: true, from: -1, clip: [697, 0, 62, 96] }, // de pie en el balcón del fondo (la barandilla es de cristal: se le ven las piernas)
          ],
          room: { ...CASINO, title: 'LOBBY', covers: [{ r: [16, 267, 244, 140] }, { r: [285, 267, 162, 140] }, { r: [528, 267, 135, 140] }, { r: [729, 267, 215, 140] }] },
        },
        {
          id: 'l3_asalto_2_casino', name: 'JACKPOT', quota: 10, maxActive: 3, aim: [81, 113], kinds: K3,
          // v2 (19 oct): blackjack, mostrador y mampara de frente; dos puertas al fondo (de pie)
          spots: [
            { x: 200, y: 249, s: 0.95, type: 'rise', clip: [0, 0, 403, 330] }, // detrás de la mesa de blackjack
            { x: 481, y: 201, s: 0.6, type: 'rise', clip: [262, 0, 438, 194] }, // detrás del mostrador del fondo (lo tapa su recorte, no una capa: la capa tapaba también a los de delante)
            { x: 835, y: 234, s: 0.85, type: 'rise', clip: [711, 0, 249, 330] }, // detrás de la mampara
            { x: 376, y: 215, s: 0.31, type: 'door', body: true, noPeek: true, from: -1, clip: [343, 108, 66, 86] }, // puerta del fondo (izquierda)
            { x: 586, y: 215, s: 0.31, type: 'door', body: true, noPeek: true, from: -1, clip: [552, 108, 68, 86] }, // puerta del fondo (derecha)
          ],
          room: { ...CASINO, title: 'JACKPOT', covers: [{ r: [0, 254, 403, 210] }, { r: [262, 193, 438, 130] }, { r: [711, 239, 249, 240] }] },
        },
        {
          id: 'l3_asalto_3_atico', name: 'PENTHOUSE', quota: 11, maxActive: 3, aim: [74, 104], kinds: K3,
          // v3 (19 oct): antesala del despacho; 4 coberturas de frente con hueco detrás y la puerta del fondo
          spots: [
            { x: 330, y: 257, s: 0.48, type: 'rise', clip: [190, 0, 216, 320] }, // detrás del sofá rojo
            { x: 664, y: 267, s: 0.45, type: 'rise', clip: [597, 0, 134, 320] }, // detrás del aparador dorado
            { x: 831, y: 280, s: 0.85, type: 'rise', clip: [705, 0, 255, 340] }, // detrás de la barra de mármol
            { x: 240, y: 77, s: 0.3, type: 'rise' }, // en el balcón de arriba (izquierda), tras la barandilla
            { x: 720, y: 77, s: 0.3, type: 'rise' }, // en el balcón de arriba (derecha), tras la barandilla
            { x: 481, y: 311, s: 0.52, type: 'door', body: true, noPeek: true, from: -1, clip: [425, 99, 112, 222] }, // de pie en la puerta del despacho
          ],
          room: { ...CASINO, title: 'PENTHOUSE', covers: [{ r: [0, 277, 265, 263] }, { r: [184, 245, 222, 155] }, { r: [597, 256, 134, 116] }, { r: [705, 277, 255, 263] }] },
        },
        {
          id: 'l3_asalto_4_despacho', name: 'MMGA', motto: 'MAKE MEMES GREAT AGAIN', boss: true, bossKind: 'trump', quota: 0, maxActive: 1, aim: [78, 108], // motto: el lema, junto a la barra de vida y cuando grita al micro
          kinds: { stonks: 1, grumpy: 1 },
          spots: [],
          bossY: 293, // borde de atrás del escritorio (fila 568 × 0,625 − 60 − 2); despacho por capas
          shoutLift: 52, // al gritar se levanta: que se vea la camiseta MMGA por encima del escritorio
          room: { ...CASINO, title: 'MMGA', covers: [{ r: [88, 304, 790, 236] }] },
        },
      ],
    },
  },
  {
    id: 'l4',
    name: 'El Puerto',
    run: {
      oneUp: true, // vida extra escondida: solo en el nivel 4 (29 oct, cliente)
      district: 'playa',
      goalM: 1400,
      minStars: 4,
      starDist: [0, 0, 0, 0, 14000],
      finishBonus: 3000,
      pickupChance: 0.1,
      reactMul: 0.76,
      jumpPx: 275,
      bg: 'l4',
      dest: { id: 'l4', name: 'X HANGAR', color: '#22e5ff', door: 0.66, floor: 0.83 },
      weights: {
        A: { montacargas: 2, cajas: 2, cyber: 2, patrulla: 1 },
        B: { escopeta: 3, robot: 2, blindado: 1 },
      },
    },
    assault: {
      name: 'El hangar de cohetes',
      reward: 'musk', // al tumbar al jefe, Musk (rehén, no jefe: lo pidió el cliente) te da una bolsa de monedas
      stops: [
        {
          id: 'l4_asalto_1_muelle', name: 'EL MUELLE', quota: 9, maxActive: 2, aim: [88, 123], kinds: K4,
          spots: [
            { x: 160, y: 303, s: 1.0, type: 'rise', clip: [0, 0, 320, 400] }, // detrás del contenedor
            { x: 890, y: 238, s: 0.6, type: 'rise', clip: [805, 0, 155, 300] }, // detrás de las cajas apiladas
            { x: 762, y: 290, s: 0.45, type: 'rise', clip: [715, 0, 98, 330] }, // detrás de las cajas bajas del fondo (derecha)
          ],
          room: { ...HANGAR, title: 'EL MUELLE', covers: [{ r: [0, 303, 320, 237] }, { r: [730, 230, 230, 310] }] },
        },
        {
          id: 'l4_asalto_2_almacen', name: 'ALMACÉN', quota: 10, maxActive: 3, aim: [76, 106], kinds: K4,
          // v2 (19 oct): banco de trabajo y cajas de frente; dos puertas laterales (de pie)
          spots: [
            { x: 387, y: 307, s: 0.6, type: 'rise', clip: [288, 0, 386, 350] }, // detrás del banco (izquierda)
            { x: 575, y: 307, s: 0.6, type: 'rise', clip: [288, 0, 386, 350] }, // detrás del banco (derecha)
            { x: 866, y: 283, s: 0.66, type: 'rise', clip: [772, 0, 188, 330] }, // detrás de las cajas
            { x: 98, y: 176, s: 0.62, type: 'rise', clip: [0, 0, 188, 190] }, // encima de la pila de cajas de la izquierda
            { x: 232, y: 318, s: 0.31, type: 'door', body: true, from: -1, clip: [208, 222, 48, 100] }, // puerta lateral izquierda
            { x: 722, y: 318, s: 0.31, type: 'door', body: true, from: 1, clip: [698, 222, 48, 100] }, // puerta lateral derecha
          ],
          room: { ...HANGAR, title: 'ALMACÉN', covers: [{ r: [288, 299, 386, 180] }, { r: [772, 274, 188, 266] }] },
        },
        {
          id: 'l4_asalto_3_hangar', name: 'HANGAR', quota: 10, maxActive: 3, aim: [70, 98], kinds: K4,
          // v2 (19 oct): tanques y consola de frente; dos puertas laterales (de pie)
          spots: [
            { x: 406, y: 313, s: 0.6, type: 'rise', clip: [319, 0, 323, 360] }, // detrás de los tanques (izquierda)
            { x: 556, y: 317, s: 0.6, type: 'rise', clip: [319, 0, 323, 360] }, // detrás de los tanques (derecha)
            { x: 819, y: 313, s: 0.66, type: 'rise', clip: [698, 0, 245, 360] }, // detrás de la consola
            { x: 63, y: 330, s: 0.34, type: 'door', body: true, from: -1, clip: [39, 226, 49, 104] }, // puerta izquierda (la camioneta le tapa las piernas)
            { x: 897, y: 330, s: 0.34, type: 'door', body: true, from: 1, clip: [875, 227, 46, 103] }, // puerta derecha (la consola le tapa las piernas)
            { x: 219, y: 128, s: 0.2, type: 'stand', body: true, from: -1, clip: [191, 60, 56, 70] }, // de pie en el balcón de arriba (izquierda), tras la barandilla
            { x: 742, y: 128, s: 0.2, type: 'stand', body: true, from: -1, clip: [713, 60, 58, 70] }, // de pie en el balcón de arriba (derecha), tras la barandilla
            { x: 120, y: 292, s: 0.5, type: 'rise', clip: [92, 0, 58, 300] }, // detrás del techo de la camioneta
          ],
          room: { ...HANGAR, title: 'HANGAR', covers: [{ r: [319, 304, 323, 180] }, { r: [698, 313, 262, 227] }] },
        },
        {
          id: 'l4_asalto_4_control', name: 'EL DORADO', boss: true, bossKind: 'musk', quota: 0, maxActive: 1, aim: [72, 100],
          kinds: { robot: 1, dogenaut: 1 },
          spots: [],
          bossY: 268, // borde de atrás de la consola (fila 528 × 0,625 − 60 − 2); sala por capas
          room: { ...HANGAR, title: 'EL DORADO', covers: [{ r: [0, 270, 960, 270] }] },
        },
      ],
    },
  },
  {
    id: 'l5',
    name: 'Huida al aeropuerto',
    run: {
      district: 'centro',
      goalM: 1500,
      minStars: 5,
      starDist: [0, 0, 0, 0, 0],
      finishBonus: 10000,
      pickupChance: 0.08,
      reactMul: 0.7,
      jumpPx: 258,
      bg: 'l5',
      dest: { id: 'airport' },
      weights: {
        A: { pinchos: 2, maletas: 2, patrulla: 3, moto: 1 }, // sin el control de dos coches (20 oct: era demasiado largo para saltarlo y mataba)
        B: { soldado: 3, swatk: 2, tanque: 2 }, // sin helicópteros (no gustan): SWAT de rodillas
      },
    },
    assault: null,
  },
];

// cada punto de aparición sabe de qué nivel es (para dibujar los civiles de ese sitio)
for (const lv of LEVELS) for (const st of (lv.assault && lv.assault.stops) || []) for (const sp of st.spots || []) sp.lv = lv.id;
