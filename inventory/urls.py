"""
URL configuration for inventory project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from .views import ReactAppView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('inventory_api.urls')),
]

# Serve static and media files in development (not needed with Whitenoise in production)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Add explicit route to serve assets from staticfiles
urlpatterns += static('/assets/', document_root=settings.STATIC_ROOT)

# Catch-all for React frontend (must be last, and must NOT match static/media/assets)
urlpatterns += [
    re_path(r'^(?!static/|media/|api/|admin/|assets/).*$', ReactAppView.as_view(), name='react-app'),
]