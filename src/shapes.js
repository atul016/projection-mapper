// Tracing a zone's shape on the wall (a flower, a window, a mirror): the zone is cut to the outlines
// drawn here, so effects and videos only light up what's inside them.
// Loaded before app.js; uses its zones, map and save only once tracing starts.

const tracePad = document.getElementById('trace'), traceBar = document.getElementById('trace-bar');
let tracer = null; // the zone being traced: { z, outlines (0..1, like z.shape), before, draft, mouse, dragging, drag }

const CLOSE_PX = 12; // how near the first point a click (or the end of a dragged line) closes the outline
const toScreen = z => { const m = homography(z.layer.sourcePoints, z.layer.targetPoints); return ([x, y]) => project(m, [x * 800, y * 600]); };
const fromScreen = z => { const m = homography(z.layer.targetPoints, z.layer.sourcePoints); return p => { const [x, y] = project(m, p); return [unit(x / 800), unit(y / 600)]; }; };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function startTrace(z) {
  if (tracer) return;
  map.selectedLayer = z.layer; map.selectedPoint = null;
  tracer = { z, outlines: (z.shape || []).map(o => o.map(p => p.slice())), before: z.shape, draft: null };
  traceBar.querySelector('b').textContent = `Tracing zone ${num(z)}`;
  tracePad.style.display = traceBar.style.display = 'block';
  drawTrace();
}

// keep: use the new shape; otherwise put the old one back
function endTrace(keep) {
  if (!tracer) return;
  const { z } = tracer;
  if (keep) closeDraft();
  z.shape = keep ? cleanShape(tracer.outlines) : tracer.before;
  applyShape(z);
  tracer = null;
  tracePad.style.display = traceBar.style.display = 'none';
  save();
}

// show the outlines on the zone as they are drawn
function liveShape() { tracer.z.shape = cleanShape(tracer.outlines); applyShape(tracer.z); drawTrace(); }

function closeDraft() {
  const { draft } = tracer;
  tracer.draft = null;
  if (!draft) return;
  const pts = simplify(draft, 1.5);
  if (pts.length > 3 && dist(pts[0], pts.at(-1)) < CLOSE_PX) pts.pop(); // it ends where it started
  if (pts.length >= 3) tracer.outlines.push(pts.map(fromScreen(tracer.z)));
  liveShape();
}

function undoTrace() {
  if (tracer.draft) { tracer.draft.pop(); if (!tracer.draft.length) tracer.draft = null; }
  else tracer.outlines.pop();
  liveShape();
}

function drawTrace() {
  const { z, outlines, draft, mouse } = tracer, c = tracePad.getContext('2d');
  tracePad.width = innerWidth; tracePad.height = innerHeight; // also clears it
  c.lineJoin = 'round';
  // the zone's corners, for reference
  c.setLineDash([6, 6]); c.strokeStyle = '#888'; c.lineWidth = 1;
  c.beginPath(); z.layer.targetPoints.forEach(p => c.lineTo(...p)); c.closePath(); c.stroke();
  c.setLineDash([]);
  // finished outlines, with a handle on each point to drag
  const screen = toScreen(z);
  c.strokeStyle = c.fillStyle = '#40e0ff'; c.lineWidth = 2;
  for (const o of outlines) {
    const pts = o.map(screen);
    c.beginPath(); pts.forEach(p => c.lineTo(...p)); c.closePath(); c.stroke();
    for (const p of pts) { c.beginPath(); c.arc(...p, 3, 0, 7); c.fill(); }
  }
  // the outline being drawn, a line on to the mouse, and a ring on its first point to close it
  if (draft) {
    c.strokeStyle = '#ffd84d'; c.lineWidth = 2;
    c.beginPath(); draft.forEach(p => c.lineTo(...p)); if (mouse && !tracer.dragging) c.lineTo(...mouse); c.stroke();
    c.beginPath(); c.arc(...draft[0], CLOSE_PX / 2 + 2, 0, 7); c.stroke();
  }
}

// a point of a finished outline under the mouse
function handleAt(p) {
  const screen = toScreen(tracer.z);
  for (const [o, outline] of tracer.outlines.entries())
    for (const [i, q] of outline.entries()) if (dist(screen(q), p) < 8) return { o, i };
}

// maptastic acts on every mouse event that reaches window, so none of these go further
for (const el of [tracePad, traceBar]) for (const ev of ['mousedown', 'mouseup', 'mousemove', 'dblclick'])
  el.addEventListener(ev, e => e.stopPropagation());

tracePad.addEventListener('mousedown', e => {
  if (e.button !== 0) return;
  const p = [e.clientX, e.clientY], t = tracer;
  if (!t.draft && (t.drag = handleAt(p))) return;
  if (t.draft?.length >= 3 && dist(p, t.draft[0]) < CLOSE_PX) return closeDraft();
  if (!t.draft) t.draft = [p];
  else if (dist(p, t.draft.at(-1)) > 4) t.draft.push(p);
  t.dragging = true;
  drawTrace();
});
tracePad.addEventListener('mousemove', e => {
  const p = tracer.mouse = [e.clientX, e.clientY], t = tracer;
  if (t.drag) { t.outlines[t.drag.o][t.drag.i] = fromScreen(t.z)(p); return liveShape(); }
  if (t.dragging && dist(p, t.draft.at(-1)) > 3) t.draft.push(p); // drawing freehand
  drawTrace();
});
addEventListener('mouseup', () => {
  const t = tracer;
  if (!t) return;
  t.drag = null;
  if (!t.dragging) return;
  t.dragging = false;
  // a line dragged all the way round closes itself
  if (t.draft.length > 10 && dist(t.draft.at(-1), t.draft[0]) < CLOSE_PX * 2.5) closeDraft();
  else drawTrace();
}, true); // on window, before the pad's own handler stops it
tracePad.addEventListener('dblclick', () => tracer.draft?.length >= 3 && closeDraft());

traceBar.onclick = e => {
  switch (e.target.dataset.act) {
    case 'oval': tracer.draft = null; tracer.outlines = oval(); liveShape(); break;
    case 'undo': undoTrace(); break;
    case 'clear': tracer.draft = null; tracer.outlines = []; liveShape(); break;
    case 'cancel': endTrace(false); break;
    case 'done': endTrace(true); break;
  }
};

// while tracing, keys go nowhere else (maptastic would move or flip the zone)
addEventListener('keydown', e => {
  if (!tracer) return;
  e.stopPropagation();
  const k = e.key.toLowerCase();
  if (k === 'enter') tracer.draft ? closeDraft() : endTrace(true);
  else if (k === 'escape') tracer.draft ? (tracer.draft = null, drawTrace()) : endTrace(false);
  else if (k === 'backspace' || k === 'delete' || (k === 'z' && (e.metaKey || e.ctrlKey))) undoTrace();
  else return;
  e.preventDefault();
}, true);
addEventListener('resize', () => tracer && drawTrace());
