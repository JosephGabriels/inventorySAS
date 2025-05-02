import multiprocessing
import os

# Get port from environment variable
port = os.getenv('PORT', '10000')

# Single string binding instead of list
bind = f"0.0.0.0:{port}"

# Worker configuration
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging configuration
accesslog = '-'
errorlog = '-'
loglevel = 'debug'

# Process naming
proc_name = 'inventory_app'

# Environmental variables
raw_env = [
    "DJANGO_SETTINGS_MODULE=inventory.settings_production",
    "PYTHONUNBUFFERED=1"
]