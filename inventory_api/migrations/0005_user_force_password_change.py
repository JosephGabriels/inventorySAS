from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory_api', '0004_remove_product_primary_image_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='force_password_change',
            field=models.BooleanField(default=False, help_text='Require user to change password on next login'),
        ),
    ]