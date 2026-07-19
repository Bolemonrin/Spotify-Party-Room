from django.urls import path
from .views import *

urlpatterns = [
    path('get-auth-url', AuthView.as_view()),
    path('redirect', spotify_callback),
    path('is-authenticated', IsAuthenticated.as_view()),
    path('current-song', CurrentSong.as_view()),
    path('song_control', ControlSong.as_view()),
]