// jack-o'-lantern with a flickering candle-lit face
EFFECTS.pumpkin = (c, w, h, t, s, col) => {
  clear(c, w, h);
  const u = Math.min(w, h) / 6, x = w / 2, y = h * 0.56;
  c.strokeStyle = col; c.lineWidth = u * 0.08; c.shadowColor = col; c.shadowBlur = 20;
  c.beginPath(); c.ellipse(x, y, 2.2 * u, 1.7 * u, 0, 0, 7); c.stroke();
  c.globalAlpha = 0.5; // ribs
  for (const rx of [0.8, 1.6]) { c.beginPath(); c.ellipse(x, y, rx * u, 1.7 * u, 0, 0, 7); c.stroke(); }
  c.globalAlpha = 1;
  c.beginPath(); c.moveTo(x, y - 1.65 * u); c.quadraticCurveTo(x + 0.05 * u, y - 2.1 * u, x + 0.35 * u, y - 2.3 * u); c.stroke();
  const fl = 0.7 + 0.3 * Math.sin(t * 13) * Math.sin(t * 7.3 + 1);
  c.fillStyle = `rgba(255,${150 + 70 * fl | 0},40,${fl})`; c.shadowColor = '#ff8800'; c.shadowBlur = 50 * fl;
  c.beginPath();
  for (const m of [-1, 1]) { // eyes
    c.moveTo(x + m * 1.25 * u, y - 0.15 * u); c.lineTo(x + m * 0.35 * u, y - 0.15 * u); c.lineTo(x + m * 0.8 * u, y - 0.85 * u); c.closePath();
  }
  c.moveTo(x - 0.2 * u, y + 0.25 * u); c.lineTo(x + 0.2 * u, y + 0.25 * u); c.lineTo(x, y - 0.05 * u); c.closePath(); // nose
  c.moveTo(x - 1.4 * u, y + 0.45 * u); // jagged grin
  for (let i = 0; i <= 8; i++) c.lineTo(x + (i / 4 - 1) * 1.4 * u, y + (i % 2 ? 0.75 : 0.5) * u);
  for (let i = 8; i >= 0; i--) c.lineTo(x + (i / 4 - 1) * 1.25 * u, y + (i % 2 ? 1.05 : 1.25) * u - (Math.abs(i - 4) / 4) * 0.25 * u);
  c.closePath();
  c.fill();
  c.shadowBlur = 0;
};
