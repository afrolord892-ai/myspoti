# LRCLIB Synced Lyrics

A Myspoti extension that requests lyrics from LRCLIB's documented /api/get and /api/search endpoints.

## Matching and privacy

- Checks the returned track title, primary artist, and duration before displaying a result.
- Uses LRCLIB's exact-match endpoint first, then a bounded search fallback.
- Prefers timestamped LRC lines; plain text is optional in the extension settings.
- Keeps only the last result in the extension's in-memory runtime cache for ten minutes.
- Does not submit lyrics, publish edits, create an account, or send Spotify credentials.

LRCLIB's API is public and does not require an API key. Its documented exact-match endpoint uses track title, artist, album (when available), and duration. See https://lrclib.net/docs.

## Installation

Myspoti 2.4.0 or newer is required. Install from the Myspoti extension store after this package is published, or install the generated package directly.
