// neon light running around the zone's edges (the classic box-mapping look)
EFFECTS.trace = (c, w, h, t, s, col) => {
  fade(c, w, h, 0.25);
  const P = 2 * (w + h), at = d => {
    d = ((d % P) + P) % P;
    if (d < w) return [d, 4];
    if ((d -= w) < h) return [w - 4, d];
    if ((d -= h) < w) return [w - d, h - 4];
    return [4, h - (d - w)];
  };
  c.strokeStyle = col; c.lineWidth = 8; c.lineCap = 'round'; c.shadowColor = col; c.shadowBlur = 25;
  for (const head of [t * 600, t * 600 + P / 2]) {
    c.beginPath();
    for (let d = 0; d <= P * 0.18; d += 6) c.lineTo(...at(head - d));
    c.stroke();
  }
  c.shadowBlur = 0;
};
