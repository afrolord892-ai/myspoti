# Extension expansion: verified scope and implementation status

Updated: 2026-11-10

## What the current Myspoti extension API supports

The existing API supports lyrics, lyrics romanisation, track metadata, ordered audio-source and download-source providers, Home/search blocks, menus, player buttons, playback controls and events, settings, and UI looks. Extension actions are a closed catalogue; a manifest cannot safely invent a new action.

The API does not expose video.source or video.download. Myspoti already has a built-in music-video playback path, but a rights-aware video download feature needs core-app design and implementation, not an extension that declares a nonexistent hook. Any future video save flow must be limited to content the user owns or is expressly authorised to download.

## Implemented provider packages

### Archive Audio (CC & Public Domain)

- Audio streaming and offline audio file options from Internet Archive.
- Checks explicit Public Domain Mark, CC0, CC BY or CC BY-SA license URLs.
- Requires matching title, creator and a known duration within the provider's acceptance window.
- Does not use account cookies, DRM handling, paywall bypasses or private tokens.
- Mocked scenario covers a permitted item, an excluded non-commercial item, and a duration mismatch.

### LRCLIB Synced Lyrics

- Uses LRCLIB's documented exact-match /api/get endpoint first, then its /api/search fallback.
- Requires a normalized title and primary-artist match; duration must be within two seconds when known.
- Converts LRC timestamps to Myspoti milliseconds and prefers synced lyrics.
- Plain lyrics are optional and controlled by a setting; instrumental/no-lyrics results are ignored.
- Uses anonymous read-only API access; never publishes, edits, or uploads lyrics.

### MusicBrainz Track Details

- Adds read-only recording metadata: release name/date, ISRC and MusicBrainz recording ID when present.
- Requires exact normalized title and primary-artist matches; recording length must be within five seconds when supplied.
- Sends a meaningful User-Agent, keeps a 24-hour in-memory cache and throttles its own calls to one per 1.1 seconds.
- Service term: MusicBrainz documents free use for non-commercial purposes and requires commercial users to contact it. Do not enable this provider for a commercial Myspoti deployment without resolving those terms with MusicBrainz.

## Verification

Every listed provider has a manifest, least-privilege network host list, matching logic, source README, regression tests, package ZIP, index entry, and mock hook scenario. CI verifies ZIP hashes and manifest consistency, builds the official extension CLI, runs myspoti-ext check, and executes the mocked scenarios. A provider is not counted as implemented until this workflow passes.

## Why 80+ is not being called complete

Adding 80 names, empty manifests, duplicate wrappers or imaginary API actions would produce a misleading extension store. The public ecosystem found during this pass is small, and each genuine provider needs API compatibility, licence/terms review, request limits, host permissions, matching logic and tests. This branch is the working foundation for expanding provider-by-provider, not a claim that 80 integrations already exist.

## Next engineering batch

1. Add more verified lyric, metadata and authorised audio providers where their API terms and host contracts permit.
2. Design a dedicated, rights-aware video-source/download core API before advertising video downloads.
3. Run the full Android build and device-level player/download checks before preparing an APK release.
