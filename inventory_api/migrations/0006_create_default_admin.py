from django.db import migrations
from django.contrib.auth.hashers import make_password
import datetime

def create_default_admin(apps, schema_editor):
    User = apps.get_model('inventory_api', 'User')
    
    # Check if the admin user already exists
    if not User.objects.filter(username='admin').exists():
        User.objects.create(
            username='admin',
            email='admin@example.com',
            password=make_password('admin123'),  # Default password that will be required to change
            first_name='System',
            last_name='Admin',
            role='admin',
            is_staff=True,
            is_superuser=True,
            is_active=True,
            force_password_change=True,  # Flag to force password change on first login
            date_joined=datetime.datetime.now()
        )

def reverse_default_admin(apps, schema_editor):
    User = apps.get_model('inventory_api', 'User')
    User.objects.filter(username='admin', email='admin@example.com').delete()

class Migration(migrations.Migration):

    dependencies = [
        ('inventory_api', '0005_add_force_password_change_and_business_settings'),
    ]

    operations = [
        migrations.RunPython(create_default_admin, reverse_default_admin),
    ]