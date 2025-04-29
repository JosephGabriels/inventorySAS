"""
Script to create a default admin user
Run with: python manage.py shell < create_admin.py
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from inventory_api.models import BusinessSettings

User = get_user_model()

# Check if admin user already exists
admin, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@example.com',
        'first_name': 'Admin',
        'last_name': 'User',
        'role': 'admin',
        'is_staff': True,
        'is_superuser': True,
        'force_password_change': True,
    }
)

# Set the password directly (get_or_create won't handle this correctly)
admin.set_password('Admin123!')
admin.save()

status = "Created" if created else "Updated"
print(f"{status} admin user: {admin.username}")

# Create a business settings record if it doesn't exist
business, created = BusinessSettings.objects.get_or_create(
    id=1,
    defaults={
        'business_name': "bb",
        'business_address': "123 Main St, Anytown, USA",
        'business_phone': "555-123-4567",
        'business_email': "contact@inventory.example.com",
    }
)

status = "Created" if created else "Found existing"
print(f"{status} business settings: {business.business_name}")

print("Setup complete. You can login with:")
print("Username: admin")
print("Password: Admin123!")