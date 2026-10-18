from django.core.cache import cache
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def health(request):
    """Liveness check used by the frontend status pill and Railway healthchecks."""
    status = {"api": "ok", "redis": "ok"}

    try:
        cache.set("healthcheck", "ok", timeout=5)
        if cache.get("healthcheck") != "ok":
            status["redis"] = "error"
    except Exception:
        status["redis"] = "error"

    healthy = all(v == "ok" for v in status.values())
    return Response(status, status=200 if healthy else 503)
