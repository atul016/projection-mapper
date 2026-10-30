// snowfall; the biggest flakes are drawn as turning six-armed crystals
EFFECTS.snow = (c, w, h, t, s, col) => {
  clear(c, w, h);
  s.f ||= Array.from({ length: 160 }, () => ({ x: rnd(0, w), y: rnd(0, h), r: rnd(1, 4.5), ph: rnd(0, 7) }));
  c.fillStyle = c.strokeStyle = col; c.lineWidth = 1.5;
  for (const f of s.f) {
    f.y += f.r * 0.45; f.x += Math.sin(t + f.ph) * 0.4;
    if (f.y > h + 10) { f.y = -10; f.x = rnd(0, w); }
    c.globalAlpha = 0.4 + f.r / 7.5;
    if (f.r > 3.8) {
      c.beginPath();
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + t * 0.5 + f.ph; c.moveTo(f.x, f.y); c.lineTo(f.x + Math.cos(a) * f.r * 2.5, f.y + Math.sin(a) * f.r * 2.5); }
      c.stroke();
    } else { c.beginPath(); c.arc(f.x, f.y, f.r, 0, 7); c.fill(); }
  }
  c.globalAlpha = 1;
};
