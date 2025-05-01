"""
Production settings for the inventory project.
These settings extend the base settings but configure the application for a production environment.
"""

import os
import dj_database_url
from .settings import *  # Import base settings

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Secret key should be set from environment in production
SECRET_KEY = os.environ.get('SECRET_KEY')

# Allow Render.com domain and custom domains
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')
if not ALLOWED_HOSTS:  # Default if not set
    ALLOWED_HOSTS = ['.onrender.com']

# Configure database using Render's DATABASE_URL
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Port configuration
PORT = int(os.getenv('PORT', '10000'))

# Production security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# HTTPS settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Add whitenoise for static file serving
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Update CORS settings for production
CORS_ALLOWED_ORIGINS = [
    # Add your frontend domain(s) here
    "https://inventory-frontend.onrender.com",
]

# Set default JWT token lifetimes for production
SIMPLE_JWT = {
    **SIMPLE_JWT,  # Include base settings
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),  # Shorter lifetime in production
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# Configure logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'WARNING'),
            'propagate': False,
        },
    },
}

# Rest Framework production settings
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # Include base settings
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# Media files - for file uploads in production
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

# Ensure static ROOT exists
os.makedirs(STATIC_ROOT, exist_ok=True)