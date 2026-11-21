// Paradas de la ruta (datos puros, los usa la simulación y el dibujo).
// Coordenadas en el espacio lógico de 960 x 540 de cada parada.
//   rise:   el enemigo asoma por encima de una cobertura cuyo borde superior está en y
//   window: asoma dentro de una ventana (se recorta al rectángulo `clip`)
// s = escala del enemigo (profundidad). quota = bajas para pasar a la siguiente parada.

export const STOPS = [
  {
    id: 'ocean',
    name: 'Ocean Drive',
    quota: 6,
    maxActive: 2,
    aim: [110, 145],
    kinds: { dodge: 3, peep: 2, rugpull: 1, clown: 1, civ: 1 },
    // sobre el fondo de ChatGPT (bg_ocean): muro VICE BEACH, muro bajo del fondo, quiosco, macetero
    spots: [
      { x: 187, y: 278, s: 1.15, type: 'rise' },
      { x: 470, y: 276, s: 0.6, type: 'rise' },
      { x: 781, y: 264, s: 0.9, type: 'rise' },
      { x: 912, y: 318, s: 0.85, type: 'rise' },
    ],
  },
  {
    id: 'alley',
    name: 'Back Alley',
    quota: 8,
    maxActive: 3,
    aim: [95, 125],
    kinds: { dodge: 1, peep: 1, waf: 1, popkat: 1, rugpull: 2, bear: 1, agent: 1, bug: 1, civ: 1 },
    // contenedor, cajas y dos puntos del muro del fondo. (Las ventanas de arriba se quitaron:
    // son demasiado estrechas para las mascotas y quedan debajo del marcador.)
    spots: [
      { x: 150, y: 290, s: 1.1, type: 'rise' },
      { x: 856, y: 236, s: 1.05, type: 'rise' },
      { x: 448, y: 299, s: 0.5, type: 'rise' },
      { x: 566, y: 299, s: 0.5, type: 'rise' },
    ],
  },
  {
    id: 'gas',
    name: 'GRAND Gas',
    quota: 10,
    maxActive: 3,
    aim: [80, 110],
    kinds: { dodge: 1, peep: 1, popkat: 1, merc: 2, clown: 1, shark: 1, robot: 1, bear: 1, civ: 1 },
    // murete del fondo (dos puntos), detrás del coche, escaparate grande, escaparate pequeño.
    // (Entre los surtidores se quitó: el hueco es más estrecho que una mascota.)
    spots: [
      { x: 290, y: 310, s: 0.48, type: 'rise' },
      { x: 690, y: 310, s: 0.48, type: 'rise' },
      { x: 880, y: 287, s: 0.85, type: 'rise' },
      { x: 47, y: 330, s: 0.72, type: 'window', clip: [10, 200, 74, 130] },
      { x: 169, y: 321, s: 0.6, type: 'window', clip: [127, 236, 85, 85] },
    ],
  },
  {
    id: 'port',
    name: 'Port of Vice',
    boss: true,
    quota: 0,
    maxActive: 1,
    aim: [90, 120],
    kinds: { robot: 1, merc: 1, shark: 1 },
    spots: [
      { x: 190, y: 273, s: 0.62, type: 'rise' },
      { x: 790, y: 273, s: 0.62, type: 'rise' },
    ],
    bossY: 273, // borde superior de la fila de contenedores tras la que asoma el jefe
  },
];
