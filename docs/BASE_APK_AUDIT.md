# Uploaded base.apk baseline audit

Audit date: 2026-11-10

## Artifact identity

- File: base.apk
- Size: 12,663,620 bytes
- SHA-256: 5877d553be550934e03a0746c3921344d3529e9a94fa5bfa9cba800f2f682cb8
- Manifest package: com.spotify.music
- Manifest application label: Spotify
- Manifest version name: 9.1.94.1929
- Manifest version code: 1121
- The manifest includes Myspoti application classes, including app.myspoti.MyspotiApplication and app.myspoti.MainActivity.

## Signing identity

The APK contains a JAR signing certificate with:

- Subject: EMAILADDRESS=android@android.com, CN=Android, OU=Android, O=Android, L=Mountain View, ST=California, C=US
- SHA-256 certificate fingerprint: A4:0D:A8:0A:59:D1:70:CA:A9:50:CF:15:C1:8C:45:4D:47:A3:9B:26:98:9D:8B:64:0E:CD:74:5B:A7:1B:F5:DC
- Signature algorithm: SHA1withRSA

This is the generic Android test/debug signing identity, not a project-specific release certificate.

## Comparison with this repository's build configuration

The source build config declares app.myspoti.stable for stable releases and app.myspoti for beta builds, and uses the app label Myspoti. The uploaded APK instead declares com.spotify.music and the label Spotify.

## Engineering decision

Keep this APK's hash and metadata as a reference for compatibility investigation only. Do not use it as the release-signing identity, do not preserve its Spotify package impersonation, and do not ship a rebuilt APK under the com.spotify.music package. The editable baseline for continued development is the GPL-3.0 source tree in this repository, with the package identity and signing process kept aligned to the Myspoti build configuration.
