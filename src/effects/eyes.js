// pairs of eyes watching from the dark, fading in and out and blinking
EFFECTS.eyes = (c, w, h, t, s, col) => {
  clear(c, w, h);
  s.e ||= Array.from({ length: 7 }, () => ({ x: rnd(0.12, 0.88), y: rnd(0.15, 0.85), sz: rnd(0.6, 1.3), ph: rnd(0, 20) }));
  const u = Math.min(w, h) / 20;
  // both eyes of a pair, 1.4 r either side of x
  const pair = (x, y, r, rx, ry, tilt) => { c.beginPath(); for (const m of [-1, 1]) c.ellipse(x + m * 1.4 * r, y, rx, ry, m * tilt, 0, 7); c.fill(); };
  for (const e of s.e) {
    const show = Math.max(0, Math.sin(t * 0.4 + e.ph)), blink = (t + e.ph) % 4 < 0.15 ? 0.1 : 1;
    if (!show) continue;
    const x = e.x * w, y = e.y * h, r = u * e.sz;
    c.fillStyle = col;
    c.globalAlpha = show * 0.2; pair(x, y, r, 1.6 * r, 1.1 * r * blink, 0.15); // glow: a faint halo, much cheaper than shadowBlur
    c.globalAlpha = show; pair(x, y, r, r, 0.55 * r * blink, 0.15);
    c.fillStyle = '#000'; pair(x, y, r, 0.15 * r, 0.45 * r * blink, 0); // slit pupils
  }
  c.globalAlpha = 1;
};
