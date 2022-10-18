SOUNDCLOUD = {
  RECORD_LABELS: [
    "2-Dutch",
    "3BEAT",
    "AFTR:HRS",
    "Anjunabeats",
    "Anjunadeep",
    "Arkade",
    "Armada Music",
    "ATLAST",
    "Azureon: Submerged",
    "Bass House Music",
    "BASSX",
    "Big Beat Records",
    "Bitbird",
    "Bourne Recordings",
    "ChillYourMind",
    "Chill Planet",
    "Chill Trap Records",
    "CloudKid",
    "CONFESSION",
    "Deadbeats",
    "DND RECS",
    "Dharma Worldwide",
    "Dim Mak Records",
    "Disciple ♛ ♜ ♞",
    "EDM.com",
    "Enhanced",
    "Enhanced Progressive",
    "EnormousTunes",
    "Film Noir Sound",
    "Fire Ball Records",
    "Future Bass XO",
    "Future Generation",
    "Future House Cloud",
    "Future House Music",
    "Futurized Records",
    "Gemstone Records",
    "Gud Vibrations",
    "Heartfeldt Records",
    "HEXAGON",
    "HUB Records",
    "Hegemon: Wonderlust",
    "Heldeep Records",
    "House Call Records",
    "House Views.",
    "Hysteria Records",
    "IN / ROTATION",
    "InYourBassment.com",
    "Insomniac Records",
    "Kernkraft Records",
    "LYD",
    "League of Legends",
    "Lowly.",
    "MA Music",
    "Magic Records",
    "Mau5trap",
    "Maxximize Records",
    "Miami Beats",
    "Mixmash Records",
    "Monstercat",
    "MrSuicideSheep",
    "Musical Freedom",
    "NCS",
    "Next Wave",
    "Night Bass",
    "NIGHTMODE",
    "Night Service Only",
    "Ones To Watch Records",
    "Pantheon Select",
    "Panther's Groove",
    "PARAMETRIC",
    "PINNACLE COLLECTIVE",
    "Protocol Recordings",
    "Proximity",
    "Revealed Recordings",
    "Roche Musique",
    "SABLE VALLEY",
    "S I Z E",
    "SKINK",
    "Seal Network",
    "Selected.",
    "Simplify.",
    "Sirup Music",
    "SKINK",
    "Smash The House",
    "Soave",
    "Soave Tunes",
    "Spinnin' Copyright Free Music",
    "Spinnin' Deep",
    "Spinnin' Records",
    "Spinnin' Talent Pool",
    "Spirited.",
    "Spotted Records",
    "Strange Fruits",
    "Subsidia",
    "Take It Easy Records",
    "TechniqueRecordings",
    "The Music Network",
    "This Never Happened",
    "Thissongissick.com",
    "Tuvali",
    "Uprise Music",
    "ZERO COOL",
  ],
  SPECIAL_CHAR_MAP: {
    'ã': 'a', // e.g. pontos de exclamação
    'ä': 'a', // e.g. john dahlbäck
    'â': 'a', // e.g. françois-rené duchâble
    'æ': 'ae', // e.g. mædi
    'ç': 'c', // e.g. pontos de exclamação
    'Δ': 'a', //e.g. deltΔ heΔvy
    'ë': 'e', // e.g. Tiësto
    'é': 'e', // e.g. emelie cyréus, isabèl usher
    'ē': 'e', // e.g. anamē
    'í': 'i', // e.g. sofía reyes, oisín
    'ø': 'o', // e.g. Mø, xylø, møme
    'ö': 'o', // e.g. öwnboss, möwe
    'ó': 'o', // e.g. jenő jandó
    'ő': 'o', // e.g. jenő jandó
    '$': 's', // e.g. ty dolla $ign
    'ü': 'u', // e.g. gattüso
    '’': "'", // sometimes these ticks appear instead of a single quote
    '&': 'and', // e.g. years & years, raven & kreyn
    'ℤ': 'z', //e.g. LℤRD
  },
  ARTIST_EXCEPTIONS: {
    'eliminate' : 'eliminate*',
    'richard judge' : 'j.u.d.g.e.',
    'dj shaan': 'shaan',
    'ghastly': '𝐆𝐇𝐀𝐒𝐓𝐋𝐘||𝐆𝐇𝐄𝐍𝐆𝐀𝐑',
    'nurko': 'ɴᴜʀᴋᴏ💧',
    'third party': 'Third ≡ Party',
    'wooli': 'Wooli 🐘',
  },
  init() {
    this.RECORD_LABELS = this.RECORD_LABELS.map(label => this._sanitize(label));
  },

  $find(selector, $element = document) {
    return $element.querySelector(selector);
  }, 

  $findAll(selector, $element = document) {
    const result = $element.querySelectorAll(selector);
    return result ? Array.from(result) : [];
  },  

  async search(term) {
    let $searchResultItems = await this._search_for(term);
    return $searchResultItems.map(($result, index) => {
      const $title = $result.querySelector('.soundTitle__title');
      title = $title?.innerText || '';

      const $user = $result.querySelector('.soundTitle__usernameText');
      user = $user?.innerText || '';

      const $plays = $result.querySelector('.sound__soundStats .sc-ministats-item');
      plays = $plays?.getAttribute('title')?.replaceAll(/\D/g, '') || 0;

      return {
        title: this._sanitize(title),
        user: this._sanitize(user),
        plays: parseInt(plays),
        index: index,
      };
    });
  },
  async identify(trackName, artistNames, {remixArtist} = {}) {
    const isRemixAllowed = !!remixArtist;
    const nRemixArtist = this._sanitize(remixArtist);
    const nTrackName = this._sanitize(trackName);
    const nArtistNames = artistNames.map(a => this._sanitize(a));

    const remixRegexp = new RegExp(`${this._sanitize_regex(nRemixArtist)}.+?(remix|mix|edit|bootleg|vip mix)`);
    const userRegexp = new RegExp('^(' + nArtistNames.map(name => this._sanitize_regex(name) + ' ?(official|music)?').join('|') + ')$');

    let searchNames = nArtistNames;
    if(remixArtist && !searchNames.includes(remixArtist)) {
      searchNames.push(remixArtist);
    }

    let searchResults = await this.search(`${searchNames.join(' ')} ${trackName}`);

    // 1. Test for exact matches:
    //    - Track title contains the song title (allows for common endings like [OUT NOW], etc)
    //    - User is one of the artists
    //    - Track title contains a remix name if allowed
    exactMatches = searchResults.filter(result => {
      if(!result.title.includes(nTrackName)) {
        return false;
      }

      let isExactArtist = (
        userRegexp.test(result.user)
          || nArtistNames.find(nArtistName => result.user === this.ARTIST_EXCEPTIONS[nArtistName])
          || isRemixAllowed && result.user === nRemixArtist
      );

      if(!isExactArtist) {
        return false;
      }

      if(!isRemixAllowed && result.title.includes('remix')) {
        return false;
      } else if(isRemixAllowed && !remixRegexp.test(result.title)) {
        return false;
      }

      return true;
    });

    if(exactMatches.length > 0) {
      return Object.assign({}, exactMatches[0], { type: 'exact' });
    }

    // 2. Test for record label uploads
    //    - Artist and track name are the title, and the track was released by the label
    const artistRegexp = new RegExp(nArtistNames.map(name => this._sanitize_regex(name)).join('|'));
    recordLabelMatches = searchResults.filter(result => {
      let baseCriteria =(
        result.title.includes(nTrackName)
          && artistRegexp.test(result.title)
          && this.RECORD_LABELS.includes(result.user)
      );

      if(!baseCriteria) {
        return false;
      }

      if(!isRemixAllowed && result.title.includes('remix')) {
        return false;
      } else if(isRemixAllowed && !remixRegexp.test(result.title)) {
        return false;
      }

      return true;
    });

    if(recordLabelMatches.length > 0) {
      return Object.assign({}, recordLabelMatches[0], { type: 'label' });
    }

    // 3. Heuristically determine next most likely track
    //    - Filter out remixes, unless requested
    //    - Filter out low play count
    //    - Sort by play count, pick the first
    closestResults = searchResults.filter(result => {
      // Does the title at least include all parts of the searched track name
      let allTrackNamePartsIncluded = true;
      nTrackName.split(/\s+/).forEach(trackNamePart => {
        const trackPartRegex = new RegExp(`\\b${this._sanitize_regex(trackNamePart)}\\b`);
        allTrackNamePartsIncluded &&= trackPartRegex.test(result.title);
      });

      if(!allTrackNamePartsIncluded) {
        return false;
      }

      // At this point none of the uploaders match the artist or remix artist, so
      // are either of their names at least in the track title
      if(!artistRegexp.test(result.title) || (isRemixAllowed && !result.title.includes(nRemixArtist))) {
        return false;
      }

      // Filter unallowed remixes
      if(!isRemixAllowed && result.title.includes('remix')) {
        return false;
      }

      // Remove low play count - likely not the big track we're looking for
      if(result.plays < 5000) {
        return false;
      }
      
      return true;
    });

    if(closestResults.length === 0) {
      return { title: '', user: '', type: 'no_match' };
    }

    let closestResult = closestResults.sort((r1, r2) => r2.plays - r1.plays)[0];
    return Object.assign({}, closestResult, { type: 'closest' });
  },
  async addToPlaylist(result) {
    // Refuse to add empty results to a playlist.
    if(result.type === 'no_match') {
      return {
        success: false,
        reason: 'no_match',
      };
    }

    // Pick "Transfer" playlist closest to the top with lowest track count (less than 500)
    const $playlistOverlay = await this._open_playlist_modal(result.index);

    // Make sure we're selecting a transfer playlist
    const $transferPlaylists = this.$findAll('.addToPlaylistList__item', $playlistOverlay).filter($playlist => {
      const $title = this.$find('a.addToPlaylistItem__titleLink', $playlist);
      return $title?.getAttribute('title')?.includes('Transfer');
    });

    // Make sure this track is not already in a transfer paylist
    const $alreadyInPlaylists = $transferPlaylists.filter($playlist => {
      const $addToPlaylistButton = this.$find('button.addToPlaylistButton', $playlist);
      return $addToPlaylistButton?.getAttribute('title') === 'Remove';
    });

    if($alreadyInPlaylists.length > 0) {
      this.$find('button.modal__closeButton', $playlistOverlay).click();
      return {
        success: false,
        reason: 'already_added',
      };
    }

    // If this is not an "exact" or "label" match, add to our Approximate ("Closest") Transfers list
    if(result.type === 'closest') {
      const $transferListClosest = $transferPlaylists.filter($playlist => {
        const $title = this.$find('a.addToPlaylistItem__titleLink', $playlist);
        return $title?.getAttribute('title')?.includes('Closest');
      });

      let result;
      if($transferListClosest.length > 0) {
        this.$find('button.addToPlaylistButton', $transferListClosest[0]).click();
        result = { 
          success: true,
          reason: 'added_to_closest'
        };
      } else {
        result = {
          success: false,
          reason: 'missing_closest_playlist',
        };
      }

      this.$find('button.modal__closeButton', $playlistOverlay).click();
      if(!result.success) {
        alert('Please create a new playlist with "Transfer" and "Closest" in the name to continue.');
      }
      return result;
    }

    const $specificPlaylists = $transferPlaylists.filter($playlist => {
      const $title = this.$find('a.addToPlaylistItem__titleLink', $playlist);
      return !$title?.getAttribute('title')?.includes('Closest');
    });
    
    // Find a "non-closest" transfer playlist with under 500 tracks
    const $playlistsUnder500 = $specificPlaylists.filter($playlist => {
      const trackCount = parseInt(this.$find('.addToPlaylistItem__count', $playlist)?.innerText?.trim() || '');
      return trackCount < 500;
    });

    // At least one playlist can accommodate this track. Add it and close the modal
    if($playlistsUnder500.length > 0) {
      this.$find('button.addToPlaylistButton', $playlistsUnder500[0]).click();
      this.$find('button.modal__closeButton', $playlistOverlay).click();
      return { 
        success: true,
        reason: 'success'
      };
    }

    // Otherwise, we need to make a new transfer paylist.
    this.$find('button.modal__closeButton', $playlistOverlay).click();
    alert('Please create a new playlist with "Transfer" in the name to continue.');
    return { 
      success: false,
      reason: 'missing_transfer_playlist'
    };
  },
  addRecordLabel(labelName) {
    this.RECORD_LABELS.push(this._sanitize(labelName));
  },
  addTranslation(from, to) {
    this.SPECIAL_CHAR_MAP[from] = to;
  },
  _sanitize(name) {
    if(!name) {
      return '';
    }

    let newName = name.toLowerCase().trim();
    Object.entries(this.SPECIAL_CHAR_MAP).forEach((entry) => {
      newName = newName.replaceAll(entry[0], entry[1]);
    });
    return newName;
  },
  _sanitize_regex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll(/[^\\\w]/g, '$&?')
  },
  _get_results_digest() {
    const searchID = this.$find('.searchItem .sc-link-primary');
    return searchID?.innerText?.trim()?.replaceAll(/\W/g, '') || '';
  },
  _search_for(term) {
    return new Promise(resolve => {
      if(this._is_current_search_id(term)) {
        return resolve(this.currentSearchResults);
      }

      // perform search
      this.$find('input.headerSearch__input').value = term;
      this.$find('button.headerSearch__submit').click();

      let maxTries = 16;
      const currentSearchDigest = this._get_results_digest();
      const searchIntervalID = setInterval(() => {
        maxTries--;

        if(maxTries === 0) {
          this.currentSearchResults = [];
          this.currentSearchID = this._to_search_id(term);
          clearInterval(searchIntervalID);
          return resolve(this.currentSearchResults);
        }
        
        const newSearchDigest = this._get_results_digest();
        if(newSearchDigest === '') {
          return;
        }

        if(!this.currentSearchID || newSearchDigest !== currentSearchDigest) {
          this.currentSearchResults = this.$findAll('.searchItem__trackItem.track');
          this.currentSearchID = this._to_search_id(term);
          clearInterval(searchIntervalID);
          return resolve(this.currentSearchResults);
        }
      }, 250);
    });
  },
  _open_playlist_modal(index) {
    return new Promise(resolve => {
      // Click 'More' then 'Add to playlist'
      this.$find('.sc-button-more', this.$findAll('.track.searchItem__trackItem')[index]).click();
      this.$find('body .dropdownMenu[id*="dropdown-button"] .sc-button-addtoset').click();

      const waitIntervalID = setInterval(() => {
        const $playlistModal = this.$find('[id*=overlay].modal .modal__modal');
        if($playlistModal) {
          const $hasPlaylistItemTitles = this.$find('.addToPlaylistList__item a.addToPlaylistItem__titleLink', $playlistModal);
          if($hasPlaylistItemTitles) {
            clearInterval(waitIntervalID);
            setTimeout(() => {
              return resolve($playlistModal);
            }, 1000);
          }
        }
      }, 100);
    });
  },
  _to_search_id(term) {
    return term.replaceAll(/\W/g, '');
  },
  _is_current_search_id(term) {
    return this.currentSearchID === this._to_search_id(term);
  },
};

RUNNER = {
  BOOKMARK: -1,
  AT_ONCE: 50,
  MISSING: {},
  LAST_SEARCHED_AT: new Date(),

  async run(start = this.BOOKMARK + 1, end = start + this.AT_ONCE) {
    await SOUNDCLOUD.init();

    let shouldUpdateBookmark = (start === this.BOOKMARK + 1);

    for(var trackNumber = start; trackNumber < end; trackNumber++) {
      await this._process(trackNumber);
      
      shouldUpdateBookmark ||= (trackNumber === this.BOOKMARK);
      if(shouldUpdateBookmark) {
        this.BOOKMARK = trackNumber;
      }
    }
  },

  async runSpecific(indices) {
    await SOUNDCLOUD.init();

    for(const trackNumber of indices) {
      await this._process(trackNumber);
    }
  },

  async _process(trackNumber) {
    if(trackNumber > PLAYLIST.length) {
      return false;
    }

    const spotifyTrack = PLAYLIST[trackNumber];

    const remixParam =
        spotifyTrack.is_remix ? { remixArtist: spotifyTrack.remix_artist } : {};
      
    // console.log("IDENTIFYING...");
    this.LAST_SEARCHED_AT = new Date();
    let result = await SOUNDCLOUD.identify(
      spotifyTrack.name,
      spotifyTrack.artists,
      remixParam,
    );

    // If imprecise, reattempt search with just primary artist. Bigger names like Kygo
    // often omit the name of the vocalist or smaller featured artists.
    if(!this._is_precise(result.type) && spotifyTrack.artists.length > 1) {
      let result2 = await this._throttle(() => {
        this.LAST_SEARCHED_AT = new Date();
        return SOUNDCLOUD.identify(
          spotifyTrack.name,
          spotifyTrack.artists.slice(0, 1),
          remixParam,
        );
      });

      if(this._is_precise(result2.type)) {
        result = result2
      }
    }

    if(result.type === 'no_match') {
      this.MISSING[trackNumber] = spotifyTrack;
    }

    const playlistAddResult = await SOUNDCLOUD.addToPlaylist(result);

    console.log([
      trackNumber.toString().padStart(4, '0'),
      spotifyTrack.name.slice(0, 20).padEnd(20, ' '),
      spotifyTrack.artists.join(', ').slice(0, 30).padEnd(30, ' '),
      result.type.padEnd(10, ' '),
      playlistAddResult.reason.padEnd(15, ' '),
    ].join(' | '));

    if(result.type !== 'no_match') {
      await this._waitForOverlayToClose();
    }
  },

  atOnce(newAtOnce) {
    this.AT_ONCE = newAtOnce;
  },

  _waitForOverlayToClose() {
    return new Promise((resolve) => {
      const waitForOverlayToCloseID = setInterval(() => {
        const $playlistModal = document.querySelector('[id*=overlay].modal .modal__modal');
        if($playlistModal) {
          clearInterval(waitForOverlayToCloseID);
          return resolve();
        }
      }, 100);
    });
  },

  _throttle(callback, throttleTime = 1000) {
    return new Promise((resolve) => {
      const throttleIntervalID = setInterval(() => {
        if(new Date() - this.LAST_SEARCHED_AT > throttleTime) {
          clearInterval(throttleIntervalID);
          return resolve(callback());
        }
      }, 50);
    });
  },

  _is_precise(precision) {
    return precision === 'exact' || precision === 'label'
  },
};
