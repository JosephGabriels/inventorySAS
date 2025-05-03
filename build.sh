#!/usr/bin/env bash
# Exit on error
set -o errexit

# Debug information
echo "Current working directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Port: $PORT"

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Create superuser if specified in environment variables
if [[ -n "$DJANGO_SUPERUSER_USERNAME" && -n "$DJANGO_SUPERUSER_EMAIL" && -n "$DJANGO_SUPERUSER_PASSWORD" ]]; then
  echo "Creating superuser..."
  python manage.py createsuperuser --noinput
fi

# Build frontend assets
echo "Building frontend assets..."
echo "Cleaning up..."
rm -rf frontend/dist
rm -rf staticfiles/*
cd frontend && npm ci && npm run build && cd ..

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create start script
echo "Creating start script..."
cat > start.sh << EOF
#!/usr/bin/env bash
gunicorn inventory.wsgi:application --bind 0.0.0.0:\$PORT --log-file -
EOF
chmod +x start.sh

echo "Build completed."