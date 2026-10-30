EFFECTS.fireworks = (c, w, h, t, s, col) => {
  fade(c, w, h, 0.2);
  if (Math.random() < 0.025) {
    const x = rnd(w * 0.2, w * 0.8), y = rnd(h * 0.15, h * 0.5), hue = rnd(0, 360);
    for (let i = 0; i < 90; i++) {
      const a = rnd(0, 7), v = rnd(1, 6) * h / 600;
      s.p.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 2.2, life: 1, decay: rnd(0.008, 0.018), color: Math.random() < 0.5 ? col : `hsl(${hue},100%,65%)` });
    }
  }
  particles(c, s, 0.05 * h / 600);
};
