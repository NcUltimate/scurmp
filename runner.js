RUNNER = {
  BOOKMARK: 100,
  NO_MATCH: [],

  waitForOverlayToClose() {
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

  async run(start = this.BOOKMARK, end = LIBRARY.length) {
    if(!SC.$) {
      console.log('Initializing SC...');
      await SC.init();
      console.log('SC Initialized.');
    }

    let currentIndex = start;
    for(const spotifyTrack of LIBRARY.slice(start, end)) {
      const remixParam =
        spotifyTrack.is_remix ? { remixArtist: spotifyTrack.remix_artist } : {};
      
      const result = await SC.identify(
        spotifyTrack.name,
        spotifyTrack.artists,
        remixParam,
      );

      result.index = currentIndex++;

      const playlistAddResult = await SC.addToPlaylist(result);
      if(playlistAddResult.reason === 'no_match') {
        NO_MATCH.push(result);
      }

      console.log([
        result.index.toString().padStart(4, '0'),
        spotifyTrack.name.slice(0, 20).padEnd(20, ' '),
        spotifyTrack.artists.join(', ').slice(0, 30).padEnd(30, ' '),
        playlistAddResult.reason.padEnd(15, ' '),
      ].join(' | '));

      await this.waitForOverlayToClose();
    }
  },
};