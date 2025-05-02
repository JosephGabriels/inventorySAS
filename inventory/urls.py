"""
URL configuration for inventory project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from .views import ReactAppView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('inventory_api.urls')),
]

# Serve static and media files in development (not needed with Whitenoise in production)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Catch-all for React frontend (must be last, and must NOT match static/media)
urlpatterns += [
    re_path(r'^(?!static/|media/|api/|admin/).*$', ReactAppView.as_view(), name='react-app'),
]