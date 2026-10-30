// outline tree with twinkling baubles and a star on top
const TIERS = [[0.33, 0.9, 0.45], [0.62, 1.5, 0.85], [1, 2.1, 0]]; // [depth down the tree, half-width, notch above the next tier]

// half-width of the outline at depth d (0 = top, 1 = base): each tier widens from the notch above it
function treeHalfWidth(d) {
  let d0 = 0, w0 = 0;
  for (const [td, hw, notch] of TIERS) {
    if (d <= td) return w0 + (hw - w0) * (d - d0) / (td - d0);
    d0 = td; w0 = notch;
  }
}

EFFECTS.tree = (c, w, h, t, s, col) => {
  clear(c, w, h);
  const u = Math.min(w, h) / 6, x = w / 2, top = h * 0.14, base = h * 0.82;
  const at = (dx, d) => [x + dx * u, top + d * (base - top)];
  // outline: down the right side, back up the left
  const right = [[0, 0]];
  for (const [d, hw, notch] of TIERS) { right.push([hw, d]); if (notch) right.push([notch, d]); }
  c.strokeStyle = c.shadowColor = col; c.lineWidth = 5; c.lineJoin = 'round'; c.shadowBlur = 20;
  c.beginPath();
  for (const [dx, d] of right) c.lineTo(...at(dx, d));
  for (const [dx, d] of right.reverse()) c.lineTo(...at(-dx, d));
  c.stroke();
  c.strokeRect(x - 0.25 * u, base, 0.5 * u, 0.5 * u);
  c.shadowBlur = 0;
  // baubles, placed once inside the outline
  s.o ||= Array.from({ length: 22 }, (_, i) => {
    const d = rnd(0.2, 0.95);
    return { dx: rnd(-0.8, 0.8) * treeHalfWidth(d), d, ph: rnd(0, 7), color: BULBS[i % BULBS.length] };
  });
  for (const o of s.o) {
    const [ox, oy] = at(o.dx, o.d), on = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3 + o.ph));
    c.fillStyle = o.color;
    c.globalAlpha = on * 0.25; c.beginPath(); c.arc(ox, oy, 0.2 * u, 0, 7); c.fill(); // halo
    c.globalAlpha = on; c.beginPath(); c.arc(ox, oy, 0.08 * u, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
  // star
  const sr = 0.35 * u * (1 + 0.08 * Math.sin(t * 4));
  c.fillStyle = c.shadowColor = '#ffd84d'; c.shadowBlur = 40;
  c.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? sr * 0.45 : sr;
    c.lineTo(x + Math.cos(a) * r, top - 0.15 * u + Math.sin(a) * r);
  }
  c.fill();
  c.shadowBlur = 0;
};
