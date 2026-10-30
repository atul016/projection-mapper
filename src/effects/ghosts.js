// three ghosts drifting across, bobbing, hems rippling
EFFECTS.ghosts = (c, w, h, t, s, col) => {
  clear(c, w, h);
  const u = Math.min(w, h) / 6;
  c.strokeStyle = c.fillStyle = c.shadowColor = col; c.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const r = u * (0.6 + 0.15 * i), span = w + 4 * r;
    const gx = ((t * w * (0.05 + 0.02 * i) + i * span / 3) % span) - 2 * r, gy = h * (0.28 + 0.22 * i) + Math.sin(t * 1.5 + i * 2) * h * 0.04;
    c.beginPath(); c.arc(gx, gy, r, Math.PI, 0); c.lineTo(gx + r, gy + 1.3 * r);
    for (let k = 1; k <= 6; k++) c.lineTo(gx + r - k * r / 3, gy + 1.3 * r + (k % 2 ? 0.25 : -0.05) * r + Math.sin(t * 5 + k + i) * 0.08 * r);
    c.closePath();
    c.globalAlpha = 0.15; c.fill(); c.globalAlpha = 1;
    c.shadowBlur = 18; c.stroke(); c.shadowBlur = 0; // only the outline glows
    c.beginPath();
    for (const m of [-1, 1]) c.ellipse(gx + m * 0.35 * r, gy - 0.05 * r, 0.12 * r, 0.2 * r, 0, 0, 7);
    c.fill();
    c.beginPath(); c.ellipse(gx, gy + 0.45 * r, 0.12 * r, 0.16 * r, 0, 0, 7); c.stroke();
  }
};
