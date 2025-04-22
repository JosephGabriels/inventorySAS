from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventory_api', '0005_user_force_password_change'),
    ]

    operations = [
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
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='inventory_api.user')),
            ],
            options={
                'verbose_name': 'business settings',
                'verbose_name_plural': 'business settings',
            },
        ),
    ]