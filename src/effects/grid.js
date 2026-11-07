// numbered grid for lining a zone up with its surface
EFFECTS.grid = (c, w, h, t, s, col, label, shape) => {
  if (s.col === col && s.shape === shape) return; // still, so only redraw when the colour or shape changes
  s.col = col; s.shape = shape;
  clear(c, w, h);
  c.strokeStyle = col; c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i <= 8; i++) { c.moveTo(i * w / 8, 0); c.lineTo(i * w / 8, h); c.moveTo(0, i * h / 8); c.lineTo(w, i * h / 8); }
  c.moveTo(0, 0); c.lineTo(w, h); c.moveTo(w, 0); c.lineTo(0, h);
  c.stroke();
  c.lineWidth = 10; c.strokeRect(5, 5, w - 10, h - 10);
  if (shape) { // the traced edge
    c.lineWidth = 12; c.beginPath();
    for (const o of shape) { c.moveTo(...o[0]); o.forEach(p => c.lineTo(...p)); c.closePath(); }
    c.stroke();
  }
  c.fillStyle = col; c.font = 'bold 120px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(label, w / 2, h / 2);
};
