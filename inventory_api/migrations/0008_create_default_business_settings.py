from django.db import migrations


def create_default_business_settings(apps, schema_editor):
    BusinessSettings = apps.get_model('inventory_api', 'BusinessSettings')
    if not BusinessSettings.objects.exists():
        BusinessSettings.objects.create(
            business_name='Inventory Management System',
            currency='USD'
        )


class Migration(migrations.Migration):
    dependencies = [
        ('inventory_api', '0007_create_default_admin'),
    ]

    operations = [
        migrations.RunPython(create_default_business_settings),
    ]