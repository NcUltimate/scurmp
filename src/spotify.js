SPOTIFY = {
  LIKED_SONGS: 'Liked Songs',
  PLAYLIST_VIEW_QUERY: '.Root__main-view .os-viewport-native-scrollbars-invisible',
  PLAYLIST_HEADER_QUERY: '[data-testid="playlist-page"] h1',
  PLAYLIST_TABLE_QUERY: '[aria-rowcount][aria-label][role="grid"][aria-label]',
  PLAYLIST_TRACKS_QUERY: '[role="row"][aria-rowindex]:not([class])',

  TRACK_INDEX_QUERY: '[role="gridcell"][aria-colindex="1"]',
  TRACK_TITLE_QUERY: '[role="gridcell"][aria-colindex="2"] a[data-testid="internal-track-link"]',

  PLAYLISTS: {},

  async tracks(searchName = this.LIKED_SONGS) {
    // Choose a playlist matching the search term
    const result = this._select_playlist(searchName);
    if(!result.success) {
      console.log('PLAYLIST = []');
      return [];
    }

    // Normalize the search result and ensure we haven't scanned it already,
    // creating a new array to store the search results in if needed.
    const nPlaylistName = this._normalize(result.name);
    if(this.PLAYLISTS[nPlaylistName]?.length > 0) {
       console.log('PLAYLIST = ' + JSON.stringify(this.PLAYLISTS[nPlaylistName]));
       return this.PLAYLISTS[nPlaylistName];
    } else {
      this.PLAYLISTS[nPlaylistName] = [];
    }

    // Wait for the playlist page to load
    await this._open_playlist(result);

    const numTracksInPlaylist = parseInt(this.$table().getAttribute('aria-rowcount')) - 1;
    while(this.PLAYLISTS[nPlaylistName].length < numTracksInPlaylist) {
      this._process_visible_tracks(nPlaylistName);
      await this._load_more_tracks();
    }

    console.log('PLAYLIST = ' + JSON.stringify(this.PLAYLISTS[nPlaylistName]));
    return this.PLAYLISTS[nPlaylistName];
  },

  $view() {
    return this.$find(this.PLAYLIST_VIEW_QUERY);
  },

  $header() {
    return this.$find(this.PLAYLIST_HEADER_QUERY);
  },

  $table() {
    return this.$find(this.PLAYLIST_TABLE_QUERY);
  },

  $tracks() {
    return this.$findAll(this.PLAYLIST_TRACKS_QUERY, this.$table());
  },

  $find(selector, $element = document) {
    return $element.querySelector(selector);
  }, 

  $findAll(selector, $element = document) {
    const result = $element.querySelectorAll(selector);
    return result ? Array.from(result) : [];
  },  

  _get_playlist_digest() {
    return this
      .$tracks()
      .map($t => $t.innerText)
      .join();
  },

  _process_visible_tracks(nPlaylistName) {
    this.$tracks().forEach($track => {
      // Index always starts at 1 on Spotify
      const index = parseInt(this.$find(this.TRACK_INDEX_QUERY, $track)?.innerText || '') - 1;
      if(index < 0 || this.PLAYLISTS?.[nPlaylistName]?.[index]) {
        return;
      }

      const $title = this.$find(this.TRACK_TITLE_QUERY, $track);
      const title = $title.innerText.toLowerCase();
      const titleBreak = title.search(/[\(\-]/);

      let prettyTitle = title;
      if(titleBreak !== -1) {
        prettyTitle = title.substring(0, titleBreak).trim();
      }

      const $artists = this.$findAll('span', $title.parentElement).pop();
      const prettyArtists = $artists.innerText.split(', ').map(a => a.toLowerCase());

      let remixArtist;
      let maxSearchIndex = -1;
      prettyArtists.forEach(artistName => {
        const possibleRemixArtistRegexp = new RegExp(`${artistName}.+?(?:remix|bootleg|edit)`);
        const searchResult = title.search(possibleRemixArtistRegexp);
        if(searchResult > maxSearchIndex) {
          maxSearchIndex = searchResult;
          remixArtist = artistName;
        }
      });

      this.PLAYLISTS[nPlaylistName][index] = Object.assign({},
        {
          name: prettyTitle,
          artists: prettyArtists,
        },
        !remixArtist ? {} : {
          is_remix: true,
          remix_artist: remixArtist,
        },
      );
    });
  },

  _select_playlist(searchName) {
    const nPlaylistName = this._normalize(searchName);

    if(nPlaylistName === this._normalize(this.LIKED_SONGS)) {
      return {
        success: true,
        name: 'Liked Songs',
        playlist: this.$find('a[href="/collection/tracks"]'),
        reason: 'default',
      };
    }

    const $playlists = this.$findAll('[data-testid="rootlist-item"] a');
    const $matchingPlaylists = $playlists.filter($playlistElement => {
      const nPossiblePlaylistName = this._normalize($playlistElement.innerText);
      return nPossiblePlaylistName.includes(nPlaylistName);
    });
    
    if($matchingPlaylists.length === 0) {
      return {
        success: false,
        name: '',
        playlist: undefined,
        reason: 'no_match',
      };
    }
    
    let playlistIndex = 0;
    if($matchingPlaylists.length > 1) {
      const promptStr =
        'Multiple playlists match your entry. Which would you like to process?\n\n'
        + $matchingPlaylists.map(($p, i) => `${i}. ${$p.innerText}`).join('\n');

      playlistIndex = -1;
      while(playlistIndex !== NaN && (playlistIndex < 0 || playlistIndex >= $matchingPlaylists.length)) {
        playlistIndex = parseInt(prompt(promptStr));
      }

      if(Number.isNaN(playlistIndex)) {
        return {
          success: false,
          name: '',
          playlist: undefined,
          reason: 'no_selection',
        };
      }
    }

    const $selection = $matchingPlaylists[playlistIndex];
    return {
      success: true,
      name: $selection.innerText,
      playlist: $selection,
      reason: 'selection',
    };
  },

  _open_playlist(target) {
    return new Promise(resolve => {
      if(!target.success) {
        return resolve();
      }

      target.playlist.click();

      const intervalID = setInterval(() => {
        const $trackElements = this.$findAll('[data-testid="internal-track-link"]');
        const playlistHeaderText = this.$header()?.innerText;

        if(playlistHeaderText === target.name && $trackElements.length > 0) {
          clearInterval(intervalID);
          return resolve();
        }
      }, 50);
    });
  },

  _load_more_tracks() {
    return new Promise(resolve => {
      let maxWait = 40;
      const currentDigest = this._get_playlist_digest();

      const $visibleTracks = this.$tracks();
      $visibleTracks[$visibleTracks.length - 1].scrollIntoView();

      const waitInterval = setInterval(() => {
        const newDigest = this._get_playlist_digest();

        if(maxWait-- === 0 || currentDigest !== newDigest) {
          clearInterval(waitInterval);
          return resolve();
        }
      }, 50);
    });
  },

  // Generate an easily comparable name for a playlist string. Strips emojis, punctuation,
  // and all other non-alphabetical characters. Makes it easy to search for a playlist like
  // "2022 - B A N G E R S - O N L Y - 🔥" by just typing 'bangers only'.
  _normalize(name) {
    return name ? name.trim().replaceAll(/\W/g, '').toLowerCase() : '';
  },
};
  