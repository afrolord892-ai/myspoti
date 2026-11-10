package com.music.spotui.data

import com.music.spotui.data.entity.ArtistsModel
import com.music.spotui.data.entity.LibraryEntry
import com.music.spotui.data.local.LibraryChip
import com.music.spotui.data.local.LibraryChips
import org.junit.Assert.assertEquals
import org.junit.Test

class LibraryChipsTest {
    private fun playlist(id: String) = LibraryEntry(spotifyId = id, name = id, subtitle = "", coverUri = "", isPlaylist = true)
    private fun album(id: String) = LibraryEntry(spotifyId = id, name = id, subtitle = "", coverUri = "", isPlaylist = false)
    private fun folder(id: String) = LibraryEntry(spotifyId = id, name = id, subtitle = "", coverUri = "", isPlaylist = false, folderUri = id)

    private val liked = playlist("liked")
    private val local = playlist("local")
    private val episodeCollection = playlist("episodes")
    private val songIds = setOf("liked", "local")
    private val podcastIds = setOf("episodes")
    private val entries = listOf(liked, local, episodeCollection, playlist("p1"), album("a1"), folder("f1"), playlist("p2"), album("a2"))
    private val artists = listOf(ArtistsModel("Adele", "", "1"), ArtistsModel("Zaz", "", "2"))
    private val shows = listOf(playlist("show-1"), playlist("show-2"))

    private fun ids(chip: LibraryChip) =
        LibraryChips.apply(chip, entries, artists, songIds, shows = shows, podcastIds = podcastIds).first.map { it.spotifyId }

    @Test fun allKeepsEverythingForLegacyCallers() {
        val (e, a) = LibraryChips.apply(LibraryChip.ALL, entries, artists, songIds, shows = shows, podcastIds = podcastIds)
        assertEquals(entries, e)
        assertEquals(artists, a)
    }

    @Test fun musicExcludesPodcastCollectionsButKeepsFollowedArtists() {
        val (e, a) = LibraryChips.apply(LibraryChip.MUSIC, entries, artists, songIds, shows = shows, podcastIds = podcastIds)
        assertEquals(listOf("liked", "local", "p1", "a1", "f1", "p2", "a2"), e.map { it.spotifyId })
        assertEquals(artists, a)
    }

    @Test fun playlistsKeepPlaylistsAndFoldersButNotSongOrPodcastRows() =
        assertEquals(listOf("p1", "f1", "p2"), ids(LibraryChip.PLAYLISTS))

    @Test fun albumsKeepOnlyAlbums() = assertEquals(listOf("a1", "a2"), ids(LibraryChip.ALBUMS))

    @Test fun songsKeepLikedAndPhoneRows() = assertEquals(listOf("liked", "local"), ids(LibraryChip.SONGS))

    @Test fun episodesAndShowsAreSeparatePodcastCollections() {
        assertEquals(listOf("episodes"), ids(LibraryChip.EPISODES))
        assertEquals(listOf("show-1", "show-2"), ids(LibraryChip.SHOWS))
        assertEquals(listOf("episodes", "show-1", "show-2"), ids(LibraryChip.PODCASTS))
    }

    @Test fun artistsKeepOnlyTheArtists() {
        val (e, a) = LibraryChips.apply(LibraryChip.ARTISTS, entries, artists, songIds)
        assertEquals(emptyList<LibraryEntry>(), e)
        assertEquals(artists, a)
        assertEquals(emptyList<ArtistsModel>(), LibraryChips.apply(LibraryChip.ALBUMS, entries, artists, songIds).second)
    }

    @Test fun tappingAChildFilterAgainReturnsToItsParentView() {
        assertEquals(LibraryChip.MUSIC, LibraryChips.toggle(LibraryChip.PLAYLISTS, LibraryChip.PLAYLISTS, LibraryChip.MUSIC))
        assertEquals(LibraryChip.EPISODES, LibraryChips.toggle(LibraryChip.SHOWS, LibraryChip.SHOWS, LibraryChip.EPISODES))
        assertEquals(LibraryChip.ARTISTS, LibraryChips.toggle(LibraryChip.MUSIC, LibraryChip.ARTISTS, LibraryChip.MUSIC))
    }
}
