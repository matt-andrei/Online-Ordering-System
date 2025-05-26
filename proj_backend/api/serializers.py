from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Product, ProductBatch, Prescription, Order, OrderItem, Report
from datetime import date
from django.utils import timezone
import json
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db import models


User = get_user_model()

# -----------------------------
# User Serializers
# -----------------------------
class CreateUser(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)  

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'userrole', 'phone', 'address', 'birthdate', 'name']
        read_only_fields = ['name']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)  
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'userrole', 'phone', 'address', 'birthdate', 'name', 'password'
        ]
        read_only_fields = ['name']  

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password) 
        return super().update(instance, validated_data)

# -----------------------------
# Product Serializer
# -----------------------------
class ProductSerializer(serializers.ModelSerializer):
    total_stock = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    is_out_of_stock = serializers.BooleanField(read_only=True)
    is_available = serializers.SerializerMethodField()
    availability_message = serializers.SerializerMethodField()
    active_batches = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'product_name', 'brand_name', 'category',
            'image', 'price', 'description', 'requires_prescription',
            'low_stock_threshold', 
            'total_stock',         
            'is_low_stock',         
            'is_out_of_stock',
            'is_available',
            'availability_message',
            'active_batches'
        ]

    def get_is_available(self, obj):
        return obj.availability_status[0]

    def get_availability_message(self, obj):
        return obj.availability_status[1]

    def get_active_batches(self, obj):
        active_batches = obj.batches.filter(
            is_active=True,
            expiration_date__gt=timezone.now().date()
        ).order_by('expiration_date')
        return ProductBatchSerializer(active_batches, many=True).data

    def validate(self, data):
        product_name = data.get('product_name')
        brand_name = data.get('brand_name')

        errors = {}

        if product_name:
            name_qs = Product.objects.filter(product_name=product_name)
            if self.instance:
                name_qs = name_qs.exclude(pk=self.instance.pk)
            if name_qs.exists():
                errors['product_name'] = 'A product with this name already exists.'

        if brand_name:
            brand_qs = Product.objects.filter(brand_name=brand_name)
            if self.instance:
                brand_qs = brand_qs.exclude(pk=self.instance.pk)
            if brand_qs.exists():
                errors['brand_name'] = 'A product with this brand already exists.'

        if errors:
            raise serializers.ValidationError(errors)

        return data


# -----------------------------
# Product Batch Serializer
# -----------------------------

class ProductBatchSerializer(serializers.ModelSerializer):
    stock_status = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()

    class Meta:
        model = ProductBatch
        fields = [
            'id', 'product', 'batch_code', 'quantity',
            'expiration_date', 'date_received', 'is_active',
            'stock_status', 'is_expired', 'days_until_expiry'
        ]
        read_only_fields = ['id', 'stock_status', 'is_expired', 'days_until_expiry']

    def get_stock_status(self, obj):
        if obj.quantity <= 0:
            return "Out of Stock"
        elif obj.quantity <= obj.product.low_stock_threshold:
            return "Low Stock"
        return "In Stock"

    def get_is_expired(self, obj):
        return obj.expiration_date < timezone.now().date()

    def get_days_until_expiry(self, obj):
        today = timezone.now().date()
        days = (obj.expiration_date - today).days
        return max(0, days)

    def validate(self, data):
        errors = {}

        # Validate expiration date
        if 'expiration_date' in data:
            if data['expiration_date'] < timezone.now().date():
                errors['expiration_date'] = 'Expiration date cannot be in the past.'

        # Validate quantity
        if 'quantity' in data:
            if data['quantity'] < 0:
                errors['quantity'] = 'Quantity cannot be negative.'

        # Validate date received
        if 'date_received' in data:
            if data['date_received'] > timezone.now().date():
                errors['date_received'] = 'Date received cannot be in the future.'

        # Validate batch code uniqueness
        if 'batch_code' in data:
            batch_qs = ProductBatch.objects.filter(batch_code=data['batch_code'])
            if self.instance:
                batch_qs = batch_qs.exclude(pk=self.instance.pk)
            if batch_qs.exists():
                errors['batch_code'] = 'A batch with this code already exists.'

        if errors:
            raise serializers.ValidationError(errors)

        return data

# -----------------------------
# Prescription Serializer
# -----------------------------
class PrescriptionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='order.customer.name', read_only=True)
    product_name = serializers.SerializerMethodField()
    prescription_url = serializers.SerializerMethodField()
    quantity = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = [
            'id', 'order', 'customer_name', 'product_name',
            'prescription_file', 'prescription_url', 'status',
            'uploaded_at', 'verification_notes', 'verification_date', 'quantity'
        ]
        read_only_fields = ['status', 'verification_date']

    def get_prescription_url(self, obj):
        request = self.context.get('request')
        if obj.prescription_file and hasattr(obj.prescription_file, 'url'):
            return request.build_absolute_uri(obj.prescription_file.url)
        return None

    def get_product_name(self, obj):
        first_item = obj.order.items.first()
        if first_item:
            return first_item.batch.product.product_name
        return None

    def get_quantity(self, obj):
        total_quantity = obj.order.items.aggregate(total=models.Sum('quantity'))['total']
        return total_quantity or 0

    def create(self, validated_data):
        # Optionally ensure the logged-in user matches the customer who owns the order
        user = self.context['request'].user
        order = validated_data.get('order')

        if order.customer != user:
            raise serializers.ValidationError("You can only upload prescriptions for your own orders.")

        return super().create(validated_data)


# -----------------------------
# Order Item Serializer
# -----------------------------

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='batch.product.product_name', read_only=True)
    batch_code = serializers.CharField(source='batch.batch_code', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'order', 'batch', 'product_name',
            'batch_code', 'quantity', 'price_at_time'
        ]
        read_only_fields = ['id', 'product_name', 'batch_code']

    def validate(self, data):
        batch = data.get('batch')
        quantity = data.get('quantity')

        if batch:
            if batch.quantity < quantity:
                raise serializers.ValidationError("Insufficient stock in batch.")

            if batch.expiration_date <= timezone.now().date():
                raise serializers.ValidationError("Cannot order from expired batch.")

        return data


# -----------------------------
# Order Serializer
# -----------------------------

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    delivery_method_display = serializers.CharField(source='get_delivery_method_display', read_only=True)
    order_items = serializers.ListField(write_only=True, required=False)
    prescription_file = serializers.FileField(write_only=True, required=False)
    payment_proof = serializers.FileField(write_only=True, required=False)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    payment_proof_url = serializers.SerializerMethodField()
    prescription_status = serializers.SerializerMethodField()
    requires_prescription = serializers.SerializerMethodField()
    pickup_date = serializers.DateTimeField(format="%Y-%m-%dT%H:%M")

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'customer_name', 'items', 'order_items', 'total_amount',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'delivery_method', 'delivery_method_display', 'pickup_date',
            'notes', 'order_date', 'prescription_file', 'payment_proof', 'payment_proof_url',
            'prescription_status', 'requires_prescription'
        ]
        read_only_fields = ['id', 'customer', 'total_amount', 'status', 'order_date']

    def get_payment_proof_url(self, obj):
        request = self.context.get('request')
        if obj.payment_proof and hasattr(obj.payment_proof, 'url'):
            return request.build_absolute_uri(obj.payment_proof.url)
        return None

    def get_prescription_status(self, obj):
        prescription = Prescription.objects.filter(order=obj).first()
        if prescription:
            return prescription.status
        return None

    def get_requires_prescription(self, obj):
        return any(item.batch.product.requires_prescription for item in obj.items.all())

    def validate(self, data):
        order_items = data.get('order_items')
        if not order_items:
            raise serializers.ValidationError("Order must contain at least one item.")

        # Validate pickup date
        if data.get('pickup_date'):
            pickup_date = data['pickup_date']
            if pickup_date < timezone.now():
                raise serializers.ValidationError("Pickup date cannot be in the past.")
            
            # Validate pickup time is between 9 AM and 5 PM
            pickup_hour = pickup_date.hour
            if pickup_hour < 9 or pickup_hour >= 17:
                raise serializers.ValidationError("Pickup time must be between 9:00 AM and 5:00 PM.")

        # Validate prescription file for prescription-required products
        requires_prescription = False
        for item in order_items:
            try:
                batch = ProductBatch.objects.get(id=item['batch_id'])
                if batch.product.requires_prescription:
                    requires_prescription = True
                    break
            except ProductBatch.DoesNotExist:
                raise serializers.ValidationError(
                    f"Batch with id {item['batch_id']} does not exist."
                )

        if requires_prescription and not data.get('prescription_file'):
            raise serializers.ValidationError(
                "Prescription file is required for prescription-required products."
            )

        # Validate payment proof for online payment
        if data.get('payment_method') == 'ONLINE' and not data.get('payment_proof'):
            raise serializers.ValidationError(
                "Payment proof is required for online payment."
            )

        return data

    def create(self, validated_data):
        order_items = validated_data.pop('order_items', [])
        prescription_file = validated_data.pop('prescription_file', None)
        payment_proof = validated_data.pop('payment_proof', None)
        
        with transaction.atomic():
            # Get the customer from the request context
            request = self.context.get('request')
            if not request or not request.user.is_authenticated:
                raise serializers.ValidationError("User must be authenticated to create an order")
            
            # Create the order with the authenticated user as customer
            order = Order.objects.create(
                customer=request.user,
                payment_proof=payment_proof,
                **validated_data
            )
            total_amount = 0

            # Create order items and update batch quantities
            for item_data in order_items:
                try:
                    batch = ProductBatch.objects.get(id=item_data['batch_id'])
                    product = batch.product

                    # Create order item
                    order_item = OrderItem.objects.create(
                        order=order,
                        batch=batch,
                        quantity=item_data['quantity'],
                        price_at_time=item_data['price_at_time']
                    )

                    # Update batch quantity
                    batch.quantity -= item_data['quantity']
                    batch.save()

                    # Update total amount
                    total_amount += order_item.quantity * order_item.price_at_time

                    # Create prescription if required and file is provided
                    if product.requires_prescription and prescription_file:
                        Prescription.objects.create(
                            order=order,
                            prescription_file=prescription_file,
                            status='Pending'
                        )
                except ProductBatch.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Batch with id {item_data['batch_id']} does not exist."
                    )

            # Update order total
            order.total_amount = total_amount
            order.save()

        return order

# -----------------------------
# Report Serializers
# -----------------------------
class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ['id', 'report_type', 'start_date', 'end_date', 'generated_at', 'generated_by', 'file_path']
        read_only_fields = ['generated_at', 'generated_by', 'file_path']

class SalesReportSerializer(serializers.Serializer):
    totalSales = serializers.DecimalField(max_digits=10, decimal_places=2)
    totalOrders = serializers.IntegerField()
    averageOrderValue = serializers.DecimalField(max_digits=10, decimal_places=2)
    salesByDate = serializers.ListField(child=serializers.DictField())
    topProducts = serializers.ListField(child=serializers.DictField())

class InventoryReportSerializer(serializers.Serializer):
    totalProducts = serializers.IntegerField()
    lowStockItems = serializers.IntegerField()
    outOfStockItems = serializers.IntegerField()
    expiringItems = serializers.IntegerField()
    stockLevels = serializers.ListField(child=serializers.DictField())

class PrescriptionReportSerializer(serializers.Serializer):
    totalPrescriptions = serializers.IntegerField()
    pendingVerifications = serializers.IntegerField()
    verifiedPrescriptions = serializers.IntegerField()
    rejectedPrescriptions = serializers.IntegerField()
    prescriptionTrends = serializers.ListField(child=serializers.DictField())

