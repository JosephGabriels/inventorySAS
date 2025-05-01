import multiprocessing
import os

# Explicitly get port from environment or default to 10000
port = os.getenv('PORT', '10000')

# Force binding to all interfaces (0.0.0.0)
bind = [f"0.0.0.0:{port}"]

# Worker configuration
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5

# Increase logging for debugging
accesslog = '-'
errorlog = '-'
loglevel = 'debug'  # Changed to debug for more verbose output

# Process naming
proc_name = 'inventory_app'

# Environmental variables
raw_env = [
    "DJANGO_SETTINGS_MODULE=inventory.settings_production",
    f"PORT={port}",
    "PYTHONUNBUFFERED=1"  # Ensure Python output isn't buffered
]

# Reload workers when code changes (development only)
reload = os.getenv('DJANGO_DEBUG', 'False') == 'True'

# Preload application for better performance
preload_app = True