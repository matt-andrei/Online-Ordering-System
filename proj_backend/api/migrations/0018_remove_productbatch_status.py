# Generated by Django 5.2 on 2025-05-14 13:02

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_productbatch_status'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='productbatch',
            name='status',
        ),
    ]
