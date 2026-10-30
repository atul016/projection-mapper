// Run: node --test
// lib.js is a plain browser script, so load it into a sandbox and read its globals back out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = vm.createContext({ URL }); // the browser globals lib.js uses
vm.runInContext(readFileSync(new URL('../src/lib.js', import.meta.url), 'utf8'), ctx);
const { ytId, cleanZones, mergeLayout, linkKind, cleanShape, shapePath, homography, project, simplify, oval } =
  vm.runInContext('({ ytId, cleanZones, mergeLayout, linkKind, cleanShape, shapePath, homography, project, simplify, oval })', ctx);

test('ytId reads every common YouTube link shape', () => {
  const id = 'aqz-KE-bpKQ';
  for (const url of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://www.youtube.com/watch?list=PL1&v=${id}&t=30s`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
    `https://m.youtube.com/watch?v=${id}`,
    `youtu.be/${id}`,
  ]) assert.equal(ytId(url), id, url);
});

test('ytId rejects things that are not video links', () => {
  for (const url of ['', 'hello', 'https://www.youtube.com/', 'https://vimeo.com/12345678901',
    'https://vimeo.com/x?v=aqz-KE-bpKQ', 'https://notyoutube.com/watch?v=aqz-KE-bpKQ', undefined])
    assert.equal(ytId(url), undefined, String(url));
});

test('cleanZones keeps good zones and neutralises hostile ones', () => {
  const effects = { grid() {}, diya() {} };
  const out = cleanZones([
    { id: 'zone3', effect: 'diya', color: '#FFB347', yt: 'https://youtu.be/x', off: true }, // old name for url
    { id: 'zone3', effect: 'diya' },                        // duplicate id
    { id: 'zone9007199254740993' },                         // too long: new ids would stop counting up
    { id: '<img onerror=alert(1)>', effect: 'constructor', color: 'red;background:url(x)', yt: 5, off: 'yes' },
    null, 'zone1',
  ], effects).map(z => JSON.parse(JSON.stringify(z)));     // drop undefined fields
  assert.deepEqual(out, [
    { id: 'zone3', effect: 'diya', color: '#FFB347', url: 'https://youtu.be/x', off: true },
    { effect: 'diya', color: '#ffffff' },
    { effect: 'grid', color: '#ffffff' },
    { effect: 'grid', color: '#ffffff' },
  ]);
  assert.equal(cleanZones('nope', effects).length, 0);
});

test('cleanZones keeps 4 finite corners and drops anything else', () => {
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const [good, short, bad] = cleanZones([
    { id: 'zone1', points: sq, sourcePoints: sq },
    { id: 'zone2', points: sq.slice(1) },
    { id: 'zone3', points: [[0, 0], [10, 0], [10, 'x'], [0, Infinity]], sourcePoints: 'nope' },
  ], {});
  assert.deepEqual(JSON.parse(JSON.stringify(good.points)), sq);
  assert.notEqual(good.points, sq, 'copied, not shared');
  assert.equal(short.points, undefined);
  assert.equal(bad.points, undefined);
  assert.equal(bad.sourcePoints, undefined);
});

test('mergeLayout moves version 1 corner positions into the zones', () => {
  const sq = [[0, 0], [10, 0], [10, 10], [0, 10]], moved = [[5, 5], [15, 5], [15, 15], [5, 15]];
  const out = mergeLayout(
    [{ id: 'zone1' }, { effect: 'grid' }, { id: 'zone3', points: moved }, null],
    [{ id: 'zone1', targetPoints: moved, sourcePoints: sq }, { id: 'zone2', targetPoints: sq }, { id: 'zone3', targetPoints: sq }],
  );
  assert.deepEqual(JSON.parse(JSON.stringify(out)), [
    { id: 'zone1', points: moved, sourcePoints: sq },
    { effect: 'grid', points: sq },                 // no id: matched by position, like cleanZones
    { id: 'zone3', points: moved },                 // its own corners win
    null,
  ]);
  const list = [{ id: 'zone1' }];
  assert.equal(mergeLayout(list, undefined), list, 'no layout: unchanged');
});

test('linkKind sorts links into YouTube, image, video, or not usable', () => {
  const cases = {
    'https://youtu.be/aqz-KE-bpKQ': 'youtube',
    'https://media.giphy.com/media/abc/giphy.gif': 'image',
    'https://example.com/a/photo.JPG?w=800': 'image',
    'http://example.com/clip.mp4': 'video',
    'https://example.com/clip.webm#t=3': 'video',
    'https://giphy.com/gifs/halloween-abc': undefined,   // a web page, not the GIF itself
    'https://i.imgur.com/abc.gifv': undefined,           // also a page
    'javascript:alert(1)//x.gif': undefined,
    'data:image/gif;base64,R0lGOD': undefined,
    'ftp://example.com/a.mp4': undefined,
    'https://[bad': undefined,
    'not a link': undefined,
  };
  for (const [url, kind] of Object.entries(cases)) assert.equal(linkKind(url), kind, url);
});

test('cleanShape keeps outlines of 3+ finite points, clamped and rounded', () => {
  const tri = [[0.1, 0.1], [0.9, 0.1], [0.5, 0.9]];
  assert.deepEqual(JSON.parse(JSON.stringify(cleanShape([tri, [[0, 0], [1, 1]], [[0, 0], [1, 'x'], [0, 1]], 'nope', [[-2, 0.123456], [3, 0], [0.5, 1]]]))),
    [tri, [[0, 0.1235], [1, 0], [0.5, 1]]]);
  for (const bad of [undefined, [], 'x', [[[0, 0], [1, 1]]]]) assert.equal(cleanShape(bad), undefined);
  assert.equal(cleanShape(Array(80).fill(tri)).length, 50, 'capped');
  const [z] = cleanZones([{ shape: [tri] }], {});
  assert.deepEqual(JSON.parse(JSON.stringify(z.shape)), [tri]);
});

test('shapePath scales outlines into an SVG path', () => {
  assert.equal(shapePath([[[0, 0], [1, 0], [0.5, 0.5]], [[0.25, 0.25], [0.5, 0.25], [0.5, 0.5]]], 800, 600),
    'M0 0L800 0L400 300ZM200 150L400 150L400 300Z');
  assert.equal(shapePath(undefined, 800, 600), '');
});

test('homography maps the corners and is undone by the reverse one', () => {
  const src = [[0, 0], [800, 0], [800, 600], [0, 600]], dst = [[100, 50], [700, 120], [650, 500], [80, 430]];
  const m = homography(src, dst), back = homography(dst, src);
  src.forEach((p, i) => dst[i].forEach((v, k) => assert.ok(Math.abs(project(m, p)[k] - v) < 1e-6)));
  const p = project(back, project(m, [321, 123]));
  assert.ok(Math.abs(p[0] - 321) < 1e-6 && Math.abs(p[1] - 123) < 1e-6, String(p));
  assert.equal(homography(src, [[0, 0], [0, 0], [0, 0], [0, 0]]), undefined, 'degenerate');
});

test('simplify drops points along straight runs and keeps corners', () => {
  const line = [];
  for (let x = 0; x <= 100; x += 5) line.push([x, x % 10 ? 0.5 : 0]); // a slightly wobbly line
  for (let y = 5; y <= 100; y += 5) line.push([100, y]);
  assert.deepEqual(JSON.parse(JSON.stringify(simplify(line, 1))), [[0, 0], [100, 0], [100, 100]]);
  assert.equal(oval(4).length, 1);
  assert.equal(oval()[0].length, 48);
});
