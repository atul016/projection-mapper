// a flock of bats flapping across
EFFECTS.bats = (c, w, h, t, s, col) => {
  clear(c, w, h);
  c.beginPath(); // every bat goes into one path, so the glow is drawn once, not per bat
  for (let i = 0; i < 8; i++) {
    const sz = Math.min(w, h) * (0.06 + 0.012 * (i % 4)), span = w + 4 * sz;
    const bx = ((t * w * (0.12 + 0.03 * (i % 3)) + i * span / 8) % span) - 2 * sz;
    const by = h * (0.15 + 0.7 * ((i * 0.37) % 1)) + Math.sin(t * 2 + i) * h * 0.05, f = Math.sin(t * 16 + i * 1.7);
    for (const m of [-1, 1]) {
      c.moveTo(bx, by - 0.1 * sz);
      c.quadraticCurveTo(bx + m * 0.5 * sz, by - 0.7 * sz * f, bx + m * sz, by - 0.35 * sz * f);
      c.quadraticCurveTo(bx + m * 0.8 * sz, by + 0.05 * sz, bx + m * 0.66 * sz, by + 0.15 * sz - 0.1 * sz * f);
      c.quadraticCurveTo(bx + m * 0.5 * sz, by, bx + m * 0.33 * sz, by + 0.2 * sz - 0.05 * sz * f);
      c.quadraticCurveTo(bx + m * 0.2 * sz, by + 0.1 * sz, bx, by + 0.2 * sz);
    }
    c.moveTo(bx + 0.12 * sz, by); c.ellipse(bx, by, 0.12 * sz, 0.22 * sz, 0, 0, 7); // body
  }
  c.fillStyle = c.shadowColor = col; c.shadowBlur = 12;
  c.fill();
};
