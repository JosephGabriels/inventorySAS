"""
Create a default admin user for testing
Run with: python manage.py shell < create_superuser.py
"""
from inventory_api.models import User

# Check if admin already exists to avoid duplicates
if not User.objects.filter(username='admin').exists():
    # Create superuser
    User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='Admin123!',
        first_name='Admin',
        last_name='User',
        role='admin',
        force_password_change=False
    )
    print("Admin user created successfully")
else:
    print("Admin user already exists")