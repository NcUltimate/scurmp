RUNNER = {
  async run() {
    if(!SC.$) {
      console.log('Initializing SC...');
      await SC.init();
      console.log('SC Initialized.');
    }

    for(const spotifyTrack of LIBRARY) {
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
        return false;
      }

      const success = await SC.addToPlaylist(result);
      if(!success) {
        console.log("FAILED TO ADD TO PLAYLIST");
        return false;
      }

      return true;
    }
  },
}