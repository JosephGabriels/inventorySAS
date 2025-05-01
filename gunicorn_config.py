import multiprocessing
import os

# Get port from environment variable or default to 10000
port = os.getenv('PORT', '10000')
bind = f"0.0.0.0:{port}"

# Worker configuration
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# SSL Configuration (if needed)
keyfile = None
certfile = None

# Process naming
proc_name = 'inventory_app'

# Environmental variables
raw_env = [
    f"DJANGO_SETTINGS_MODULE=inventory.settings_production",
    f"PORT={port}"
]