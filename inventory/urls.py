"""
URL configuration for inventory project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import ReactAppView
# Serve React frontend
re_path(r'^$', TemplateView.as_view(template_name='index.html')),
re_path(r'^(?!api/)(?!admin/)(?!media/)(?!static/).+', 
    TemplateView.as_view(template_name='index.html')),
urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # API endpoints
    path('api/', include('inventory_api.urls')),
    
    # Catch all routes and let React handle routing
    re_path(r'^.*', ReactAppView.as_view(), name='react-app'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)