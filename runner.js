RUNNER = {
  BOOKMARK: 1935,
  MISSING: {},
  LAST_SEARCHED_AT: new Date(),

  async init() {
    if(!SC.$) {
      console.log('Initializing SC...');
      await SC.init();
      console.log('SC Initialized.');
    }

    if(!this?.MISSING?.length || (this.MISSING.length === 0 && NO_MATCH)) {
      this.MISSING = NO_MATCH;
    }
  },

  async run(start = this.BOOKMARK, end = this.BOOKMARK + 50) {
    await this.init();

    let shouldUpdateBookmark = (start === this.BOOKMARK);

    for(var trackNumber = start; trackNumber < end; trackNumber++) {
      await this._process(trackNumber);
      
      shouldUpdateBookmark ||= (trackNumber === this.BOOKMARK);
      if(shouldUpdateBookmark) {
        this.BOOKMARK = trackNumber;
      }
    }
  },

  async runSpecific(indices) {
    await this.init();

    for(const trackNumber of indices) {
      await this._process(trackNumber);
    }
  },

  async _process(trackNumber) {
    if(trackNumber > LIBRARY.length) {
      return false;
    }

    const spotifyTrack = LIBRARY[trackNumber];

    const remixParam =
        spotifyTrack.is_remix ? { remixArtist: spotifyTrack.remix_artist } : {};
      
    // console.log("IDENTIFYING...");
    this.LAST_SEARCHED_AT = new Date();
    let result = await SC.identify(
      spotifyTrack.name,
      spotifyTrack.artists,
      remixParam,
    );

    // If imprecise, reattempt search with just primary artist. Bigger names like Kygo
    // often omit the name of the vocalist or smaller featured artists.
    if(!this._is_precise(result.type)) {
      // console.log("IMPRECISE, TRYING AGAIN...");
      // SC._clear_search();

      let result2 = await this._throttle(() => {
        this.LAST_SEARCHED_AT = new Date();
        return SC.identify(
          spotifyTrack.name,
          spotifyTrack.artists.slice(0, 1),
          remixParam,
        );
      });

      // console.log("FOUND NEW RESULT");

      if(this._is_precise(result2.type)) {
        // console.log("FOUND MORE PRECISE RESULT");
        result = result2
      }
    }
    // console.log({result});
    // console.log("CONTINUING...");

    if(result.type === 'no_match') {
      this.MISSING[trackNumber] = spotifyTrack;
    }

    // console.log("ADDING TO PLAYLIST");
    const playlistAddResult = await SC.addToPlaylist(result);
    // console.log("ADDED TO PLAYLIST");

    console.log([
      trackNumber.toString().padStart(4, '0'),
      spotifyTrack.name.slice(0, 20).padEnd(20, ' '),
      spotifyTrack.artists.join(', ').slice(0, 30).padEnd(30, ' '),
      result.type.padEnd(10, ' '),
      playlistAddResult.reason.padEnd(15, ' '),
    ].join(' | '));

    await this._waitForOverlayToClose();
  },

  _waitForOverlayToClose() {
    return new Promise((resolve) => {
      const waitForOverlayToCloseID = setInterval(() => {
        const $playlistModal = SC.$('[id*=overlay].modal .modal__modal');
        if($playlistModal.length === 0) {
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