/* MusicBrainz Track Details — read-only public metadata lookup. */
var API = 'https://musicbrainz.org/ws/2/recording/';
var USER_AGENT = 'Myspoti-MusicBrainz/1.0 (https://github.com/afrolord892-ai/myspoti)';
var CACHE_MS = 24 * 60 * 60 * 1000;
var lastRequestAt = 0;
var lastKey = '';
var lastAt = 0;
var lastBlocks = null;

function clean(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}

function normal(value) {
  return clean(value).toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(feat\.?|featuring|ft\.?)\b.*$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function quote(value) {
  return '"' + clean(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function primaryArtist(recording) {
  var credit = recording && recording['artist-credit'];
  if (!Array.isArray(credit)) return '';
  for (var i = 0; i < credit.length; i++) {
    if (credit[i] && credit[i].artist && credit[i].artist.name) return clean(credit[i].artist.name);
  }
  return '';
}

function matching(recording, track) {
  if (!recording || normal(recording.title) !== normal(track.title)) return false;
  if (normal(primaryArtist(recording)) !== normal(track.artist || (track.artists && track.artists[0]))) return false;
  var actual = Number(recording.length);
  var wanted = Number(track.durationMs);
  if (actual > 0 && wanted > 0 && Math.abs(actual - wanted) > 5000) return false;
  return true;
}

function makeBlocks(recording) {
  var rows = [];
  var date = clean(recording['first-release-date']);
  var isrcs = Array.isArray(recording.isrcs) ? recording.isrcs.slice(0, 5) : [];
  var releases = Array.isArray(recording.releases) ? recording.releases.slice(0, 2) : [];
  var releaseNames = releases.map(function (r) { return clean(r.title); }).filter(Boolean);
  rows.push({ type: 'text', text: 'Recording: ' + clean(recording.title), style: 'body' });
  if (releaseNames.length) rows.push({ type: 'text', text: 'Release: ' + releaseNames.join(' · '), style: 'body' });
  if (date) rows.push({ type: 'text', text: 'First release: ' + date, style: 'caption' });
  var identifiers = [];
  if (isrcs.length) identifiers.push('ISRC: ' + isrcs.join(', '));
  if (recording.id) identifiers.push('MusicBrainz ID: ' + clean(recording.id));
  if (identifiers.length) rows.push({ type: 'text', text: identifiers.join(' · '), style: 'caption' });
  return [{ type: 'section', title: 'MusicBrainz details', subtitle: 'Public recording metadata', blocks: rows }];
}

function lookup(track) {
  var title = clean(track && track.title);
  var artist = clean(track && (track.artist || (track.artists && track.artists[0])));
  if (!title || !artist) return null;
  var key = normal(title) + '|' + normal(artist) + '|' + Number(track.durationMs || 0);
  var now = Date.now();
  if (key === lastKey && now - lastAt < CACHE_MS) return lastBlocks;
  // MusicBrainz asks clients to make no more than one request per second.
  if (now - lastRequestAt < 1100) return null;
  lastRequestAt = now;
  var query = 'recording:' + quote(title) + ' AND artist:' + quote(artist);
  var url = API + '?' + myspoti.query({ query: query, fmt: 'json', limit: 5 });
  var response = myspoti.http.get(url, {
    timeout: 6000,
    headers: { 'Accept': 'application/json', 'User-Agent': USER_AGENT }
  });
  if (!response.ok) return null;
  var payload = response.json();
  var candidates = payload && payload.recordings;
  if (!Array.isArray(candidates)) return null;
  candidates.sort(function (a, b) {
    return Math.abs(Number(a.length || 0) - Number(track.durationMs || 0)) -
      Math.abs(Number(b.length || 0) - Number(track.durationMs || 0));
  });
  var found = null;
  for (var i = 0; i < candidates.length; i++) {
    if (matching(candidates[i], track)) { found = candidates[i]; break; }
  }
  lastKey = key;
  lastAt = now;
  lastBlocks = found ? makeBlocks(found) : null;
  return lastBlocks;
}

myspoti.provide('trackinfo', function (track) {
  try {
    return lookup(track);
  } catch (e) {
    myspoti.log('MusicBrainz lookup failed:', clean(e && e.message || e));
    return null;
  }
});
