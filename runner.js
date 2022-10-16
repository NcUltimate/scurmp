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

    for(const spotifyTrack of LIBRARY.slice(start, end)) {
      // console.log(spotifyTrack);
      
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

      console.log(result);
      if(result.type === 'no_match') {
        console.log('NO MATCH');
        continue;
      }

      const success = await SC.addToPlaylist(result);
      await this.waitForOverlayToClose();

      if(!success) {
        console.log("FAILED TO ADD TO PLAYLIST");
        continue;
      }
    }
  },
}