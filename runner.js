RUNNER = {
  BOOKMARK: 1935,
  MISSING: {},
  LAST_SEARCHED_AT: new Date(),

  async init() {
    if(!SOUNDCLOUD.$) {
      console.log('Initializing SOUNDCLOUD...');
      await SOUNDCLOUD.init();
      console.log('SOUNDCLOUD Initialized.');
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
    let result = await SOUNDCLOUD.identify(
      spotifyTrack.name,
      spotifyTrack.artists,
      remixParam,
    );

    // If imprecise, reattempt search with just primary artist. Bigger names like Kygo
    // often omit the name of the vocalist or smaller featured artists.
    if(!this._is_precise(result.type)) {
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

    await this._waitForOverlayToClose();
  },

  _waitForOverlayToClose() {
    return new Promise((resolve) => {
      const waitForOverlayToCloseID = setInterval(() => {
        const $playlistModal = SOUNDCLOUD.$('[id*=overlay].modal .modal__modal');
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