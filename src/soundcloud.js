SOUNDCLOUD = {
  $: jQuery,
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
  async search(term) {
    let $searchResultItems = await this._search_for(term);
    return $searchResultItems.map((index, result) => {
      const $result = this.$(result);

      let title = $result.find('.soundTitle__title');
      title = title.length === 0 ? '' : title.text();

      let user = $result.find('.soundTitle__usernameText');
      user = user.length === 0 ? '' : user.text();

      let plays = $result.find('.sound__soundStats .sc-ministats-item');
      plays = plays.length === 0 ? 0 : plays.attr('title').replaceAll(/\D/g, '');

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
    exactMatches = searchResults.filter((_idx, result) => {
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
    recordLabelMatches = searchResults.filter((_idx, result) => {
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
    closestResults = searchResults.filter((_idx, result) => {
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
    const $transferPlaylists = $playlistOverlay.find('.addToPlaylistList__item').filter((_i, playlist) => {
      const $title = this.$(playlist).find('a.addToPlaylistItem__titleLink');
      return $title.attr('title').includes('Transfer');
    });

    // Make sure this track is not already in a transfer paylist
    const $alreadyInPlaylists = $transferPlaylists.filter((_i, playlist) => {
      const $addToPlaylistButton = this.$(playlist).find('button.addToPlaylistButton');
      return $addToPlaylistButton.attr('title') === 'Remove';
    });

    if($alreadyInPlaylists.length > 0) {
      $playlistOverlay.find('button.modal__closeButton').click();
      return {
        success: false,
        reason: 'already_added',
      };
    }

    // If this is not an "exact" or "label" match, add to our Approximate ("Closest") Transfers list
    if(result.type === 'closest') {
      const $transferListClosest = $transferPlaylists.filter((_i, playlist) => {
        const $title = this.$(playlist).find('a.addToPlaylistItem__titleLink');
        return $title.attr('title').includes('Closest');
      });

      let result;
      if($transferListClosest.length > 0) {
        $transferListClosest.eq(0).find('button.addToPlaylistButton').click();
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

      $playlistOverlay.find('button.modal__closeButton').click();
      if(!result.success) {
        alert('Please create a new playlist with "Transfer" and "Closest" in the name to continue.');
      }
      return result;
    }

    const $specificPlaylists = $transferPlaylists.filter((_i, playlist) => {
      const $title = this.$(playlist).find('a.addToPlaylistItem__titleLink');
      return !$title.attr('title').includes('Closest');
    });
    
    // Find a "non-closest" transfer playlist with under 500 tracks
    const $playlistsUnder500 = $specificPlaylists.filter((_i, playlist) => {
      const trackCount = parseInt(this.$(playlist).find('.addToPlaylistItem__count').text().trim());
      return trackCount < 500;
    });

    // At least one playlist can accommodate this track. Add it and close the modal
    if($playlistsUnder500.length > 0) {
      const $playlist = $playlistsUnder500.eq(0);
      $playlist.find('button.addToPlaylistButton').click();
      $playlistOverlay.find('button.modal__closeButton').click();
      return { 
        success: true,
        reason: 'success'
      };
    }

    // Otherwise, we need to make a new transfer paylist.
    $playlistOverlay.find('button.modal__closeButton').click();
    alert('Please create a new playlist with "Transfer" in the name to continue.');
    return { 
      success: false,
      reason: 'missing_transfer_playlist'
    };
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
    searchID = this.$('.searchItem .sc-link-primary');
    if(searchID.length === 0) {
      searchID = ''; 
    } else {
      searchID = searchID.text().trim().replaceAll(/\W/g, '');
    }
    return searchID;
  },
  _search_for(term) {
    return new Promise((resolve) => {
      if(this._is_current_search_id(term)) {
        // console.log('SAME SEARCH');
        return resolve(this.currentSearchResults);
      }

      // perform search
      this.$('input.headerSearch__input').val(`${term}`);
      this.$('button.headerSearch__submit').click();

      let maxTries = 16;
      const currentSearchDigest = this._get_results_digest();
      const searchIntervalID = setInterval(() => {
        maxTries--;

        // console.log("DIGESTING");

        if(maxTries === 0) {

          // console.log("HIT MAX TRIES");
          this.currentSearchResults = this.$();
          this.currentSearchID = this._to_search_id(term);
          clearInterval(searchIntervalID);
          return resolve(this.currentSearchResults);
        }
        
        const newSearchDigest = this._get_results_digest();
        if(newSearchDigest === '') {
          return;
        }

        // console.log('DIGESTING');
        // console.log({ID: this.currentSearchID, newSearchDigest, currentSearchDigest});

        if(!this.currentSearchID || newSearchDigest !== currentSearchDigest) {
          // console.log('DIGESTED');
          this.currentSearchResults = this.$('.searchItem__trackItem.track');
          this.currentSearchID = this._to_search_id(term);
          clearInterval(searchIntervalID);
          return resolve(this.currentSearchResults);
        }
      }, 250);
    });
  },
  _open_playlist_modal(index) {
    return new Promise((resolve) => {
      // Click 'More' then 'Add to playlist'
      this.$('.track.searchItem__trackItem').eq(index).find('.sc-button-more').click();
      this.$('body .dropdownMenu[id*="dropdown-button"] .sc-button-addtoset').click();

      const waitIntervalID = setInterval(() => {
        const $playlistModal = this.$('[id*=overlay].modal .modal__modal');
        if($playlistModal.length > 0) {
          const $playlistItemTitles = $playlistModal.find('.addToPlaylistList__item a.addToPlaylistItem__titleLink');
          if($playlistItemTitles.length > 0) {
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
