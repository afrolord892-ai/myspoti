# MusicBrainz Track Details

A read-only Myspoti track-details extension. It searches MusicBrainz for the current recording and adds a native details section containing the recording title, release information, first-release date, ISRCs and MusicBrainz identifier when those fields are present.

## Matching, rate limits and service terms

- The extension requires an exact normalized title and primary-artist match.
- When MusicBrainz provides a recording length, it must be within five seconds of the playing track.
- Results are cached in the extension runtime for 24 hours; failed or ambiguous lookups return no block.
- The extension sends a descriptive User-Agent and makes at most one request per second from its runtime, following MusicBrainz's documented guidance.
- It uses the public read API only; it does not submit or modify MusicBrainz data and does not read account information.

MusicBrainz documents that its web service is free for non-commercial use and asks clients to make no more than one request per second with a meaningful User-Agent. Commercial deployment requires contacting MusicBrainz about its commercial plans: https://musicbrainz.org/doc/MusicBrainz_API and https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting.

## Installation

Myspoti 2.4.0 or newer is required. Install from the Myspoti extension store after this package is published, or install the generated package directly.
