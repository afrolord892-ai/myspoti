# Archive Audio (CC & Public Domain)

A Myspoti extension for streaming and offline audio from Internet Archive items that declare a recognised permissive license.

## Safety and matching rules

The extension accepts only explicit Creative Commons Zero (CC0), Public Domain Mark, CC BY or CC BY-SA license URLs. It refuses other licenses, missing license metadata, missing artist/title metadata, unknown durations, and items outside Myspoti's accepted duration window. It does not log in to services, extract protected streams, bypass DRM, or use private account cookies.

The Internet Archive is a metadata and file host, not a guarantee that every uploader's rights statement is correct. The extension checks the license supplied with each item, but users should still review the item's rights page before relying on a file for reuse or redistribution.

## Installation

Install from the Myspoti extension repository index published in this repository, or install this folder from a package after it has been released. Myspoti 2.4.0 or newer is required.

## Limitations

- This is a lawful fallback source, not a substitute for a commercial streaming catalogue.
- The Internet Archive may not contain the requested recording.
- Exact metadata and duration checks intentionally reject many search results rather than risk returning the wrong recording.
- It provides audio only. Myspoti's current extension API has no video-download action.

## Test

The mocked scenario lives in extensions/tests/archive-audio.json and is run by the extension CI workflow.
