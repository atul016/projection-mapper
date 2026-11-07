// neon light running around the zone's edges (the classic box-mapping look), or round each traced outline
EFFECTS.trace = (c, w, h, t, s, col, label, shape) => {
  fade(c, w, h, 0.25);
  if (!s.loops || s.shape !== shape) { // measure the outlines once: the distance round each one to every corner
    s.shape = shape;
    s.loops = (shape || [rect(4, 4, w - 8, h - 8)]).map(o => {
      const pts = [...o, o[0]], len = [0];
      for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      return { pts, len, P: len.at(-1) };
    });
  }
  c.strokeStyle = col; c.lineWidth = 8; c.lineCap = c.lineJoin = 'round'; c.shadowColor = col; c.shadowBlur = 25;
  for (const { pts, len, P } of s.loops) {
    if (!P) continue;
    // the point d along the outline
    const at = d => {
      d = ((d % P) + P) % P;
      let i = 1;
      while (len[i] < d) i++;
      const f = (d - len[i - 1]) / (len[i] - len[i - 1] || 1), a = pts[i - 1], b = pts[i];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    };
    for (const head of [t * 600, t * 600 + P / 2]) {
      c.beginPath();
      for (let d = 0; d <= P * 0.18; d += 6) c.lineTo(...at(head - d));
      c.stroke();
    }
  }
  c.shadowBlur = 0;
};
