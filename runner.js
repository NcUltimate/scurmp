RUNNER = {
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

  async run(start = 0, end = 10) {
    if(!SC.$) {
      console.log('Initializing SC...');
      await SC.init();
      console.log('SC Initialized.');
    }

    let currentIndex = start;
    for(const spotifyTrack of LIBRARY.slice(start, end)) {
      let result = {};
      if(spotifyTrack.is_remix) {
        result = await SC.identify(
          spotifyTrack.name,
          spotifyTrack.artists,
          { remixArtist: spotifyTrack.remix_artist },
        );
      } else {
        result = await SC.identify(
          spotifyTrack.name,
          spotifyTrack.artists,
        );
      }

      result.index = currentIndex++;

      const playlistAddResult = await SC.addToPlaylist(result);
      console.log(Object.assign({}, spotifyTrack, result, playlistAddResult));
      await this.waitForOverlayToClose();
    }
  },
}