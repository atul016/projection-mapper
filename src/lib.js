// Small pure helpers, kept apart from the page so `node --test` can check them.

// corners of an axis-aligned rectangle, clockwise from top-left (maptastic's point order)
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

// YouTube video id from watch?v=, youtu.be/, /shorts/, /embed/ and /live/ links
const ytId = url => (String(url).match(/(?:^|[/.])(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:\S*[?&]v=|shorts\/|embed\/|live\/))([\w-]{11})/) || [])[1];

// What a link typed into the panel points at: 'youtube', 'image' (incl. GIF), 'video', or undefined.
// Only http(s) links count (never javascript: or data:), and a direct link has to end in a media file
// extension, so a web page (a GIPHY or Tenor page, say) is turned down instead of showing nothing.
function linkKind(url) {
  if (ytId(url)) return 'youtube';
  let u;
  try { u = new URL(url); } catch { return; }
  if (!/^https?:$/.test(u.protocol)) return;
  if (/\.(gif|png|jpe?g|webp|avif|svg)$/i.test(u.pathname)) return 'image';
  if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(u.pathname)) return 'video';
}

// Before setup version 2, corner positions were kept apart from the zones, in maptastic's own
// [{ id, targetPoints, sourcePoints }] layout list. Copy them into the matching zones.
function mergeLayout(list, layout) {
  if (!Array.isArray(list) || !Array.isArray(layout)) return list;
  return list.map((s, i) => {
    const l = s && layout.find(l => l && l.id === (s.id ?? 'zone' + (i + 1)));
    return l ? { ...s, points: s.points ?? l.targetPoints, sourcePoints: s.sourcePoints ?? l.sourcePoints } : s;
  });
}

// 4 corners of finite numbers, copied, or undefined
const quad = q => Array.isArray(q) && q.length === 4 && q.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))
  ? q.map(p => [p[0], p[1]]) : undefined;

// Saved zones, checked field by field: they may come from an imported file someone shared, so are never trusted.
// effects is the EFFECTS table (effect names must be one of its own keys).
function cleanZones(list, effects) {
  const seen = new Set();
  return (Array.isArray(list) ? list : []).filter(s => s && typeof s === 'object').map((s, i) => {
    const id = s.id ?? 'zone' + (i + 1); // saves from the first version had no ids
    const url = s.url ?? s.yt;            // saves before links could be videos or GIFs called it yt
    return {
      id: /^zone\d{1,6}$/.test(id) && !seen.has(id) && seen.add(id) ? id : undefined, // short, so new ids can't overflow
      effect: Object.hasOwn(effects, s.effect) ? s.effect : 'grid',
      color: /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : '#ffffff',
      url: typeof url === 'string' ? url : undefined, // a YouTube / video / image link
      off: s.off === true || undefined,
      points: quad(s.points),             // where the zone's corners sit on the wall
      sourcePoints: quad(s.sourcePoints), // which content corner goes to each (changed by flips)
      shape: cleanShape(s.shape),         // traced outlines the zone is cut to
    };
  });
}

// ---------- traced shapes ----------
// A zone's shape is a list of closed outlines, each a list of [x, y] points from 0 to 1 across the
// zone's content (so it warps with the corners). Outlines are filled even-odd: one inside another cuts a hole.
const MAX_OUTLINES = 50, MAX_OUTLINE_POINTS = 2000;
const unit = v => Math.round(Math.min(1, Math.max(0, v)) * 1e4) / 1e4; // 0..1, 4 decimals keeps saves small

// outlines of 3 or more finite points, clamped to the zone, or undefined for none (the plain rectangle)
function cleanShape(shape) {
  if (!Array.isArray(shape)) return;
  const out = shape.filter(o => Array.isArray(o) && o.length >= 3 && o.length <= MAX_OUTLINE_POINTS
    && o.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)))
    .slice(0, MAX_OUTLINES).map(o => o.map(([x, y]) => [unit(x), unit(y)]));
  return out.length ? out : undefined;
}

// an SVG path for the outlines, scaled to a w x h box (for CSS clip-path: path() and canvas Path2D)
const shapePath = (shape, w, h) => (shape || []).map(o =>
  'M' + o.map(([x, y]) => `${+(x * w).toFixed(1)} ${+(y * h).toFixed(1)}`).join('L') + 'Z').join('');

// an oval filling the zone, as a starting shape to adjust
const oval = (n = 48) => [Array.from({ length: n }, (_, i) =>
  [unit(0.5 + 0.5 * Math.cos(2 * Math.PI * i / n)), unit(0.5 + 0.5 * Math.sin(2 * Math.PI * i / n))])];

// the projective transform taking 4 points `from` onto 4 points `to` (what a corner-pinned zone does),
// as [a..h] with the bottom-right 1 left out. Solves the usual 8x8 system by Gaussian elimination.
function homography(from, to) {
  const A = [];
  from.forEach(([x, y], i) => {
    const [u, v] = to[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u, u], [0, 0, 0, x, y, 1, -x * v, -y * v, v]);
  });
  for (let c = 0; c < 8; c++) {
    let best = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[best][c])) best = r;
    [A[c], A[best]] = [A[best], A[c]];
    if (!A[c][c]) return; // 3 corners in a line: no transform
    for (let r = 0; r < 8; r++) if (r !== c) {
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  return A.map((row, i) => row[8] / row[i]);
}
const project = (m, [x, y]) => {
  const d = m[6] * x + m[7] * y + 1;
  return [(m[0] * x + m[1] * y + m[2]) / d, (m[3] * x + m[4] * y + m[5]) / d];
};

// fewer points along a traced line, none further than tol from where it was (Ramer-Douglas-Peucker)
function simplify(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const [a, b] = [pts[0], pts.at(-1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  let far = 0, at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i], d = len ? Math.abs(dy * (p[0] - a[0]) - dx * (p[1] - a[1])) / len : Math.hypot(p[0] - a[0], p[1] - a[1]);
    if (d > far) { far = d; at = i; }
  }
  if (far <= tol) return [a, b];
  return [...simplify(pts.slice(0, at + 1), tol).slice(0, -1), ...simplify(pts.slice(at), tol)];
}
