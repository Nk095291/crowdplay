"""
ASGI entrypoint: serves HTTP (Django) and WebSockets (Channels).
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.security.websocket import OriginValidator  # noqa: E402
from django.conf import settings  # noqa: E402

from core.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        # Allow the frontend origin(s) as well as the backend's own hosts.
        "websocket": OriginValidator(
            URLRouter(websocket_urlpatterns),
            settings.CORS_ALLOWED_ORIGINS + settings.ALLOWED_HOSTS,
        ),
    }
)
