"""
Create a default admin user for testing
Run with: python manage.py shell < create_superuser.py
"""
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventory.settings')
django.setup()

from inventory_api.models import User

def create_superuser():
    try:
        # Check if admin already exists
        if not User.objects.filter(username='admin').exists():
            # Create superuser
            User.objects.create_superuser(
                username='admin1',
                email='admin1cre@example.com',
                password='Admin123!',
                first_name='Admin',
                last_name='User',
                role='admin',
                force_password_change=False
            )
            print("Admin user created successfully")
        else:
            print("Admin user already exists")
    except Exception as e:
        print(f"Error creating superuser: {str(e)}")

if __name__ == '__main__':
    create_superuser()