require 'rest-client'
require 'base64'
require 'json'
require 'spotify-client'
require 'active_support/all'

module Spotify
  CLIENT_ID = 'c234dbf4dd5d4e11a2b11b660d6c477b';
  CLIENT_SECRET = '3c6d830ade8446f4b6eae79064554aad';
  REDIRECT_URI = 'http://localhost:8888/callback';
  SCOPE = 'user-library-read';

  class << self
    attr_reader :code

    def auth_scope
      'https://accounts.spotify.com/authorize?' + {
        response_type: 'code',
        client_id: Spotify::CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: SCOPE,
      }.to_query
    end

    def init!
      puts "1. Visit this URL in your browser: #{auth_scope}"
      puts "2. Enter the resulting code here:"
      @code = gets.chomp
    end

    def client
      init! unless @code

      @client ||= begin
        result = RestClient.post(
          'https://accounts.spotify.com/api/token',
          {
            code: code,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
          },
          { 'Authorization': 'Basic ' + Base64.strict_encode64(CLIENT_ID + ':' + CLIENT_SECRET) },
        )

        Spotify::Client.new({
          # initialize the client with an access token to perform authenticated calls
          access_token: JSON.parse(result&.body || '{}')['access_token'],
          raise_errors: true,  # choose between returning false or raising a proper exception when API calls fails
        
          # Connection properties
          retries: 0,    # automatically retry a certain number of times before returning
          read_timeout: 10,
          write_timeout: 10,
          persistent: false
        })
      end
    end
  end
end

class Library
  attr_reader :tracks
  def initialize
    @raw_tracks = Spotify.client.me_tracks
    @tracks = @raw_tracks.dig('items').map do |item|
      track_name = item.dig('track', 'name').downcase
      pretty_track_name = track_name[/[^\(\-]+/].strip
      artist_names = item.dig('track', 'artists').map { |a| a['name'].downcase }

      base =  {
        artists: artist_names,
        name: pretty_track_name,
      }

      possible_remix_artists = artist_names.each_with_object({}) do |artist_name, scan|
        result = track_name.scan(/(#{artist_name}.+?(?:remix|bootleg|edit))/).flatten
        scan[artist_name] = result if result.present?
      end

      if(possible_remix_artists.present?)
        base.merge!({
          is_remix: true,
          remix_artist: possible_remix_artists.min_by { |artist_name, scan| scan.first.length }.first,
        })
      end

      base
    end
  end
end