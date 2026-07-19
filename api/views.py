"""
Views for the API
"""
from django.shortcuts import render
from rest_framework import generics, status
from .serializers import RoomSerializer, CreateRoomSerializer, UpdateRoomSerializer
from .models import Room
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import JsonResponse


class RoomView(generics.ListAPIView):
    """
    View for listing all rooms
    """
    queryset = Room.objects.all()
    serializer_class = RoomSerializer

    # This is a GET request to get all rooms
    # It returns a list of all rooms and their details
    # The details include the host, code, guests can pause, and votes to skip
    def get(self, request, format='None'):
        rooms = self.get_queryset()
        serializer = self.serializer_class(rooms, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateRoomView(APIView):
    """
    View for creating a new room
    """
    serializer_class = CreateRoomSerializer

    # This is a POST request to create a new room
    # It takes in a dictionary with the keys 'guest_can_pause' and 'votes_to_skip'
    # It will create a new room with the given details and return the room code
    def post(self, request, format=None):
        """
        Handle POST requests to create a new room
        """
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            host = self.request.session.session_key

            qSet = Room.objects.filter(host=host)
            if qSet.exists():
                room = qSet.first()
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
            else:
                room = Room(host=host, guest_can_pause=guest_can_pause, votes_to_skip=votes_to_skip)
                room.save()

            self.request.session['room_code'] = room.code

            return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)

        return Response({'Bad Request': 'Invalid data...'}, status=status.HTTP_400_BAD_REQUEST)


class UpdateRoom(APIView):
    """
    View for updating a room
    """
    serializer_class = UpdateRoomSerializer

    # This is a PATCH request to update a room
    # It takes in a dictionary with the keys 'guest_can_pause', 'votes_to_skip', and 'code'
    # It will update the room with the given details and return the room code
    def patch(self, request, format=None):
        """
        Handle PATCH requests to update a room
        """
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            code = serializer.data.get('code')

            queryset = Room.objects.filter(code=code)
            if not queryset.exists():
                return Response({'msg': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

            room = queryset[0]

            user_id = self.request.session.session_key
            if room.host != user_id:
                return Response({'msg': 'You are not the host of this room.'}, status=status.HTTP_403_FORBIDDEN)

            room.guest_can_pause = guest_can_pause
            room.votes_to_skip = votes_to_skip
            room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

        return Response({'Bad Request': "Invalid Data..."}, status=status.HTTP_400_BAD_REQUEST)


class GetRoom(APIView):
    """
    View for getting a room by code
    """
    serializer_class = RoomSerializer
    lookup_url_kwarg = 'code'

    # This is a GET request to get a room by code
    # It takes in a code and returns the room details
    # The details include the host, code, guests can pause, and votes to skip
    # It also returns a boolean 'is_host' which is True if the user making the request is the host of the room
    def get(self, request, format=None):
        """
        Handle GET requests to get a room by code
        """
        code = request.GET.get(self.lookup_url_kwarg)
        if code != None:
            room = Room.objects.filter(code=code)
            if room.exists():
                data = RoomSerializer(room[0]).data
                data['is_host'] = self.request.session.session_key == room[0].host
                return Response(data, status=status.HTTP_200_OK)
            return Response({'Room Not Found': 'Invalid Room Code.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'Bad Request': 'Code paramater not found in request'}, status=status.HTTP_400_BAD_REQUEST)


class JoinRoom(APIView):
    """
    View for joining a room
    """
    lookup_url_kwarg = 'code'

    # This is a POST request to join a room
    # It takes in a code and adds the user to the room
    # It returns a message saying the room was joined
    def post(self, request, format=None):
        """
        Handle POST requests to join a room
        """
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        code = request.data.get(self.lookup_url_kwarg)
        if code != None:
            result = Room.objects.filter(code = code)
            if result.exists():
                room = result[0]
                self.request.session['room_code'] = code
                return Response({'message': 'Room Joined!'}, status=status.HTTP_200_OK)

            return Response({'Bad Request': 'Invalid Room Code'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'Bad Request': 'Invalid post data, did not find a code key'}, status=status.HTTP_400_BAD_REQUEST)


class UserInRoom(APIView):
    """
    View for checking if a user is in a room
    """
    def get(self, request, format=None):
        """
        Handle GET requests to check if a user is in a room
        """
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        data = {
            'code': self.request.session.get('room_code')
        }

        return JsonResponse(data, status=status.HTTP_200_OK)


class LeaveRoom(APIView):
    """
    View for leaving a room
    """
    def post(self, request, format=None):
        """
        Handle POST requests to leave a room
        """
        if 'room_code' in self.request.session:
            self.request.session.pop('room_code')
            host_id = self.request.session.session_key
            results = Room.objects.filter(host=host_id)
            if len(results) > 0:
                room = results[0]
                room.delete()

        return Response({'Message': 'Success'}, status=status.HTTP_200_OK)
