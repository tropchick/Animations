// Original brushwork for the small panes and signboards. Coordinates are in paint pixels.
// No fonts, image downloads or asynchronously loaded assets enter the render path.
import {CanvasTexture, SRGBColorSpace} from 'three';
import {seededRandom} from './timing';

export type Shop = 'post' | 'bakery' | 'florist';
type Brush = CanvasRenderingContext2D;
export const shopPigments = {
  post: {wall: '#ddb89c', frame: '#356665', dark: '#294f54', trim: '#f7d9a7', roof: '#647c85', word: 'POSTES'},
  bakery: {wall: '#edc384', frame: '#a35141', dark: '#83463c', trim: '#f6dcaa', roof: '#965d53', word: 'PAIN'},
  florist: {
    wall: '#c1ccae',
    frame: '#5c7980',
    dark: '#46636b',
    trim: '#f7dab3',
    roof: '#897179',
    word: 'FLEURS',
  },
} as const;

function ellipse(c: Brush, x: number, y: number, rx: number, ry: number, color: string, tilt = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, tilt, 0, Math.PI * 2);
  c.fill();
}

// Simple one-stroke sign painter's alphabet. A physical sign remains legible at a grazing angle.
const letters: Record<string, number[][]> = {
  A: [
    [0, 8, 3, 0, 6, 8],
    [1, 5, 5, 5],
  ],
  E: [
    [6, 0, 0, 0, 0, 8, 6, 8],
    [0, 4, 4, 4],
  ],
  F: [
    [6, 0, 0, 0, 0, 8],
    [0, 4, 4, 4],
  ],
  I: [
    [1, 0, 5, 0],
    [3, 0, 3, 8],
    [1, 8, 5, 8],
  ],
  L: [[0, 0, 0, 8, 6, 8]],
  N: [[0, 8, 0, 0, 6, 8, 6, 0]],
  O: [[1, 0, 5, 0, 6, 2, 6, 6, 5, 8, 1, 8, 0, 6, 0, 2, 1, 0]],
  P: [[0, 8, 0, 0, 4.8, 0, 6, 1.4, 6, 3.4, 4.7, 4.7, 0, 4.7]],
  R: [
    [0, 8, 0, 0, 4.8, 0, 6, 1.4, 6, 3.4, 4.7, 4.7, 0, 4.7],
    [3.1, 4.7, 6, 8],
  ],
  S: [[6, 1, 4.8, 0, 1.6, 0, 0, 1.6, 0.3, 3, 5.4, 5, 6, 6.6, 4.5, 8, 1.3, 8, 0, 7]],
  T: [
    [0, 0, 6, 0],
    [3, 0, 3, 8],
  ],
  U: [[0, 0, 0, 6.3, 1.4, 8, 4.6, 8, 6, 6.3, 6, 0]],
};

export function shopPainting(shop: Shop, panel: 'sign' | 'upstairs' | 'display' | 'door', seed: number) {
  const canvas = document.createElement('canvas');
  const sign = panel === 'sign';
  canvas.width = sign ? 512 : 256;
  canvas.height = sign ? 96 : 256;
  const c = canvas.getContext('2d')!;
  const {frame, dark, trim, word} = shopPigments[shop];
  const w = canvas.width,
    h = canvas.height;
  c.fillStyle = dark;
  c.fillRect(0, 0, w, h);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  if (sign) {
    c.strokeStyle = trim;
    c.lineWidth = 2;
    c.strokeRect(7, 8, w - 14, h - 16);
    const scale = 5.5,
      spacing = 10.4;
    const left = (w - ((word.length - 1) * spacing + 6) * scale) / 2;
    c.save();
    c.translate(left, 26);
    c.scale(scale, scale);
    c.lineWidth = 0.86;
    for (const [i, letter] of [...word].entries()) {
      for (const stroke of letters[letter]) {
        c.beginPath();
        for (let k = 0; k < stroke.length; k += 2) {
          const x = i * spacing + stroke[k],
            y = stroke[k + 1] + 0.18 * Math.sin(i);
          if (k === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
      }
    }
    c.restore();
    for (const x of [38, w - 38]) {
      ellipse(c, x, h / 2, 7, 2.6, trim);
      ellipse(c, x, h / 2, 2.6, 7, trim);
    }
  } else {
    // Glazing is painted in three values, with the room behind the glass darker at its ceiling.
    const glass = c.createLinearGradient(0, 15, 120, h);
    glass.addColorStop(0, '#354e53');
    glass.addColorStop(0.53, '#668286');
    glass.addColorStop(1, '#a8a18c');
    c.fillStyle = glass;
    c.fillRect(9, 8, w - 18, h - 16);
    c.fillStyle = '#f2dcb2';
    c.beginPath();
    c.moveTo(9, 9);
    c.lineTo(w - 9, 9);
    c.quadraticCurveTo(w - 21, 54, w - 55, 77);
    c.quadraticCurveTo(w - 24, 119, w - 16, 190);
    c.lineTo(w - 9, h - 8);
    c.lineTo(w - 9, 9);
    c.lineTo(9, 9);
    c.lineTo(9, h - 8);
    c.quadraticCurveTo(18, 110, 45, 78);
    c.quadraticCurveTo(17, 52, 9, 9);
    c.fill();
    if (panel === 'display') {
      for (const shelf of [135, 211]) {
        for (let i = 0; i < 7; i++) {
          const j = seededRandom(seed + shelf, i);
          const x = 24 + 32 * i,
            y = shelf - 5;
          if (shop === 'bakery') {
            ellipse(c, x, y - 9, 14, 8 + j * 7, '#d9a168', -0.22);
            ellipse(c, x - 3, y - 12, 1.4, 7, '#f3d6a3', -0.5);
          } else if (shop === 'florist') {
            c.fillStyle = '#ae7257';
            c.fillRect(x - 9, y - 17, 18, 17);
            for (let p = 0; p < 3; p++)
              ellipse(
                c,
                x + 6 * Math.cos(p * 2),
                y - 23 - 6 * Math.sin(p * 2),
                6,
                10,
                ['#e2b45b', '#b8777e', '#749579'][i % 3],
                p,
              );
          } else {
            c.fillStyle = i % 2 ? '#c19b73' : '#ead9ad';
            c.fillRect(x - 14, y - 17 - j * 12, 29, 18 + j * 12);
            c.fillStyle = '#8f6952';
            c.fillRect(x - 1, y - 17 - j * 12, 2, 18 + j * 12);
          }
        }
        c.fillStyle = dark;
        c.fillRect(8, shelf, w - 16, 7);
      }
    }
    c.fillStyle = frame;
    c.fillRect(123, 6, 10, h - 12);
    c.fillRect(6, 64, w - 12, 9);
    if (panel === 'door') {
      c.fillStyle = dark;
      c.fillRect(9, 153, 238, 94);
      c.strokeStyle = frame;
      c.lineWidth = 4;
      c.strokeRect(24, 170, 208, 60);
      ellipse(c, 217, 151, 5, 7, '#e1c180');
    }
    c.globalAlpha = 0.09;
    c.fillStyle = '#fff1d2';
    c.beginPath();
    c.moveTo(42, 73);
    c.lineTo(73, 73);
    c.lineTo(14, 187);
    c.lineTo(14, 128);
    c.fill();
    c.globalAlpha = 1;
  }
  c.globalAlpha = 0.16;
  for (let i = 0; i < 500; i++) {
    const x = seededRandom(seed, i * 2) * w,
      y = seededRandom(seed, i * 2 + 1) * h;
    c.fillStyle = i % 3 === 0 ? '#1d2927' : '#f3e5bb';
    c.fillRect(x, y, sign ? 2 : 1, 1);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}
