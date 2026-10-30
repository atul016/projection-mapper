// ground fountain firework
EFFECTS.anar = (c, w, h, t, s, col) => {
  fade(c, w, h, 0.3);
  const u = Math.min(w, h) / 6, x = w / 2, base = h - 10, tip = base - 1.2 * u;
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + rnd(-0.28, 0.28), v = rnd(7, 15) * h / 600;
    s.p.push({ x, y: tip, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rnd(1.5, 3.5), life: 1, decay: rnd(0.012, 0.025), color: Math.random() < 0.7 ? '#fff3c0' : col });
  }
  particles(c, s, 0.18 * h / 600);
  c.globalCompositeOperation = 'source-over'; c.strokeStyle = col; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x - 0.6 * u, base); c.lineTo(x, tip); c.lineTo(x + 0.6 * u, base); c.closePath(); c.stroke();
};
