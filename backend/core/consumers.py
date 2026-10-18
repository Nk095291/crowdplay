from channels.generic.websocket import AsyncJsonWebsocketConsumer


class RoomConsumer(AsyncJsonWebsocketConsumer):
    """
    One WebSocket group per room code. Any message a client sends is
    broadcast to everyone in the room via the Redis channel layer.
    """

    async def connect(self):
        self.room_code = self.scope["url_route"]["kwargs"]["room_code"].upper()
        self.group_name = f"room_{self.room_code}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        await self.channel_layer.group_send(
            self.group_name, {"type": "room.event", "payload": content}
        )

    async def room_event(self, event):
        await self.send_json(event["payload"])
