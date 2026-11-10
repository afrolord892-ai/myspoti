# Myspoti Enhanced — Extension Platform Build Plan

This document tracks the proposed 80+ extension ecosystem for this fork. It is a build plan, not a claim that every listed integration is already implemented or verified.

## Compatibility and baseline

- Android source baseline: this repository's Myspoti source tree and documented extension API.
- User-provided APK: `base.apk`, SHA-256 `5877d553be550934e03a0746c3921344d3529e9a94fa5bfa9cba800f2f682cb8`.
- The APK is a compiled artifact. It is useful as a behavior/UI reference, but does not contain editable Kotlin/Compose source. Changes to app screens and player behavior must be made in source and rebuilt.
- Do not publish or sign a new APK with the input APK's identity/signature without establishing ownership and signing-key continuity.
- The Myspoti extension API supports sandboxed JavaScript manifests/hooks for lyrics, romanisation, audio source, download source, track info, Home/search blocks, player/menu actions and declared UI styles. See the upstream API docs: https://github.com/kota-zo/myspoti/blob/main/docs/extensions/API.md

## Product goals

1. Keep Spotify playback as a reliable fallback when an optional source is missing, offline, rate-limited, or returns an incompatible file.
2. Use provider adapters with explicit attribution, permitted-use notes, request timeouts, cache policies, and health checks.
3. Do not present metadata-only or search-page integrations as working audio/video downloaders.
4. Keep user consent and extension permission prompts intact. Never silently install critical audio/download permissions.
5. Use a consistent extension settings page: enable/disable, provider status, quality, cache clear, diagnostics, and source ordering.
6. Keep all download functionality limited to sources where the user has rights or the provider explicitly permits downloads. Do not bypass DRM, paywalls, or access controls.

## Target catalog (80+ adapter slots)

These are target adapter families. Each entry requires API validation, a license/terms review, a manifest, implementation, and tests before it can be marked ready.

### Lyrics and song information (20)
1. LRCLIB
2. NetEase Cloud Music lyrics
3. KuGou lyrics
4. Genius song meaning / attribution link
5. Musixmatch (authorized API access only)
6. Lyrics.com search/link
7. AZLyrics link resolver (no scraping unless permitted)
8. Songtexte link resolver
9. Tekstowo link resolver
10. Vagalume link resolver
11. Letras.mus.br link resolver
12. LyricFind (authorized API access only)
13. OpenLyrics provider adapter
14. Plain-text lyric fallback
15. LRC timestamp parser
16. Enhanced word-timing parser
17. Line translation adapter
18. Romanisation/transliteration adapter
19. Script/language detection
20. Lyrics cache and offline metadata

### Audio, radio, and lawful download sources (20)
21. Spotify native playback fallback
22. Internet Archive audio metadata/search
23. Internet Archive permitted-download adapter
24. Jamendo catalog (API/terms compliant)
25. Jamendo permitted stream/download adapter
26. Free Music Archive catalog (availability/terms checked)
27. Free Music Archive permitted-download adapter
28. Bandcamp user-owned purchase library helper (no access-control bypass)
29. SoundCloud authorized playback links
30. SoundCloud permitted-download links only
31. Audius catalog/stream adapter (API/terms compliant)
32. Radio Browser directory search
33. Radio Browser favorites
34. Public-domain audio catalog
35. Creative Commons filter and attribution
36. Local device audio library
37. Local folder scanner
38. Podcast RSS playback
39. Podcast RSS episode download where feed permits
40. Audio format/quality metadata inspector

### Video and music-video discovery (20)
41. YouTube official video search/link
42. YouTube Music official-video discovery
43. Vimeo public video links
44. Internet Archive video search
45. Internet Archive permitted video downloads
46. Wikimedia Commons video search
47. Wikimedia Commons media downloads
48. PeerTube instance discovery
49. PeerTube video playback
50. PeerTube downloads where instance permits
51. Dailymotion public video links
52. TED media links (where provided)
53. Public-domain film catalog
54. Creative Commons video catalog
55. Local video library
56. Local video folder scanner
57. Subtitle search/link adapter
58. Subtitle format parser (SRT/VTT)
59. Video metadata inspector
60. Video/audio playback handoff and sync diagnostics

### Discovery, utilities, UI, and library tools (24)
61. Album metadata enrichment
62. Artist biography/link enrichment
63. Release-date enrichment
64. ISRC lookup adapter
65. MusicBrainz metadata adapter
66. Discogs metadata adapter (authorized/API-compliant)
67. ListenBrainz scrobble (opt-in)
68. Last.fm scrobble (opt-in)
69. Playback history export
70. Playlist backup/export
71. Playlist import from supported formats
72. M3U playlist parser
73. PLS playlist parser
74. Queue export
75. Duplicate-track finder
76. Local library tag editor
77. Cover-art metadata lookup
78. Home shelf: new releases
79. Home shelf: public-domain picks
80. Search provider aggregator
81. Player button: open provider page
82. Player button: share track metadata
83. Context menu: copy ISRC
84. Context menu: copy Spotify URI

## Release gates

An extension is marked **Ready** only after:
- `myspoti-ext check` passes against the target app API;
- unit/fixture tests cover normal, empty, malformed, timeout and rate-limit responses;
- network hosts and permissions are documented;
- provider attribution and permitted-use conditions are recorded;
- no DRM, authentication wall, or geographic/access restriction is bypassed;
- installation, disable, removal and fallback behavior are tested on Android.

## Status

- [x] Repository branch created for this work.
- [x] APK hash recorded for traceability.
- [x] Extension API and provider categories documented.
- [ ] Inspect actual APK UI and compare with source build.
- [ ] Build provider adapters in batches with tests.
- [ ] Run Gradle build and extension CLI validation.
- [ ] Install and test on-device before claiming end-to-end functionality.
