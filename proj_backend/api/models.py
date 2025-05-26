from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import date
from django.core.exceptions import ValidationError

# -----------------------------
# Custom User Model
# -----------------------------
class CustomUser(AbstractUser):
    USER_ROLES = [
        ('Admin', 'Admin'),
        ('Pharmacy Staff', 'Pharmacy Staff'),
        ('Customer', 'Customer'),
    ]

    userrole = models.CharField(max_length=20, choices=USER_ROLES, default='Customer')
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    birthdate = models.DateField(blank=True, null=True)

    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def name(self):
        return self.full_name()

    def __str__(self):
        return self.username

# -----------------------------
# Product Model 
# -----------------------------
class Product(models.Model):
    CATEGORY_CHOICES = [
        ('Liquid', 'Liquid'),
        ('Tablet', 'Tablet'),
        ('Capsule', 'Capsule'),
        ('Topical', 'Topical'),
        ('Suppositories', 'Suppositories'),
        ('Drops', 'Drops'),
        ('Injection', 'Injection'),
        ('Inhaler', 'Inhaler'),
        ('Others', 'Others'),
    ]

    product_name = models.CharField(max_length=255)
    brand_name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    requires_prescription = models.BooleanField(default=False)
    
    low_stock_threshold = models.PositiveIntegerField(default=10) 

    def __str__(self):
        return f"{self.product_name} ({self.brand_name})"

    class Meta:
        ordering = ['product_name']

    @property
    def total_stock(self):
        return self.batches.filter(is_active=True).aggregate(
            total=models.Sum('quantity')
        )['total'] or 0

    @property
    def has_batches(self):
        return self.batches.exists()

    @property
    def is_low_stock(self):
        return self.total_stock <= self.low_stock_threshold and self.total_stock > 0

    @property
    def is_out_of_stock(self):
        return self.total_stock == 0

    @property
    def availability_status(self):
        """
        Returns a tuple of (is_available, status_message) based on batch availability
        """
        if not self.has_batches:
            return False, "No Batch"

        active_batches = self.batches.filter(
            is_active=True,
            expiration_date__gt=timezone.now().date()
        ).order_by('expiration_date')

        if not active_batches.exists():
            return False, "Out of Stock - No Active Batches"

        # Check if all batches are out of stock
        all_batches_out_of_stock = all(batch.quantity <= 0 for batch in active_batches)
        if all_batches_out_of_stock:
            return False, "Out of Stock - All Batches Depleted"

        # Check if any batch has stock
        has_stock = any(batch.quantity > 0 for batch in active_batches)
        if not has_stock:
            return False, "Out of Stock - No Available Stock"

        # Check if any batch is low on stock
        low_stock_batches = [batch for batch in active_batches if batch.quantity <= self.low_stock_threshold]
        if low_stock_batches:
            return True, "Low Stock"

        return True, "In Stock"

# -----------------------------
# Product Batch Model
# -----------------------------
class ProductBatch(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='batches')
    batch_code = models.CharField(max_length=100, unique=True)
    quantity = models.PositiveIntegerField()
    expiration_date = models.DateField()
    date_received = models.DateField(default=timezone.now)
    is_active = models.BooleanField(default=True)  

    def __str__(self):
        return f"Batch {self.batch_code} - {self.product.product_name}"

    def clean(self):
        # Validate batch code is numeric
        if not self.batch_code.isdigit():
            raise ValidationError({'batch_code': 'Batch code must contain only numbers.'})

    def save(self, *args, **kwargs):
        self.full_clean()  # This will run the clean method and validate
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return self.expiration_date < timezone.now().date()

    class Meta:
        ordering = ['expiration_date']  # FEFO

# -----------------------------
# Order Models
# -----------------------------
class Order(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('Cash', 'Cash'),
        ('ONLINE', 'Online Payment'),
    ]

    DELIVERY_METHOD_CHOICES = [
        ('PICKUP', 'Pickup'),
    ]

    customer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='orders')
    order_date = models.DateTimeField(auto_now_add=True)
    pickup_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)

    payment_method = models.CharField(
        max_length=10,
        choices=PAYMENT_METHOD_CHOICES,
        default='Cash',
    )
    payment_proof = models.ImageField(upload_to='payments/', blank=True, null=True)
    delivery_method = models.CharField(max_length=10, choices=DELIVERY_METHOD_CHOICES, default='PICKUP')

    def __str__(self):
        return f"Order #{self.id} - {self.customer.username}"

    def calculate_total(self):
        """Calculate the total amount from order items"""
        return sum(item.subtotal for item in self.items.all())

    def clean(self):
        # Validate pickup date is not in the past
        if self.pickup_date < timezone.now():
            raise ValidationError({'pickup_date': 'Pickup date cannot be in the past.'})
        
        # Validate pickup time is between 9 AM and 5 PM
        pickup_hour = self.pickup_date.hour
        if pickup_hour < 9 or pickup_hour >= 17:
            raise ValidationError({'pickup_date': 'Pickup time must be between 9:00 AM and 5:00 PM.'})

    def save(self, *args, **kwargs):
        self.full_clean()  # This will run the clean method and validate
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    batch = models.ForeignKey(ProductBatch, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    price_at_time = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.price_at_time
        if self.order.status == 'Completed':
            # Update batch quantity directly
            self.batch.quantity -= self.quantity
            self.batch.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.batch.product.product_name} - {self.quantity} units"

# -----------------------------
# Prescription Model
# -----------------------------
class Prescription(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, default=None)
    prescription_file = models.FileField(upload_to='prescriptions/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    verification_notes = models.TextField(blank=True, null=True)
    verification_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Prescription for Order #{self.order.id}"

    class Meta:
        ordering = ['-uploaded_at']

# -----------------------------
# Report Models
# -----------------------------
class Report(models.Model):
    REPORT_TYPES = [
        ('sales', 'Sales Report'),
        ('inventory', 'Inventory Report'),
        ('prescriptions', 'Prescription Report'),
    ]

    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    file_path = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.start_date} to {self.end_date}"

    class Meta:
        ordering = ['-generated_at']
