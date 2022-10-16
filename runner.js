RUNNER = {
  BOOKMARK: 100,
  MISSING: {},

  async init() {
    if(!SC.$) {
      console.log('Initializing SC...');
      await SC.init();
      console.log('SC Initialized.');
    }

    if(this.MISSING.length === 0 && NO_MATCH) {
      this.MISSING = NO_MATCH;
    }
  },

  async run(start = this.BOOKMARK, end = LIBRARY.length) {
    const shouldUpdateBookmark = (start === this.BOOKMARK);
    
    for(var trackNumber = start; trackNumber < end; trackNumber++) {
      this.process(trackNumber);

      if(shouldUpdateBookmark) {
        this.BOOKMARK = trackNumber;
      }
    }
  },

  async runSpecific(indices) {
    for(const trackNumber of indices) {
      await this.process(trackNumber);
    }
  },

  async process(trackNumber) {
    if(trackNumber > LIBRARY.length) {
      return false;
    }

    this.init();

    const spotifyTrack = LIBRARY[trackNumber];

    const remixParam =
        spotifyTrack.is_remix ? { remixArtist: spotifyTrack.remix_artist } : {};
      
    const result = await SC.identify(
      spotifyTrack.name,
      spotifyTrack.artists,
      remixParam,
    );

    const playlistAddResult = await SC.addToPlaylist(result);
    if(playlistAddResult.reason === 'no_match') {
      this.MISSING[trackNumber] = spotifyTrack;
    }

    console.log([
      trackNumber.toString().padStart(4, '0'),
      spotifyTrack.name.slice(0, 20).padEnd(20, ' '),
      spotifyTrack.artists.join(', ').slice(0, 30).padEnd(30, ' '),
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
};