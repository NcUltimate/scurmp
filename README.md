# Spotify to Soundcloud
Follow these steps closely:

## 1. Login to both apps
1. [Open the Spotify Web App](https://open.spotify.com). Log in.
2. While in the Spotify tab, **Open a developer console** (see FAQ).
3. In another tab, [Open SoundCloud](https://soundcloud.com). Log in.
4. While in the SoundCloud tab, **Open a developer console** (see FAQ).
5. You should now have 3 windows open:
    - Your browser of choice, with a logged-in **Spotify** tab and a logged-in **SoundCloud** tab
    - A developer console for the **Spotify** tab
    - A developer console for the **SoundCloud** tab

## 2. Prepare SoundCloud Playlists
Unfortunately Soundcloud has a playlist limit of 500 songs. It also does not allow creating
an empty playlist. Playlists can only be created from a dropdown menu under a track.

Because of this, we need to prepare SoundCloud with "empty" playlists where we can store 
our Spotify tracks.

1. **Manually search SoundCloud** for `Math.ceil(# songs in your playlist / 500)` tracks.
    - Example:
        Let's say I have 1406 liked songs, so I should search for `Math.ceil(1406/500)` = 3 tracks.
2. **Create one new playlist per song you just searched**. The playlist must have "Transfer" somewhere in its name.
    - Example:
        - I search for the song "The Business" by Tiësto, "Stay" by Zedd, and "Fangs" by Ghastly.
        - I create a new playlist from "The Business" named `Transfer 1`
        - I create a new playlist from "Stay" named `Transfer 2`
        - I create a new playlist from "Fangs" named `Transfer 3`
3. **Search for any song on SoundCloud** and create a playlist from it named `Transfer Closest`.
    - This paylist will be your 'junk drawer' for songs that don't quite match.
    - For example, many songs are uploaded by random users instead of the label or artist. These songs
    may not always be around if they get copyright stricken.
    - All close matches during the transfer will go here.

## 3. Copy your desired Spotify playlist
1. **Copy** [the contents](https://raw.githubusercontent.com/NcUltimate/scurmp/main/all.min.js) of `spotify.js` and paste it into the **Spotify** console.
2. In the **Spotify** console, type `SPOTIFY.tracks()` to copy all of the tracks from your Liked Songs.
    - If you want to copy a specific playlist, e.g. 'trap house', you can type `SPOTIFY.tracks('trap house')` into the console.
    - Don't worry about getting an exact playlist name. The script will prompt you to pick the correct playlist if more than one matches.
    - You should see `PLAYLIST = [{...` printed to the console when the script is done running.
3. **Copy the resulting PLAYLIST output**.
    - Method 1: right-click and select "Store (object) as global variable"
        - If this is grayed out, use method 2
        - Otherwise, you will see a variable printed e.g. `temp1`.
        - type `copy(temp1)` (or whichever your variable name is) into the console to copy it to your clipboard

    - Method 2: select the entire output and copy to clipboard by pressing `CTRL + C`
        - Note: doing this may include the extra log output seen on the right side of the console, e.g. `vendor~web-player.411bddd3.js:1:50770`.
            You will need to ensure you remove that part after pasting in the next step.
4. **Paste the copied output into the SoundCloud console**.

## 4. Begin converting on SoundCloud
Note -this script has been heavily biased toward electronic music playlists. Common record labels and special character substitutions have been added to account for most cases that will be encountered when transferring known electronic tracks on SoundCloud.

With that in mind, this script tries very hard to only add exact matches to the `Transfer` playlists. It knows how to do this by looking for these known labels as the upload users, or by looking for any of the track artists as the upload user.

If you notice a large number of your tracks only getting a "closest" match, or "no_match", try manually searching for those songs to see if they were uploaded by a label. If the user who uploaded the track (e.g. `Label Username`) is a label that is not on the list, you can add it by typing `SOUNDCLOUD.addLabel('Label Username')`.

Another note - EDM artists love to be quirky with their letter substitutions. `ƒ` is not the same as `f`, just as `å` is not `a`. Sometimes an artist like `Tiësto` is in the name of a track as `Tiesto`. Luckily this script normalizes all artist names by substituting "lookalike" characters to make comparison even more precise.

If you come across an artist who has a special character that the script is not handling properly, you can also add your own custom character exceptions by typing `SOUNDCLOUD.addTranslation('å', 'a')`, where the first letter is the one to be translated, and the 2nd is the english letter.

1. **Copy** [the contents](https://raw.githubusercontent.com/NcUltimate/scurmp/main/soundcloud.js) of `soundcloud.js` and paste it into the **SoundCloud** console.
2. In the **SoundCloud** console, type `RUNNER.run()`. You should see some lines begin to print to the console in a tabular format.
    - Wait for this run to finish. Try to make sure your computer doesn't go to sleep. It takes about 3 mins to run per 50 songs.
    - Once the script is done, all tracks should be located in your `Transfer` playlists.
    - If you want to know which tracks failed to transfer, you can type `RUNNER.MISSING`
3. You're all done!

# FAQ
**To Open a developer console**.
    - If you are using **Chrome**, hold CMD+SHIFT then press J.
    - If you are using **Firefox**, hold CMD+SHIFT then press I.
    - If you are using another browser, kindly [download Google Chrome](https://www.google.com/chrome/thank-you.html?statcb=0&installdataindex=empty&defaultbrowser=0#).