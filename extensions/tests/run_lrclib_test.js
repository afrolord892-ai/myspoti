'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function harness(getResponses) {
  const hooks = {};
  const requests = [];
  const myspoti = {
    settings: { get: key => key === 'plainToo' ? true : undefined },
    log() {},
    provide(name, fn) { hooks[name] = fn; },
    query(params) { return Object.keys(params).filter(k => params[k] !== undefined).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&'); },
    http: { get(url, options) { requests.push({ url, options }); return getResponses(url); } }
  };
  vm.runInNewContext(fs.readFileSync('extensions/lrclib-lyrics/main.js', 'utf8'), { myspoti, Date, encodeURIComponent });
  return { hooks, requests };
}

const track = { title: 'Test Composition', artist: 'Sample Artist', album: 'Test Album', durationMs: 120000 };
const exactRecord = {
  trackName: 'Test Composition', artistName: 'Sample Artist', albumName: 'Test Album', duration: 120,
  instrumental: false, plainLyrics: 'First line\nSecond line',
  syncedLyrics: '[00:01.25] First line\n[00:03.5] Second line'
};
let h = harness(url => ({ ok: true, json: () => exactRecord }));
const timed = h.hooks.lyrics(track);
assert(timed && timed.synced === true);
assert.deepStrictEqual(JSON.parse(JSON.stringify(timed.lines)), [
  { time: 1250, text: 'First line' }, { time: 3500, text: 'Second line' }
]);
assert.strictEqual(h.requests.length, 1, 'exact lookup should be the first and only request when matched');

// Fallback results must still match exact normalized title/artist and duration.
h = harness(url => {
  if (url.includes('/api/get?')) return { ok: false, json: () => ({}) };
  return { ok: true, json: () => [
    { ...exactRecord, trackName: 'Different Song' },
    { ...exactRecord, duration: 150 },
    { ...exactRecord, syncedLyrics: null, plainLyrics: 'Plain fallback' }
  ] };
});
const plain = h.hooks.lyrics(track);
assert(plain && plain.plain === 'Plain fallback');
assert.strictEqual(h.requests.length, 2);

// Instrumental recordings and empty records are not presented as lyrics.
h = harness(() => ({ ok: true, json: () => ({ ...exactRecord, instrumental: true, syncedLyrics: null }) }));
assert.strictEqual(h.hooks.lyrics(track), null);

console.log('LRCLIB Lyrics tests passed.');
