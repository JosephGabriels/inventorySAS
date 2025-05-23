# Generated by Django 4.2.20 on 2025-04-24 10:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory_api', '0010_merge_20250424_0902'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='user',
            options={'verbose_name': 'user', 'verbose_name_plural': 'users'},
        ),
        migrations.AlterField(
            model_name='user',
            name='force_password_change',
            field=models.BooleanField(default=False, help_text='Require user to change password on next login'),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('admin', 'Admin'), ('manager', 'Manager'), ('staff', 'Staff')], default='staff', max_length=10),
        ),
    ]
