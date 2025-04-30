#!/usr/bin/env bash
# Exit on error
set -o errexit

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Create superuser if specified in environment variables
if [[ -n "$DJANGO_SUPERUSER_USERNAME" && -n "$DJANGO_SUPERUSER_EMAIL" && -n "$DJANGO_SUPERUSER_PASSWORD" ]]; then
  echo "Creating superuser..."
  python manage.py createsuperuser --noinput
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Post-deployment tasks completed."