// glitter falling from the top
EFFECTS.shower = (c, w, h, t, s, col) => {
  fade(c, w, h, 0.25);
  for (let i = 0; i < 4; i++) s.p.push({ x: rnd(0, w), y: 0, vx: rnd(-0.3, 0.3), vy: rnd(2, 5), r: rnd(1, 3), life: 1, decay: rnd(0.004, 0.012), color: col });
  particles(c, s, 0.02);
};
