package com.music.spotui.data.local

import com.music.spotui.data.entity.ArtistsModel
import com.music.spotui.data.entity.LibraryEntry

/** The two primary areas in Your Library. */
enum class LibrarySection { MUSIC, PODCASTS }

/**
 * Filters inside the Music and Podcasts areas. ALL remains available for older callers;
 * MUSIC excludes podcast collections, while Episodes and Shows are distinct podcast views.
 */
enum class LibraryChip {
    ALL, MUSIC, PLAYLISTS, BY_ME, ARTISTS, ALBUMS, SONGS, EPISODES, SHOWS,
    /** Compatibility filter for older callers that displayed episodes and shows together. */
    PODCASTS,
}

object LibraryChips {
    /**
     * [songIds] are the app's saved rows that contain songs rather than albums/playlists.
     * [podcastIds] are the saved podcast episode collections (Your Episodes / New Episodes).
     * [shows] is loaded separately because followed podcast shows are not in the music library.
     */
    fun apply(
        chip: LibraryChip,
        entries: List<LibraryEntry>,
        artists: List<ArtistsModel>,
        songIds: Set<String>,
        myId: String? = null,
        shows: List<LibraryEntry> = emptyList(),
        podcastIds: Set<String> = emptySet(),
    ): Pair<List<LibraryEntry>, List<ArtistsModel>> = when (chip) {
        LibraryChip.ALL -> entries to artists
        LibraryChip.MUSIC -> entries.filter { it.spotifyId !in podcastIds } to artists
        LibraryChip.ARTISTS -> emptyList<LibraryEntry>() to artists
        LibraryChip.SONGS -> entries.filter { it.spotifyId in songIds } to emptyList()
        LibraryChip.PLAYLISTS -> entries.filter { it.spotifyId !in songIds && it.spotifyId !in podcastIds && (it.isPlaylist || it.isFolder) } to emptyList()
        LibraryChip.BY_ME -> entries.filter { myId != null && it.ownerUri == "spotify:user:$myId" } to emptyList()
        LibraryChip.EPISODES -> entries.filter { it.spotifyId in podcastIds } to emptyList()
        LibraryChip.SHOWS -> shows to emptyList()
        LibraryChip.PODCASTS -> (entries.filter { it.spotifyId in podcastIds } + shows) to emptyList()
        LibraryChip.ALBUMS -> entries.filter { it.spotifyId !in songIds && it.spotifyId !in podcastIds && !it.isPlaylist && !it.isFolder } to emptyList()
    }

    /** A tap on [tapped] while [current] is chosen. */
    fun toggle(current: LibraryChip, tapped: LibraryChip, fallback: LibraryChip = LibraryChip.ALL): LibraryChip =
        if (current == tapped) fallback else tapped
}
