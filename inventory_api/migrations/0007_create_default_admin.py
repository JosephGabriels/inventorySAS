from django.db import migrations
from django.contrib.auth.hashers import make_password


def create_default_admin(apps, schema_editor):
    User = apps.get_model('inventory_api', 'User')
    if not User.objects.filter(username='admin').exists():
        User.objects.create(
            username='admin',
            password=make_password('Admin123!'),
            email='admin@example.com',
            first_name='Admin',
            last_name='User',
            role='admin',
            force_password_change=True,
            is_staff=True,
            is_superuser=True
        )


class Migration(migrations.Migration):
    dependencies = [
        ('inventory_api', '0006_businesssettings'),
    ]

    operations = [
        migrations.RunPython(create_default_admin),
    ]