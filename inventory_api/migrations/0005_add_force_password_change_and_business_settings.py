from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
from django.utils.translation import gettext_lazy as _

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
    ]