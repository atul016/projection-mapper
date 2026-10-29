// Built-in effects. Each one draws a single frame onto a zone's canvas:
//
//   name(c, w, h, t, s, color, label)
//     c      CanvasRenderingContext2D (always 800x600: w, h)
//     t      time in seconds
//     s      per-zone state, starts as { p: [] } and resets when the effect changes
//     color  the zone's colour from the panel, e.g. '#ffb347'
//     label  the zone's number, for effects that print it
//
// Add a function here and it appears in the panel's Effect dropdown. Draw bright things on black:
// black is "no light" on a projector, so only what you draw shows up on the wall.

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

const EFFECTS = {
  off(c, w, h, t, s) { if (!s.done) clear(c, w, h); s.done = true; },

  // numbered grid for lining a zone up with its surface
  grid(c, w, h, t, s, col, label) {
    if (s.col === col) return; // still, so only redraw when the colour changes
    s.col = col;
    clear(c, w, h);
    c.strokeStyle = col; c.lineWidth = 3;
    c.beginPath();
    for (let i = 0; i <= 8; i++) { c.moveTo(i * w / 8, 0); c.lineTo(i * w / 8, h); c.moveTo(0, i * h / 8); c.lineTo(w, i * h / 8); }
    c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h);
    c.stroke();
    c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10);
    c.fillStyle = col; c.font = 'bold 120px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label, w / 2, h / 2);
  },

  // neon light running around the zone's edges (the classic box-mapping look)
  trace(c, w, h, t, s, col) {
    fade(c, w, h, 0.25);
    const P = 2 * (w + h), at = d => {
      d = ((d % P) + P) % P;
      if (d < w) return [d, 4];
      if ((d -= w) < h) return [w - 4, d];
      if ((d -= h) < w) return [w - d, h - 4];
      return [4, h - (d - w)];
    };
    c.strokeStyle = col; c.lineWidth = 8; c.lineCap = 'round'; c.shadowColor = col; c.shadowBlur = 25;
    for (const head of [t * 600, t * 600 + P / 2]) {
      c.beginPath();
      for (let d = 0; d <= P * 0.18; d += 6) c.lineTo(...at(head - d));
      c.stroke();
    }
    c.shadowBlur = 0;
  },

  diya(c, w, h, t, s, col) {
    clear(c, w, h);
    const u = Math.min(w, h) / 6, x = w / 2, y = h * 0.62;
    // clay lamp
    c.strokeStyle = col; c.lineWidth = u * 0.12; c.shadowColor = col; c.shadowBlur = 20;
    c.beginPath(); c.moveTo(x - 1.6 * u, y); c.quadraticCurveTo(x, y + 2.2 * u, x + 1.6 * u, y); c.lineTo(x + 2.1 * u, y - 0.35 * u); c.closePath(); c.stroke();
    c.beginPath(); c.ellipse(x, y, 1.6 * u, 0.3 * u, 0, 0, 7); c.stroke();
    // flickering flame
    const fl = 1 + 0.08 * Math.sin(t * 17) + 0.06 * Math.sin(t * 29 + 1), sway = 0.12 * u * Math.sin(t * 7);
    const fx = x + 1.6 * u, fy = y - 0.45 * u, fh = 1.7 * u * fl;
    const g = c.createRadialGradient(fx, fy - fh * 0.3, 1, fx, fy - fh * 0.3, fh);
    g.addColorStop(0, '#fff8d0'); g.addColorStop(0.35, '#ffcc33'); g.addColorStop(1, '#ff5500');
    c.fillStyle = g; c.shadowColor = '#ff9900'; c.shadowBlur = 60;
    c.beginPath(); c.moveTo(fx, fy);
    c.bezierCurveTo(fx - 0.5 * u, fy - fh * 0.3, fx + sway - 0.15 * u, fy - fh * 0.8, fx + sway, fy - fh);
    c.bezierCurveTo(fx + sway + 0.15 * u, fy - fh * 0.8, fx + 0.5 * u, fy - fh * 0.3, fx, fy);
    c.fill();
    c.shadowBlur = 0;
  },

  // ground fountain firework
  anar(c, w, h, t, s, col) {
    fade(c, w, h, 0.3);
    const u = Math.min(w, h) / 6, x = w / 2, base = h - 10, tip = base - 1.2 * u;
    for (let i = 0; i < 12; i++) {
      const a = -Math.PI / 2 + rnd(-0.28, 0.28), v = rnd(7, 15) * h / 600;
      s.p.push({ x, y: tip, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rnd(1.5, 3.5), life: 1, decay: rnd(0.012, 0.025), color: Math.random() < 0.7 ? '#fff3c0' : col });
    }
    particles(c, s, 0.18 * h / 600);
    c.globalCompositeOperation = 'source-over'; c.strokeStyle = col; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x - 0.6 * u, base); c.lineTo(x, tip); c.lineTo(x + 0.6 * u, base); c.closePath(); c.stroke();
  },

  fireworks(c, w, h, t, s, col) {
    fade(c, w, h, 0.2);
    if (Math.random() < 0.025) {
      const x = rnd(w * 0.2, w * 0.8), y = rnd(h * 0.15, h * 0.5), hue = rnd(0, 360);
      for (let i = 0; i < 90; i++) {
        const a = rnd(0, 7), v = rnd(1, 6) * h / 600;
        s.p.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 2.2, life: 1, decay: rnd(0.008, 0.018), color: Math.random() < 0.5 ? col : `hsl(${hue},100%,65%)` });
      }
    }
    particles(c, s, 0.05 * h / 600);
  },

  // glitter falling from the top
  shower(c, w, h, t, s, col) {
    fade(c, w, h, 0.25);
    for (let i = 0; i < 4; i++) s.p.push({ x: rnd(0, w), y: 0, vx: rnd(-0.3, 0.3), vy: rnd(2, 5), r: rnd(1, 3), life: 1, decay: rnd(0.004, 0.012), color: col });
    particles(c, s, 0.02);
  },

  // solid colour breathing in and out (good for washing a whole surface)
  pulse(c, w, h, t, s, col) {
    clear(c, w, h);
    c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2);
    c.fillStyle = col; c.fillRect(0, 0, w, h);
    c.globalAlpha = 1;
  },
};
