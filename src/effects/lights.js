// two strings of fairy lights with a slow colour chase
EFFECTS.lights = (c, w, h, t, s, col) => {
  clear(c, w, h);
  const loops = 3, gap = w / 24;
  for (let row = 0; row < 2; row++) {
    const y0 = h * (0.25 + 0.4 * row), sag = h * 0.12;
    const wire = x => y0 + sag * Math.sin(Math.PI * ((x / w * loops) % 1));
    c.strokeStyle = col; c.globalAlpha = 0.5; c.lineWidth = 2;
    c.beginPath(); for (let x = 0; x <= w; x += 8) c.lineTo(x, wire(x)); c.stroke();
    for (let i = 0, x = gap / 2; x < w; i++, x += gap) {
      const on = 0.25 + 0.75 * Math.max(0, Math.sin(t * 3 - i * 0.8 + row)), y = wire(x) + 9;
      c.fillStyle = BULBS[(i + row) % BULBS.length];
      c.globalAlpha = on * 0.2; c.beginPath(); c.arc(x, y, 18, 0, 7); c.fill(); // glow: a faint halo, much cheaper than shadowBlur
      c.globalAlpha = on; c.beginPath(); c.ellipse(x, y, 5, 8, 0, 0, 7); c.fill();
    }
  }
  c.globalAlpha = 1;
};
