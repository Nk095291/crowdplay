from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/rooms/(?P<room_code>[A-Za-z0-9]{4,8})/$", consumers.RoomConsumer.as_asgi()),
]
