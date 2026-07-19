import os
from dotenv import load_dotenv
from django.shortcuts import render, redirect
from rest_framework.views import APIView
from requests import post, Request
from rest_framework.response import Response
from rest_framework import status
from .util import *
from api.models import Room
from spotify.models import Votes

load_dotenv()
SPOTIFY_CLIENT_ID = os.getenv("CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("REDIRECT_URI")
# Create your views here.


class AuthView(APIView):
    def get(self, request, format=None):
        scopes = "user-read-playback-state user-modify-playback-state user-read-currently-playing"
        
        url = Request(
            'GET', 
            'https://accounts.spotify.com/authorize',
            params={
                'scope': scopes,
                'response_type': 'code',
                'redirect_uri': SPOTIFY_REDIRECT_URI,
                'client_id': SPOTIFY_CLIENT_ID
            }
        ).prepare().url

        return Response({'url': url}, status=status.HTTP_200_OK)

def spotify_callback(request, format=None):
    code = request.GET.get('code')
    error = request.GET.get('error')

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': SPOTIFY_REDIRECT_URI,
        'client_id': SPOTIFY_CLIENT_ID,
        'client_secret': SPOTIFY_CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    refresh_token = response.get('refresh_token')
    expires_in = response.get('expires_in')
    error = response.get('error')

    if not request.session.exists(request.session.session_key):
        request.session.create()

    update_or_create_user_tokens(
        request.session.session_key, access_token, token_type, expires_in, refresh_token)

    return redirect('frontend:')


class IsAuthenticated(APIView):
    def get(self, request, format=None):
        is_authenticated = is_spotify_authenticated(self.request.session.session_key)
        
        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)
    
    
class CurrentSong(APIView):
    def get(self, request, format=None):
        """
        Get the current song in the room that the user is in
        """
        # Get the room code from the session
        room_code = self.request.session.get('room_code')
        
        # Get the room from the DB using the room code
        room = Room.objects.filter(code=room_code)
        
        if room.exists():
            room = room[0]
        else:
            return Response({'Error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get the host of the room
        host = room.host
        
        # Get the current song in the room
        endpoint = "player/currently-playing"
        response = execute_spotify_api_request(host, endpoint)
        # print(response)
        
        # print("ROOM CODE:", room_code)
        # print("ROOM HOST:", room.host)
        # print("SESSION KEY:", self.request.session.session_key)
        # tokens = get_user_tokens(room.host)
        # print("HOST TOKENS:", tokens)
        
        if 'error' in response or 'item' not in response:
            return Response({'Error': 'Song not found.'}, status=status.HTTP_204_NO_CONTENT)
        
        item = response.get('item')
        duration = item.get('duration_ms')
        progress = response.get('progress_ms')
        album_cover = item.get('album').get('images')[0].get('url')
        is_playing = response.get('is_playing')
        song_id = item.get('id')
        
        artist_string = ""
        
        for i, artist in enumerate(item.get('artists')):
            if i > 0:
                artist_string += ", "
            
            artist_string += artist.get('name')
            
        votes = len(Votes.objects.filter(room=room, song_id=song_id))
            
        song = {
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'vote_count': votes,
            'votes_required': room.votes_to_skip,
            'song_id': song_id
        }
        
        self.update_room_song(room, song_id)
        
        # Return the current song
        return Response(song, status=status.HTTP_200_OK)
    
    def update_room_song(self, room, song_id):
        current_song = room.current_song

        if current_song != song_id:
            room.current_song = song_id
            room.save(update_fields=['current_song'])
            votes = Votes.objects.filter(room=room).delete()
    
    

class ControlSong(APIView):
    def put(self, response, format=None):
        # Get the room code from the session
        room_code = self.request.session.get('room_code')
        
        # Get the room from the DB using the room code
        room = Room.objects.filter(code=room_code).first()
        
        if room is None:
            return Response({'Error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        action = response.data.get('action')
        
        if self.request.session.session_key == room.host or room.guest_can_pause:
            try:
                if action == 'play':
                    play_song(room.host)
                elif action == 'pause':
                    pause_song(room.host)
                else:
                    return Response({'Error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
            except:
                return Response({'Error': 'Issue with request.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({'Success': 'Success.'}, status=status.HTTP_200_OK)
        
        return Response({'Error': 'You are not the host.'}, status=status.HTTP_403_FORBIDDEN)
    
    def post(self, request, format=None):
        # Get the room code from the session
        room_code = self.request.session.get('room_code')
        
        # Get the room from the DB using the room code
        room = Room.objects.filter(code=room_code).first()
        
        if room is None:
            return Response({'Error': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        votes = Votes.objects.filter(room=room, song_id=room.current_song)
        votes_needed = room.votes_to_skip
        
        if self.request.session.session_key == room.host or len(votes) + 1 >= votes_needed:
            votes.delete()
            skip_song(room.host)
        
        else:
            vote = Votes(user=self.request.session.session_key, room=room, song_id=room.current_song)
            vote.save()
        
        return Response({'Success': 'Success.'}, status=status.HTTP_200_OK)
        
        
