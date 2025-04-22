from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
from django.utils.translation import gettext_lazy as _
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
        ('inventory_api', '0004_remove_product_primary_image_and_more'),
    ]

    operations = [
        # Add force_password_change field to User model
        migrations.AddField(
            model_name='user',
            name='force_password_change',
            field=models.BooleanField(default=False, help_text=_('Require user to change password on next login')),
        ),
        
        # Create BusinessSettings model
        migrations.CreateModel(
            name='BusinessSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('business_name', models.CharField(default='Inventory Management System', max_length=100)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='business/')),
                ('address', models.TextField(blank=True)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('tax_id', models.CharField(blank=True, max_length=50)),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': _('business settings'),
                'verbose_name_plural': _('business settings'),
            },
        ),
        
        # Create default admin user
        migrations.RunPython(create_default_admin, reverse_default_admin),
    ]