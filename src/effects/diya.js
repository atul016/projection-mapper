EFFECTS.diya = (c, w, h, t, s, col) => {
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
};
