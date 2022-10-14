SC = {
  RECORD_LABELS: [
    'LYD',
    'Insomniac Records',
    'Simplify.',
    'Selected.',
    'Gemstone Records',
    'Dharma Worldwide',
    'Future House Cloud',
    'Pantheon Select',
    'Lowly.',
    'Protocol Recordings',
    'bitbird',
    'S I Z E',
    'NCS',
    'MA Music',
    'Proximity',
    'SKINK',
    'AFTR:HRS',
    'Strange Fruits',
    'Big Beat Records',
    'Musical Freedom',
    'MrSuicideSheep',
    'Revealed Recordings',
    'Bass House Music',
    'Future House Music',
    'Armada Music',
    'Enhanced',
    'HEXAGON',
    'Anjunadeep',
    "Spinnin' Records",
    'Monstercat',
    '2-Dutch',
  ],
  SPECIAL_CHAR_MAP: {
    'ë': 'e', // e.g. Tiësto
    'ø': 'o', // e.g. Mø
  },
  ARTIST_EXCEPTIONS: {
    'k.flay' : 'kflay',
  },
  async init() {
    this.RECORD_LABELS = this.RECORD_LABELS.map(label => this._sanitize(label));

    await this._loadJQuery().then((loadedJQuery) => this.$ = loadedJQuery);
    return this;
  },
  async search(term) {
    let $searchResultItems = await this._search_for(term);
    return $searchResultItems.map((idx, result) => {
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
      };
    });
  },
  async identify(trackName, artistName, {remixArtist} = {}) {
    const nTrackName = this._sanitize(trackName);
    const nArtistName = this._sanitize(artistName);
    const nRemixArtist = this._sanitize(remixArtist);
    const isRemixAllowed = !!remixArtist;
    const remixRegexp = new RegExp(`${nRemixArtist}.+?(remix|mix|edit|bootleg|vip mix)`);

    let searchResults = await this.search(`${artistName} ${trackName} ${nRemixArtist}`);

    // 1. Test for exact matches:
    //    - User is the artist, track title is the song title, contains a remix name if present
    exactMatches = searchResults.filter((_idx, result) => {
      if(!result.title.includes(nTrackName)) {
        return false;
      }

      let isExactArtist = (
        result.user === nArtistName
          || result.user === this.ARTIST_EXCEPTIONS[nArtistName]
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
    recordLabelMatches = searchResults.filter((_idx, result) => {
      let baseCriteria =(
        result.title.includes(nTrackName)
          && result.title.includes(nArtistName)
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
        allTrackNamePartsIncluded &&= result.title.includes(trackNamePart);
      });

      if(!allTrackNamePartsIncluded) {
        return false;
      }

      // At this point none of the tracks are by the artist or remix artist, so
      // are either of their names at least in the track title
      if(!result.title.includes(nArtistName) || (isRemixAllowed && !result.title.includes(nRemixArtist))) {
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
        return resolve(this.currentSearchResults);
      }

      this.currentSearchResults = this.$();
      this.currentSearchID = this._to_search_id(term);

      // perform search
      this.$('input.headerSearch__input').val(`${term}`);
      this.$('button.headerSearch__submit').click();

      const currentSearchDigest = this._get_results_digest();
      const searchIntervalID = setInterval(() => {
        newSearchDigest = this._get_results_digest();

        if(newSearchDigest !== '' && newSearchDigest !== currentSearchDigest) {
          this.currentSearchResults = this.$('.searchItem__trackItem');
          clearInterval(searchIntervalID);
          return resolve(this.currentSearchResults);
        }
      }, 250);
    });
  },
  _to_search_id(term) {
    return term.replaceAll(/\W/g, '');
  },
  _is_current_search_id(term) {
    return this.currentSearchID === this._to_search_id(term);
  },
  _loadJQuery() {
    return new Promise((resolve) => {
      var jq = document.createElement('script');
      jq.src = "https://code.jquery.com/jquery-3.6.1.min.js";
      document.getElementsByTagName('head')[0].appendChild(jq);

      var loadJQueryIntervalID = setInterval(() => {
        jqueryLoaded = true;
        try { 
          jQuery.noConflict();
        } catch {
          jqueryLoaded = false;
        }

        if(jqueryLoaded) { 
          clearInterval(loadJQueryIntervalID);
          return resolve(jQuery)
        };
      }, 50);
    });
  },
};
