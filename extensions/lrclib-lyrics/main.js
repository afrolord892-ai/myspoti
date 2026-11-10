/* LRCLIB Synced Lyrics — Myspoti extension API v1. */
var ROOT = 'https://lrclib.net';
var PROVIDER = 'LRCLIB';
var CACHE_MS = 10 * 60 * 1000;
var lastCacheKey = '';
var lastCacheAt = 0;
var lastCacheValue = null;

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

function firstArtist(track) {
  if (track && Array.isArray(track.artists) && track.artists.length) {
    var a = track.artists[0];
    return clean(a && (a.name || a));
  }
  return clean(track && track.artist);
}

function trackMatches(record, track) {
  if (!record || !track) return false;
  var title = normal(record.trackName || record.name);
  var artist = normal(record.artistName);
  if (!title || title !== normal(track.title)) return false;
  if (!artist || artist !== normal(firstArtist(track))) return false;
  var wanted = Number(track.durationMs) / 1000;
  var actual = Number(record.duration);
  if (wanted > 0 && actual > 0 && Math.abs(wanted - actual) > 2) return false;
  return true;
}

function parseLrc(value) {
  var out = [];
  var rows = clean(value).split(/\r?\n/);
  var stamp = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  rows.forEach(function (row) {
    var matches = [];
    var match;
    stamp.lastIndex = 0;
    while ((match = stamp.exec(row)) !== null) {
      var fraction = match[3] || '0';
      var millis = Number((fraction + '00').slice(0, 3));
      matches.push(Number(match[1]) * 60000 + Number(match[2]) * 1000 + millis);
    }
    if (!matches.length) return;
    var lyric = row.replace(stamp, '').trim();
    if (!lyric) return;
    matches.forEach(function (time) { out.push({ time: time, text: lyric }); });
  });
  out.sort(function (a, b) { return a.time - b.time; });
  return out;
}

function usable(record, track) {
  if (!trackMatches(record, track) || record.instrumental === true) return null;
  var synced = parseLrc(record.syncedLyrics);
  if (synced.length) return { provider: PROVIDER, synced: true, lines: synced };
  if (myspoti.settings.get('plainToo') !== false) {
    var plain = clean(record.plainLyrics);
    if (plain) return { provider: PROVIDER, synced: false, plain: plain };
  }
  return null;
}

function request(path, params) {
  var url = ROOT + path + '?' + myspoti.query(params);
  return myspoti.http.get(url, {
    timeout: 5000,
    headers: { 'Accept': 'application/json', 'Lrclib-App-Id': 'Myspoti-Afrolord/1.0' }
  });
}

function lookup(track) {
  var title = clean(track && track.title);
  var artist = firstArtist(track);
  var duration = Math.round(Number(track && track.durationMs) / 1000);
  if (!title || !artist || !(duration >= 1 && duration <= 3600)) return null;

  var key = [normal(title), normal(artist), normal(track.album), duration].join('|');
  var now = Date.now();
  if (key === lastCacheKey && now - lastCacheAt < CACHE_MS) return lastCacheValue;

  var exact = request('/api/get', {
    track_name: title,
    artist_name: artist,
    album_name: clean(track.album) || undefined,
    duration: duration
  });
  if (exact.ok) {
    var answer = usable(exact.json(), track);
    if (answer) {
      lastCacheKey = key; lastCacheAt = now; lastCacheValue = answer;
      return answer;
    }
  }

  var search = request('/api/search', { track_name: title, artist_name: artist });
  if (!search.ok) return null;
  var rows = search.json();
  if (!Array.isArray(rows)) return null;
  rows.sort(function (a, b) {
    return Math.abs(Number(a.duration || 0) - duration) - Math.abs(Number(b.duration || 0) - duration);
  });
  for (var i = 0; i < rows.length; i++) {
    var candidate = usable(rows[i], track);
    if (candidate) {
      lastCacheKey = key; lastCacheAt = now; lastCacheValue = candidate;
      return candidate;
    }
  }
  lastCacheKey = key; lastCacheAt = now; lastCacheValue = null;
  return null;
}

myspoti.provide('lyrics', function (track) {
  try {
    return lookup(track);
  } catch (e) {
    myspoti.log('LRCLIB lookup failed:', clean(e && e.message || e));
    return null;
  }
});
