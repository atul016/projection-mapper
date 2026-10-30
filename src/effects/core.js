// Built-in effects: shared helpers and the EFFECTS table. Each effect lives in its own file in this
// folder and adds itself here; index.html loads them after this file. An effect draws one frame:
//
//   name(c, w, h, t, s, color, label)
//     c      CanvasRenderingContext2D (always 800x600: w, h)
//     t      time in seconds
//     s      per-zone state, starts as { p: [] } and resets when the effect changes
//     color  the zone's colour from the panel, e.g. '#ffb347'
//     label  the zone's number, for effects that print it
//
// Add a file here (and its <script> tag in index.html) and it appears in the panel's Effect dropdown. Draw bright things on black:
// black is "no light" on a projector, so only what you draw shows up on the wall.

// colours for fairy lights and baubles
const BULBS = ['#ff3b3b', '#ffd84d', '#4dd2ff', '#7dff7a', '#ff6ad5'];

const rnd = (a, b) => a + Math.random() * (b - a);
const fade = (c, w, h, a) => { c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(0, 0, w, h); };
const clear = (c, w, h) => fade(c, w, h, 1);

// moves, fades and draws the particles in s.p; additive blending makes overlaps glow
function particles(c, s, gravity) {
  c.globalCompositeOperation = 'lighter';
  s.p = s.p.filter(p => (p.life -= p.decay) > 0);
  for (const p of s.p) {
    p.vy += gravity; p.x += p.vx; p.y += p.vy;
    c.globalAlpha = p.life;
    c.fillStyle = p.color;
    c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
}

const EFFECTS = {};
