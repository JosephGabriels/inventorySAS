from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_initial_admin(apps, schema_editor):
    User = apps.get_model('inventory_api', 'User')
    if not User.objects.filter(username='admin').exists():
        User.objects.create(
            username='admin',
            email='admin@example.com',
            password=make_password('admin123'),
            is_staff=True,
            is_superuser=True,
            role='admin',
            force_password_change=True
        )

def reverse_migration(apps, schema_editor):
    User = apps.get_model('inventory_api', 'User')
    User.objects.filter(username='admin').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('inventory_api', '0001_initial'),  # Make sure this matches your last migration
    ]

    operations = [
        migrations.RunPython(create_initial_admin, reverse_migration),
    ]