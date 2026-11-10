'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const hooks = {};
const calls = [];
const response = {
  recordings: [{
    id: '11111111-2222-4333-8444-555555555555',
    title: 'Test Composition',
    length: 120000,
    'artist-credit': [{ artist: { name: 'Sample Artist' } }],
    'first-release-date': '2001-04-05',
    isrcs: ['USAAA0100001'],
    releases: [{ title: 'Test Album' }]
  }]
};
const myspoti = {
  log() {},
  provide(name, fn) { hooks[name] = fn; },
  query(params) { return Object.keys(params).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&'); },
  http: { get(url, options) { calls.push({ url, options }); return { ok: true, json: () => response }; } }
};
vm.runInNewContext(fs.readFileSync('extensions/musicbrainz-details/main.js', 'utf8'), { myspoti, Date, encodeURIComponent });
assert.strictEqual(typeof hooks.trackinfo, 'function');
const track = { title: 'Test Composition', artist: 'Sample Artist', artists: ['Sample Artist'], durationMs: 120000 };
const blocks = hooks.trackinfo(track);
assert(blocks && blocks.length === 1 && blocks[0].type === 'section');
const joined = JSON.stringify(blocks);
assert(joined.includes('MusicBrainz ID: 11111111-2222-4333-8444-555555555555'));
assert(joined.includes('First release: 2001-04-05'));
assert.strictEqual(calls.length, 1);
assert(calls[0].options.headers['User-Agent'].includes('github.com/afrolord892-ai/myspoti'));
assert.strictEqual(hooks.trackinfo(track), blocks, 'same track should be served from the in-memory cache');
assert.strictEqual(calls.length, 1);

// A second immediate query is safely skipped by the one-request-per-second throttle.
const otherTrack = { title: 'Another Track', artist: 'Another Artist', artists: ['Another Artist'], durationMs: 180000 };
assert.strictEqual(hooks.trackinfo(otherTrack), null);

console.log('MusicBrainz Details tests passed.');
