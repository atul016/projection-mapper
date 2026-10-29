// Run: node --test
// lib.js is a plain browser script, so load it into a sandbox and read its globals back out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = vm.createContext({});
vm.runInContext(readFileSync(new URL('../src/lib.js', import.meta.url), 'utf8'), ctx);
const { ytId, cleanZones, mergeLayout } = vm.runInContext('({ ytId, cleanZones, mergeLayout })', ctx);

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
    { id: 'zone3', effect: 'diya', color: '#FFB347', yt: 'https://youtu.be/x', off: true },
    { id: 'zone3', effect: 'diya' },                        // duplicate id
    { id: 'zone9007199254740993' },                         // too long: new ids would stop counting up
    { id: '<img onerror=alert(1)>', effect: 'constructor', color: 'red;background:url(x)', yt: 5, off: 'yes' },
    null, 'zone1',
  ], effects).map(z => JSON.parse(JSON.stringify(z)));     // drop undefined fields
  assert.deepEqual(out, [
    { id: 'zone3', effect: 'diya', color: '#FFB347', yt: 'https://youtu.be/x', off: true },
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
