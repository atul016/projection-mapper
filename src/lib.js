// Small pure helpers, kept apart from the page so `node --test` can check them.

// corners of an axis-aligned rectangle, clockwise from top-left (maptastic's point order)
const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

// YouTube video id from watch?v=, youtu.be/, /shorts/, /embed/ and /live/ links
const ytId = url => (String(url).match(/(?:^|[/.])(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:\S*[?&]v=|shorts\/|embed\/|live\/))([\w-]{11})/) || [])[1];

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
    return {
      id: /^zone\d{1,6}$/.test(id) && !seen.has(id) && seen.add(id) ? id : undefined, // short, so new ids can't overflow
      effect: Object.hasOwn(effects, s.effect) ? s.effect : 'grid',
      color: /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : '#ffffff',
      yt: typeof s.yt === 'string' ? s.yt : undefined,
      off: s.off === true || undefined,
      points: quad(s.points),             // where the zone's corners sit on the wall
      sourcePoints: quad(s.sourcePoints), // which content corner goes to each (changed by flips)
    };
  });
}
