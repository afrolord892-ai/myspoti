# Extension expansion: verified scope and implementation status

Updated: 2026-11-10

## What the current API supports

The Myspoti extension API exposes hooks for lyrics, romanisation, track information, audio source resolution, audio downloads, Home/search blocks, menus, player buttons, playback controls and events, settings, and UI looks. Audio downloads accept flac, dash-flac, m4a, and mp3 files.

The documented action catalogue does not expose a video.download or video.source action. The app has its own music-video playback path, but an ordinary extension cannot register a video downloader by declaring an invented action. A real video-download feature would require a separate core-app design and implementation, with explicit rights checks and support for content the user owns or is authorised to download.

## Public extension ecosystem found during this pass

The GitHub topic search for myspoti-extension returned only a small handful of repositories. Relevant projects include a YouTube Music download helper, an offline lyrics romaniser, an Eclipse FLAC bridge, a low-data audio extension, and a broad multi-provider extension. This is not an 80-package ecosystem, and an advertised provider is not automatically a verified or safe provider.

## Implemented in this repository

### Archive Audio (CC & Public Domain)

A new extension package is being added with:

- audio.source for streaming an exact-match item;
- download.source for offline audio files;
- explicit license URL checks for Public Domain Mark, CC0, CC BY, and CC BY-SA;
- title, artist, and duration checks before a file is returned;
- no login, cookies, DRM handling, paywall bypass, or private account tokens;
- a mocked test scenario and a Node regression test for accepted, unlicensed, and duration-mismatched results.

This is a lawful fallback catalogue, not a replacement for commercial streaming services. Internet Archive metadata can be incomplete or incorrectly supplied by uploaders, so a user should still review an item's rights page before reuse or redistribution.

## Why the 80+ request is not being represented as complete

An extension package must implement an actual provider or feature against the closed API, and the app asks the user to approve its permissions. Duplicating names, inventing action keys, or adding placeholder manifests would create a misleading store rather than working integrations. Video downloading also cannot be implemented as an extension-only feature with the current API.

The safe expansion path is to add and test individual providers that expose authorised content, plus core-app support for a rights-aware video download flow. Every provider needs its own manifest, least-privilege host list, matching logic, test fixtures, and release package. This repository should only count a provider as implemented after its tests pass and its source and licensing have been reviewed.
