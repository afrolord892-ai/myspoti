/*
 * Archive Audio (CC & Public Domain)
 *
 * This provider deliberately refuses items without a recognised, permissive
 * license URL, a matching title and artist, a known duration, and a playable
 * original audio file whose item duration matches the Spotify track.
 * It does not bypass DRM, logins, paywalls or provider restrictions.
 */
var IA = 'https://archive.org';
var LICENSE_RE = /^https?:\/\/creativecommons\.org\/(?:publicdomain\/(?:zero|mark)\/1\.0|licenses\/(?:by|by-sa)\/(?:2\.0|2\.5|3\.0|4\.0))\/?$/i;

function text(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function norm(value) {
  return text(value).toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(feat\.?|featuring|ft\.?)\b.*$/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function solr(value) {
  return text(value).replace(/([+\-!(){}\[\]^"~*?:\\/])/g, '\\$1');
}

function firstArtist(track) {
  if (track && track.artists && track.artists.length) {
    var first = track.artists[0];
    return text(first && (first.name || first));
  }
  return text(track && track.artist);
}

function licenseAllowed(value) {
  return LICENSE_RE.test(text(value));
}

function durationSeconds(value) {
  var v = text(value);
  if (!v) return 0;
  if (/^\d+(?:\.\d+)?$/.test(v)) return Number(v);
  var m = v.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?(?:\.(\d+))?$/);
  if (!m) return 0;
  if (m[3] !== undefined) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  return Number(m[1]) * 60 + Number(m[2]);
}

function titleMatches(itemTitle, wantedTitle) {
  var a = norm(itemTitle);
  var b = norm(wantedTitle);
  return !!a && !!b && (a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0);
}

function artistMatches(creator, wantedArtist) {
  var a = norm(creator);
  var b = norm(wantedArtist);
  return !!a && !!b && (a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0);
}

function formatOf(file) {
  var name = text(file && file.name).toLowerCase();
  if (/\.flac$/.test(name)) return 'flac';
  if (/\.mp3$/.test(name)) return 'mp3';
  if (/\.m4a$/.test(name)) return 'm4a';
  return '';
}

function chooseFiles(files, identifier) {
  if (!Array.isArray(files)) return [];
  return files.filter(function (f) {
    var format = formatOf(f);
    var name = text(f && f.name);
    if (!format || !name || name.indexOf('/') >= 0 || name.indexOf('..') >= 0) return false;
    if (/(__ia_thumb|_meta\.|\.xml$|\.jpg$|\.png$)/i.test(name)) return false;
    if (f.private === true || f.private === 'true' || f.source === 'metadata') return false;
    return true;
  }).map(function (f) {
    return {
      url: IA + '/download/' + encodeURIComponent(identifier) + '/' + encodeURIComponent(f.name),
      format: formatOf(f),
      sizeHint: Number(f.size) > 0 ? Number(f.size) : undefined,
      provider: 'Internet Archive (CC / Public Domain)'
    };
  });
}

function resolve(track) {
  if (!track || !text(track.title) || !firstArtist(track) || !(Number(track.durationMs) > 0)) return null;

  var wantedTitle = text(track.title);
  var wantedArtist = firstArtist(track);
  var wantedSeconds = Number(track.durationMs) / 1000;
  var query = 'mediatype:audio AND title:"' + solr(wantedTitle) + '"';
  var searchUrl = IA + '/advancedsearch.php?q=' + encodeURIComponent(query) +
    '&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=creator&fl%5B%5D=licenseurl&fl%5B%5D=runtime&rows=8&page=1&output=json';

  try {
    var search = myspoti.http.get(searchUrl, { timeout: 4000 });
    if (!search.ok) return null;
    var payload = search.json();
    var docs = payload && payload.response && payload.response.docs;
    if (!Array.isArray(docs) || !docs.length) return null;

    var candidates = docs.filter(function (item) {
      return item && text(item.identifier) &&
        titleMatches(item.title, wantedTitle) &&
        artistMatches(item.creator, wantedArtist) &&
        licenseAllowed(item.licenseurl);
    }).slice(0, 4);
    if (!candidates.length) return null;

    var requests = candidates.map(function (item) {
      return { url: IA + '/metadata/' + encodeURIComponent(item.identifier), timeout: 4000 };
    });
    var replies = myspoti.http.all(requests);

    var matches = [];
    for (var i = 0; i < replies.length; i++) {
      var reply = replies[i];
      if (!reply || reply.error || !reply.ok) continue;
      var record;
      try { record = reply.json(); } catch (e) { continue; }
      var metadata = record && record.metadata;
      if (!metadata || !licenseAllowed(metadata.licenseurl)) continue;
      if (!titleMatches(metadata.title, wantedTitle) || !artistMatches(metadata.creator, wantedArtist)) continue;

      var seconds = durationSeconds(metadata.runtime || candidates[i].runtime);
      if (!(seconds > 0)) continue;
      var delta = seconds - wantedSeconds;
      if (delta < -5 || delta > 15) continue;

      var files = chooseFiles(record.files, candidates[i].identifier);
      if (!files.length) continue;
      files.forEach(function (f) { f.durationMs = Math.round(seconds * 1000); });
      matches.push({ files: files, durationMs: Math.round(seconds * 1000), license: text(metadata.licenseurl) });
    }
    return matches.length ? matches[0] : null;
  } catch (e) {
    myspoti.log('Archive Audio lookup failed:', text(e && e.message || e));
    return null;
  }
}

myspoti.provide('audio-source', function (track) {
  var match = resolve(track);
  if (!match) return null;
  var preferred = match.files.filter(function (f) { return f.format === 'mp3' || f.format === 'm4a' || f.format === 'flac'; });
  if (!preferred.length) return null;
  var file = preferred[0];
  var mime = file.format === 'mp3' ? 'audio/mpeg' : (file.format === 'm4a' ? 'audio/mp4' : 'audio/flac');
  return {
    url: file.url,
    mimeType: mime,
    durationMs: match.durationMs,
    source: 'Internet Archive · permissive license'
  };
});

myspoti.provide('download-source', function (track) {
  var match = resolve(track);
  if (!match) return null;
  var quality = text(track && track.quality) || 'cd';
  var rank = quality === 'hi-res' ? { flac: 0, m4a: 1, mp3: 2 } :
    (quality === 'small' ? { mp3: 0, m4a: 1, flac: 2 } : { flac: 0, m4a: 1, mp3: 2 });
  return match.files.slice().sort(function (a, b) {
    return (rank[a.format] === undefined ? 9 : rank[a.format]) -
      (rank[b.format] === undefined ? 9 : rank[b.format]);
  }).slice(0, 10).map(function (file) {
    return {
      url: file.url,
      format: file.format,
      sizeHint: file.sizeHint,
      provider: 'Internet Archive (CC / Public Domain)'
    };
  });
});
