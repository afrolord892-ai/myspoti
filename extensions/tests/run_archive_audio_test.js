'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const hooks = {};
const searchPayload = {
  response: { docs: [{
    identifier: 'pd-test-track',
    title: 'Public Domain Test Track',
    creator: 'Public Domain Artist',
    licenseurl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    runtime: '120'
  }] }
};
const metadataPayload = {
  metadata: {
    title: 'Public Domain Test Track',
    creator: 'Public Domain Artist',
    licenseurl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    runtime: '120'
  },
  files: [{ name: 'public-domain-test.mp3', format: 'MP3', size: '123456' }]
};
const myspoti = {
  log() {},
  provide(name, fn) { hooks[name] = fn; },
  http: {
    get(url) {
      assert(url.includes('advancedsearch.php'));
      return { ok: true, json: () => searchPayload };
    },
    all(requests) {
      assert.strictEqual(requests.length, 1);
      return [{ ok: true, json: () => metadataPayload }];
    }
  }
};

const source = fs.readFileSync('extensions/archive-audio/main.js', 'utf8');
vm.runInNewContext(source, { myspoti, encodeURIComponent, console });
assert.strictEqual(typeof hooks['audio-source'], 'function');
assert.strictEqual(typeof hooks['download-source'], 'function');

const track = { title: 'Public Domain Test Track', artist: 'Public Domain Artist', durationMs: 120000 };
const stream = hooks['audio-source'](track);
assert(stream && stream.url.endsWith('/pd-test-track/public-domain-test.mp3'));
assert.strictEqual(stream.mimeType, 'audio/mpeg');
assert.strictEqual(stream.durationMs, 120000);

const downloads = hooks['download-source']({ ...track, quality: 'small' });
assert(Array.isArray(downloads) && downloads.length === 1);
assert.strictEqual(downloads[0].format, 'mp3');
assert.strictEqual(downloads[0].provider, 'Internet Archive (CC / Public Domain)');

// Reject an item without a permissive license before metadata is fetched.
let metadataCalls = 0;
myspoti.http.get = () => ({ ok: true, json: () => ({ response: { docs: [{
  identifier: 'not-licensed', title: track.title, creator: track.artist,
  licenseurl: 'https://creativecommons.org/licenses/by-nc/4.0/', runtime: '120'
}] } }) });
myspoti.http.all = () => { metadataCalls += 1; return []; };
assert.strictEqual(hooks['audio-source'](track), null);
assert.strictEqual(metadataCalls, 0);

// Reject a duration that is outside the host's accepted recording window.
myspoti.http.get = () => ({ ok: true, json: () => searchPayload });
myspoti.http.all = () => [{ ok: true, json: () => ({
  metadata: { ...metadataPayload.metadata, runtime: '180' }, files: metadataPayload.files
}) }];
assert.strictEqual(hooks['audio-source'](track), null);

console.log('Archive Audio tests passed.');
