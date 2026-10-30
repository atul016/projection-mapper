// Projection Mapper: zones, the panel, keyboard shortcuts and the render loop.
// Depends on vendor/maptastic.js, vendor/lottie_light.min.js, lib.js and effects/ (loaded first).

const DEFAULTS = [['grid', '#ffffff'], ['trace', '#40e0ff'], ['diya', '#ffb347'], ['anar', '#ffd84d'], ['fireworks', '#ff6ad5'], ['off', '#ffffff']];
const ZONES_KEY = 'mapper.zones';

// ---------- saved zones ----------
// One list in localStorage: each zone's settings and its corners. Older versions kept the corners in
// maptastic's own key; they are merged in once and that key is removed after the first save.
const OLD_LAYOUT_KEY = 'maptastic.layers';
const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } };
let saved = cleanZones(mergeLayout(read(ZONES_KEY), read(OLD_LAYOUT_KEY)), EFFECTS);
if (!saved.length) saved = DEFAULTS.map(([effect, color]) => ({ effect, color }));

const zoneSpec = z => ({
  id: z.el.id, effect: z.effect, color: z.color, url: z.url || undefined, off: z.off || undefined,
  points: z.layer.targetPoints, sourcePoints: z.layer.sourcePoints,
});
let ready = false; // nothing is saved while startup rebuilds the zones
function save() {
  if (!ready) return;
  try { localStorage.setItem(ZONES_KEY, JSON.stringify(zones().map(zoneSpec))); } catch (e) {}
  map.draw();
}

// ---------- zones ----------
// maptastic's layer list is the one record of zone order (last = on top); each layer's element carries its zone
const map = new maptastic.Maptastic({ autoLoad: false, autoSave: false, labels: true, onchange: save });
const zones = () => map.layers.map(l => l.element.zone);
const zoneOf = layer => layer.element.zone;
const rows = document.getElementById('rows');
const vw = () => innerWidth || screen.width, vh = () => innerHeight || screen.height; // 0 if the page loads in a hidden window
const num = z => z.el.id.slice(4);
let nextNum = 1 + Math.max(0, ...saved.map(s => +(s.id || 'zone0').slice(4)));

// a zone from a saved spec; without points it goes in the middle of the screen
function addZone({ id, effect = 'grid', color = '#ffffff', url, off, points, sourcePoints } = {}) {
  id ||= 'zone' + nextNum++;
  const el = document.createElement('div');
  el.className = 'zone'; el.id = id;
  el.innerHTML = '<canvas width="800" height="600"></canvas><video loop muted playsinline></video><img alt=""><div class="lottie"></div>';
  document.body.appendChild(el);
  const z = el.zone = {
    el, ctx: el.querySelector('canvas').getContext('2d'), video: el.querySelector('video'), img: el.querySelector('img'),
    lottieEl: el.querySelector('.lottie'), anim: null, effect, color, state: { p: [] },
  };
  setMode(z, 'effect');
  map.addLayer(el, points || rect(vw() * 0.35, vh() * 0.3, vw() * 0.3, vh() * 0.4));
  z.layer = map.layers.at(-1);
  if (sourcePoints) { z.layer.sourcePoints = sourcePoints.map(p => p.slice()); map.updateTransform(); }
  el.style.zIndex = map.layers.length; // new zones go on top
  addRow(z);
  if (url) playLink(z, url);
  if (off) setOff(z, true);
  save();
  return z;
}

function removeZone(z) {
  if (!confirm(`Delete zone ${num(z)}?`)) return;
  unload(z);
  map.removeLayer(z.el);
  z.el.remove(); z.row.remove();
  save();
}

// move a zone one step up (dir 1) or down (-1) in the stack, so overlapping zones show the right one on top.
// z-index rather than moving the element, because moving an iframe reloads the YouTube video.
function restack(z, dir) {
  const a = map.layers, i = a.indexOf(z.layer), j = i + dir;
  if (j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]];
  zones().forEach((z, k) => { z.el.style.zIndex = k + 1; rows.appendChild(z.row); });
  save();
}

// copy of a zone, shifted down-right so it doesn't sit exactly on top; links are copied, chosen files aren't
function duplicate(spec, offset = 30) {
  const z = addZone({ ...spec, id: undefined, off: undefined, points: spec.points.map(([x, y]) => [x + offset, y + offset]) });
  if (map.configActive) { map.selectedLayer = z.layer; map.selectedPoint = null; map.draw(); }
  return z;
}

// ---------- zone content: built-in effect, video, image / GIF, Lottie, or YouTube ----------
// the stylesheet shows the element that matches the zone's data-mode
function setMode(z, mode) { z.mode = z.el.dataset.mode = mode; }
// a video or image (incl. GIF) from a link or a chosen file
function showMedia(z, kind, src) {
  setMode(z, kind);
  if (kind === 'image') z.img.src = src;
  else { z.video.src = src; play(z.video); }
}
// X in edit mode: hide the whole zone, whatever it shows (effect, video, image, Lottie or YouTube), or show it again
function setOff(z, off) {
  z.off = off;
  z.el.style.opacity = off ? 0 : '';
  z.row.style.opacity = off ? 0.4 : '';
  if (off) { z.video.pause(); z.anim?.pause(); } else { if (z.mode === 'video') play(z.video); z.anim?.play(); }
  if (z.iframe) ytCommand(z, off ? 'pauseVideo' : 'playVideo');
}
// a video that can't play (a dead link, autoplay refused) just stays black; don't leave a rejected promise behind
const play = video => video.play().catch(() => {});
function unload(z) {
  z.video.pause();
  for (const m of [z.video, z.img]) { URL.revokeObjectURL(m.src); m.removeAttribute('src'); } // revoking a web link is a no-op
  if (z.anim) { z.anim.destroy(); z.anim = null; }
  if (z.iframe) { z.iframe.remove(); z.iframe = null; }
  z.url = null; z.ytDuration = z.ytLive = undefined;
}

// a link typed or pasted into the panel: YouTube, or a direct link to a video or an image / GIF.
// Returns false if it isn't one, 'file' for YouTube when the page is opened as a file.
function playLink(z, url) {
  url = url.trim();
  const kind = linkKind(url);
  if (!kind) return false;
  z.row.querySelector('input[type=url]').value = url;
  unload(z);
  z.url = url;
  // YouTube refuses pages opened as files: keep the link (so it isn't lost on the next save) but show the effect
  if (kind === 'youtube' && location.protocol === 'file:') { setMode(z, 'effect'); return 'file'; }
  if (kind !== 'youtube') { showMedia(z, kind, url); return true; }
  // muted autoplay is the only autoplay browsers allow; looping is done by hand below (see ytCommand)
  // because YouTube's own loop=1 passes through the paused / end screen with its title and buttons
  z.iframe = Object.assign(document.createElement('iframe'), {
    src: `https://www.youtube.com/embed/${ytId(url)}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1`,
    allow: 'autoplay; encrypted-media',
  });
  // ask the player to stream its state (playerState, currentTime, duration) back to us
  z.iframe.onload = () => z.iframe && ytListen(z);
  z.el.appendChild(z.iframe);
  setMode(z, 'youtube');
  return true;
}

const ytPost = (z, msg) => z.iframe.contentWindow.postMessage(JSON.stringify(msg), '*');
const ytListen = z => ytPost(z, { event: 'listening' }); // ask the player to stream its state back
const ytCommand = (z, func, args = []) => ytPost(z, { event: 'command', func, args });
// keep YouTube zones playing: jump back to the start just before the end, and resume if it ever pauses
addEventListener('message', e => {
  if (e.origin !== 'https://www.youtube.com') return;
  const z = zones().find(z => z.iframe?.contentWindow === e.source);
  let info; try { info = JSON.parse(e.data).info; } catch (err) { return; }
  if (!z || !info || z.off) return; // a switched-off zone stays paused
  // paused (2), unstarted (-1) or cued (5): play
  if ([2, -1, 5].includes(info.playerState)) ytCommand(z, 'playVideo');
  // a live stream's duration keeps growing and its playhead sits at the end, so never loop those
  if (info.duration) { if (z.ytDuration && info.duration !== z.ytDuration) z.ytLive = true; z.ytDuration = info.duration; }
  if (z.ytLive) return;
  if (info.currentTime > z.ytDuration - 0.5 || info.playerState === 0) { ytCommand(z, 'seekTo', [0, true]); ytCommand(z, 'playVideo'); }
});
// The player's reports can stop (a stall, an ad, the browser pausing muted media), and then nothing above
// fires. So every few seconds re-open the reports and nudge each visible YouTube zone to play; both are
// no-ops when it is already playing.
setInterval(() => {
  for (const z of zones()) if (z.iframe && !z.off) {
    ytListen(z);
    ytCommand(z, 'playVideo');
  }
}, 4000);

// ---------- panel ----------
function addRow(z) {
  const tr = document.createElement('tr');
  tr.innerHTML = `<td></td>
    <td><select>${Object.keys(EFFECTS).map(e => `<option>${e}</option>`).join('')}</select></td>
    <td><input type="color"></td>
    <td><input type="file" accept="video/*,image/*,.json"> <input type="url" placeholder="or paste a YouTube, video or GIF link" size="28"> <button>clear</button></td>
    <td><button title="Duplicate">⧉</button> <button title="Delete">✕</button></td>`;
  z.row = tr;
  const [sel, color, file, link] = tr.querySelectorAll('select, input');
  const [clearBtn, dupBtn, delBtn] = tr.querySelectorAll('button');
  // values go in as properties, not HTML, because they may come from an imported file
  tr.cells[0].textContent = num(z);
  sel.value = z.effect;
  color.value = z.color;

  // a new effect starts from a fresh canvas: setting its width clears it and resets every drawing setting
  sel.onchange = () => { z.effect = sel.value; z.state = { p: [] }; z.ctx.canvas.width = 800; save(); };
  color.oninput = () => { z.color = color.value; };
  color.onchange = save;
  link.onchange = () => {
    if (!link.value.trim()) return;
    const played = playLink(z, link.value);
    if (!played) return alert('That isn\'t a link to a YouTube video or straight to a video or image file (ending in .mp4, .webm, .gif, .png, .jpg...). For a GIF on GIPHY or Tenor, right-click it and copy the image address.');
    if (played === 'file') return alert('YouTube won\'t play when this page is opened as a file. Open it with the start script in this folder (start-mac.command, start-windows.bat or start.sh) instead.');
    file.value = '';
    save();
  };
  file.onchange = async () => {
    const f = file.files[0];
    if (!f) return;
    unload(z); link.value = ''; save();
    if (f.name.toLowerCase().endsWith('.json')) {
      try {
        z.anim = lottie.loadAnimation({ container: z.lottieEl, renderer: 'svg', loop: true, autoplay: true, animationData: JSON.parse(await f.text()) });
      } catch (e) { alert('Not a valid Lottie animation: ' + f.name); file.value = ''; return; }
      setMode(z, 'lottie');
    } else showMedia(z, f.type.startsWith('image/') ? 'image' : 'video', URL.createObjectURL(f)); // GIF, PNG, JPG, WebP or a video
  };
  clearBtn.onclick = () => { unload(z); file.value = ''; link.value = ''; setMode(z, 'effect'); save(); };
  dupBtn.onclick = () => duplicate(zoneSpec(z));
  delBtn.onclick = () => removeZone(z);
  rows.appendChild(tr);
}

// ---------- export / import a whole setup ----------
function exportSetup() {
  const data = { app: 'projection-mapper', version: 2, zones: zones().map(zoneSpec) };
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })),
    download: 'mapper-setup.json',
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// version 1 files carry the corners in a separate layout list
async function importSetup(f) {
  try {
    const data = JSON.parse(await f.text());
    if (data.app !== 'projection-mapper' || !Array.isArray(data.zones)) throw new Error();
    localStorage.setItem(ZONES_KEY, JSON.stringify(cleanZones(mergeLayout(data.zones, data.layout), EFFECTS)));
    location.reload();
  } catch (e) { alert('That file isn\'t a Projection Mapper setup.'); }
}

// ---------- startup ----------
// zones without saved corners are laid out in a 3-column grid
const nRows = Math.max(2, Math.ceil(saved.length / 3));
saved.forEach((s, i) => {
  const W = vw() / 3, H = vh() / nRows, x = (i % 3) * W + W * 0.1, y = Math.floor(i / 3) * H + H * 0.1;
  addZone({ ...s, points: s.points || rect(x, y, W * 0.8, H * 0.8) });
});
ready = true;
save();
localStorage.removeItem(OLD_LAYOUT_KEY);

const panel = document.getElementById('panel');
document.getElementById('add').onclick = () => addZone();
document.getElementById('export').onclick = exportSetup;
const importInput = document.getElementById('import');
importInput.onchange = () => importInput.files[0] && importSetup(importInput.files[0]);
document.getElementById('import-btn').onclick = () => importInput.click();

// maptastic listens on window and preventDefaults mouse events in edit mode, which blocks the panel's controls
for (const ev of ['mousedown', 'mouseup', 'mousemove']) panel.addEventListener(ev, e => e.stopPropagation());

// ---------- keyboard ----------
// maptastic handles its own edit-mode keys (Shift+Space, arrows, Alt+arrows, r, h, v, s, b, c);
// these are the page's. Typing in the panel's inputs never triggers them.
let gridAngle = 0, copied = null;
const toggle = el => el.style.display = getComputedStyle(el).display === 'none' ? 'block' : 'none';
addEventListener('keydown', e => {
  if (e.code === 'Space' && e.shiftKey) { panel.style.display = 'none'; return; } // entering / leaving edit mode
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (k === 'p') return toggle(panel);
  if (map.configActive) return editKey(e, k);
  switch (k) {
    case 'g': toggle(document.getElementById('grid')); break;
    // r rotates the grid 15°, Shift+R 1° for fine tuning
    case 'r': document.getElementById('grid').style.rotate = `${gridAngle = (gridAngle + (e.shiftKey ? 1 : 15)) % 360}deg`; break;
    case 'h': toggle(document.getElementById('help')); break;
    case 'f': document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); break;
  }
});

function editKey(e, k) {
  const z = map.selectedLayer && zoneOf(map.selectedLayer);
  if (e.metaKey || e.ctrlKey) { // copy the selected zone, paste copies of it
    if (k === 'c' && z) { e.preventDefault(); copied = { spec: zoneSpec(z), pastes: 0 }; copied.spec.points = copied.spec.points.map(p => p.slice()); }
    if (k === 'v' && copied) { e.preventDefault(); duplicate(copied.spec, 30 * ++copied.pastes); }
    return;
  }
  if (k === 'n') return addZone();
  if (!z) return;
  switch (k) {
    case 'x': setOff(z, !z.off); save(); break;
    case ']': restack(z, 1); break;
    case '[': restack(z, -1); break;
    case 'delete': case 'backspace': if (e.target.tagName !== 'BUTTON') removeZone(z); break; // not a stray key on a panel button
  }
}

// ---------- render loop ----------
(function frame(ms) {
  const t = ms / 1000;
  for (const z of zones()) if (z.mode === 'effect' && !z.off) {
    z.ctx.save(); // whatever an effect changes on the canvas is undone after its frame
    EFFECTS[z.effect](z.ctx, 800, 600, t, z.state, z.color, num(z));
    z.ctx.restore();
  }
  requestAnimationFrame(frame);
})(0);
