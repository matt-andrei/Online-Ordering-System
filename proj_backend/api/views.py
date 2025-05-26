from rest_framework import permissions, status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.http import Http404
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
import json
import csv
from django.http import HttpResponse
from django.db.models.functions import TruncDate
import os
from django.conf import settings

from .models import CustomUser, Product, ProductBatch, Order, OrderItem, Prescription, Report
from .serializers import (
    UserSerializer, CreateUser, ProductSerializer, ProductBatchSerializer,
    PrescriptionSerializer, OrderSerializer, OrderItemSerializer, ReportSerializer
)
from .permissions import IsOwnerReadOnly, IsPharmacyStaff
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework import viewsets

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['userrole'] = user.userrole
        token['username'] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['userrole'] = self.user.userrole
        data['username'] = self.user.username
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get the tokens from the response
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            # Set the tokens in cookies
            response.set_cookie(
                'access',
                access_token,
                httponly=True,
                secure=True,  # Set to True in production
                samesite='Lax',
                max_age=3600  # 1 hour
            )
            response.set_cookie(
                'refresh',
                refresh_token,
                httponly=True,
                secure=True,  # Set to True in production
                samesite='Lax',
                max_age=86400  # 1 day
            )
            
            # Remove tokens from response body
            #response.data.pop('access', None)
            #response.data.pop('refresh', None)
        
        return response

# -----------------------------
# User Views
# -----------------------------
class UserList(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserDetail(generics.RetrieveAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CreateUser
    permission_classes = [AllowAny]

class UserUpdateDelete(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

@api_view(['GET'])
@permission_classes([AllowAny])
def get_users(request):
    users = CustomUser.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def product_batches(request, product_id):
    batches = ProductBatch.objects.filter(product__id=product_id)
    serializer = ProductBatchSerializer(batches, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_user(request):
    serializer = CreateUser(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def user_detail(request, pk):
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = UserSerializer(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# -----------------------------
# Product Views
# -----------------------------
class ProductListCreate(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

class ProductDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

@api_view(['GET'])
@permission_classes([AllowAny])
def get_category_choices(request):
    choices = Product.CATEGORY_CHOICES
    return Response([{"value": c[0], "label": c[1]} for c in choices])

# -----------------------------
# Product Batch Views
# -----------------------------
class ProductBatchListCreate(generics.ListCreateAPIView):
    queryset = ProductBatch.objects.all()
    serializer_class = ProductBatchSerializer
    permission_classes = [AllowAny]

class ProductBatchDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductBatch.objects.all()
    serializer_class = ProductBatchSerializer
    permission_classes = [AllowAny]

class ProductBatchesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
            batches = ProductBatch.objects.filter(product=product, is_active=True).order_by('expiration_date')
            
            # Calculate batch status
            for batch in batches:
                batch.is_low_stock = batch.quantity <= batch.low_stock_threshold
                batch.is_out_of_stock = batch.quantity <= 0
            
            serializer = ProductBatchSerializer(batches, many=True)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

    def post(self, request, product_id):
        try:
            product = Product.objects.get(id=product_id)
            current_batch_id = request.data.get('current_batch_id')
            
            # Get all active batches ordered by expiration date
            batches = ProductBatch.objects.filter(
                product=product,
                is_active=True,
                is_expired=False
            ).order_by('expiration_date')
            
            if not batches.exists():
                return Response({"error": "No active batches available"}, status=404)
            
            # If no current batch specified, return the first batch
            if not current_batch_id:
                batch = batches.first()
                serializer = ProductBatchSerializer(batch)
                return Response(serializer.data)
            
            # Find the current batch
            current_batch = batches.filter(id=current_batch_id).first()
            if not current_batch:
                return Response({"error": "Current batch not found"}, status=404)
            
            # If current batch is not depleted, return it
            if current_batch.quantity > 0 and not current_batch.is_low_stock:
                serializer = ProductBatchSerializer(current_batch)
                return Response(serializer.data)
            
            # Find the next available batch
            next_batch = batches.filter(
                quantity__gt=0,
                is_low_stock=False
            ).exclude(id=current_batch_id).first()
            
            if next_batch:
                serializer = ProductBatchSerializer(next_batch)
                return Response(serializer.data)
            else:
                return Response({"error": "No more batches available"}, status=404)
                
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_product_batch(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        serializer = ProductBatchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_product_batch(request, product_id, batch_id):
    try:
        product = Product.objects.get(id=product_id)
        batch = ProductBatch.objects.get(id=batch_id, product=product)
        serializer = ProductBatchSerializer(batch, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
    except ProductBatch.DoesNotExist:
        return Response({"error": "Batch not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_product_batch(request, product_id, batch_id):
    try:
        product = Product.objects.get(id=product_id)
        batch = ProductBatch.objects.get(id=batch_id, product=product)
        batch.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
    except ProductBatch.DoesNotExist:
        return Response({"error": "Batch not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_batches(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        batches = ProductBatch.objects.filter(
            product=product,
            is_active=True,
            expiration_date__gt=timezone.now().date()
        ).order_by('expiration_date')
        
        # Calculate batch status
        for batch in batches:
            batch.is_low_stock = batch.quantity <= product.low_stock_threshold
            batch.is_out_of_stock = batch.quantity <= 0
        
        serializer = ProductBatchSerializer(batches, many=True)
        return Response(serializer.data)
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

# -----------------------------
# Dashboard Views
# -----------------------------
@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    # Get total customers (users with Customer role)
    total_customers = CustomUser.objects.filter(userrole='Customer').count()
    
    # Get all products with their batches
    products = Product.objects.prefetch_related('batches').all()
    
    # Initialize counters
    low_stock_count = 0
    out_of_stock_count = 0
    expired_count = 0
    
    # Count products based on their batch status
    for product in products:
        if not product.has_batches:
            continue
            
        active_batches = product.batches.filter(
            is_active=True,
            expiration_date__gt=timezone.now().date()
        )
        
        # Check each batch individually
        for batch in active_batches:
            # Check for out of stock
            if batch.quantity == 0:
                out_of_stock_count += 1
            # Check for low stock
            elif batch.quantity <= product.low_stock_threshold:
                low_stock_count += 1
        
        # Check for expired batches
        has_expired = product.batches.filter(
            is_active=True,
            expiration_date__lte=timezone.now().date(),
            quantity__gt=0
        ).exists()
        
        if has_expired:
            expired_count += 1
    
    # Get total sales from completed orders
    total_sales = Order.objects.filter(
        status='Completed'
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    # Get pending orders
    pending_orders = Order.objects.filter(
        status='Pending'
    ).count()
    
    stats = {
        'totalCustomers': total_customers,
        'lowStockProducts': low_stock_count,
        'expiredProducts': expired_count,
        'outOfStock': out_of_stock_count,
        'pendingOrders': pending_orders,
        'totalSales': total_sales
    }
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([AllowAny])
def recent_orders(request):
    orders = Order.objects.select_related('customer').order_by('-order_date')[:10]
    return Response([{
        'id': order.id,
        'customer': order.customer.username,
        'date': order.order_date,
        'status': order.status,
        'total': order.total_amount
    } for order in orders])

# -----------------------------
# Prescription Views
# -----------------------------
class PrescriptionListCreate(generics.ListCreateAPIView):
    serializer_class = PrescriptionSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Prescription.objects.all()

    def perform_create(self, serializer):
        serializer.save()

class PrescriptionDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [AllowAny]

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_prescription(request, pk):
    try:
        prescription = Prescription.objects.get(pk=pk)
    except Prescription.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    status_value = request.data.get('status')
    notes = request.data.get('verification_notes', '')

    if status_value not in ['Approved', 'Rejected']:
        return Response(
            {'error': 'Invalid status. Must be either "Approved" or "Rejected".'},
            status=status.HTTP_400_BAD_REQUEST
        )

    prescription.status = status_value
    prescription.verification_notes = notes
    prescription.verification_date = timezone.now()
    prescription.save()

    serializer = PrescriptionSerializer(prescription, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def customer_prescriptions(request):
    prescriptions = Prescription.objects.all()
    serializer = PrescriptionSerializer(prescriptions, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def pending_prescriptions(request):
    prescriptions = Prescription.objects.filter(status='Pending')
    serializer = PrescriptionSerializer(prescriptions, many=True, context={'request': request})
    return Response(serializer.data)

# -----------------------------
# Order Views
# -----------------------------
class OrderListCreate(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Order.objects.all().order_by('-order_date')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        try:
            # Log incoming request data
            print("Request Data:", request.data)
            print("Request Files:", request.FILES)
            
            # Parse order data from form data
            order_data_str = request.data.get('order_data')
            if not order_data_str:
                return Response(
                    {"error": "Order data is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                order_data = json.loads(order_data_str)
            except json.JSONDecodeError as e:
                print("JSON Decode Error:", str(e))
                return Response(
                    {"error": "Invalid order data format"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add files to order data
            if 'prescription_file' in request.FILES:
                order_data['prescription_file'] = request.FILES['prescription_file']
            if 'payment_proof' in request.FILES:
                order_data['payment_proof'] = request.FILES['payment_proof']
            
            # Log processed order data
            print("Processed Order Data:", order_data)
            
            serializer = self.get_serializer(data=order_data)
            if not serializer.is_valid():
                print("Serializer Errors:", serializer.errors)
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print("Unexpected Error:", str(e))
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class OrderDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        return super().get_object()

@api_view(['PUT'])
@permission_classes([AllowAny])
def update_order_status(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        new_status = request.data.get('status')
        
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response(
                {"error": "Invalid status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate status transition
        if order.status == 'Completed' and new_status != 'Completed':
            return Response(
                {"error": "Cannot change status of completed order"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.status == 'Cancelled' and new_status != 'Cancelled':
            return Response(
                {"error": "Cannot change status of cancelled order"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update order status
        order.status = new_status
        order.save()

        return Response(OrderSerializer(order, context={'request': request}).data)

    except Order.DoesNotExist:
        return Response(
            {"error": "Order not found"},
            status=status.HTTP_404_NOT_FOUND
        )

# -----------------------------
# Report Views
# -----------------------------
class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Report.objects.all()

    def perform_create(self, serializer):
        serializer.save()

class SalesReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            return Response({'error': 'Start date and end date are required'}, status=400)

        # Get completed orders within date range
        orders = Order.objects.filter(
            status='Completed',
            order_date__date__gte=start_date,
            order_date__date__lte=end_date
        )

        # Calculate total sales and orders
        total_sales = orders.aggregate(total=Sum('total_amount'))['total'] or 0
        total_orders = orders.count()
        average_order_value = total_sales / total_orders if total_orders > 0 else 0

        # Get sales by date
        sales_by_date = orders.annotate(
            date=TruncDate('order_date')
        ).values('date').annotate(
            amount=Sum('total_amount')
        ).order_by('date')

        # Get top selling products
        top_products = OrderItem.objects.filter(
            order__in=orders
        ).values(
            'batch__product__product_name',
            'batch__product__brand_name'
        ).annotate(
            quantity=Sum('quantity'),
            revenue=Sum('subtotal')
        ).order_by('-revenue')[:5]

        # Format top products data
        formatted_top_products = [{
            'name': f"{item['batch__product__product_name']} ({item['batch__product__brand_name']})",
            'quantity': item['quantity'],
            'revenue': item['revenue']
        } for item in top_products]

        data = {
            'totalSales': total_sales,
            'totalOrders': total_orders,
            'averageOrderValue': average_order_value,
            'salesByDate': list(sales_by_date),
            'topProducts': formatted_top_products
        }

        return Response(data)

    def post(self, request):
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')

        if not start_date or not end_date:
            return Response({'error': 'Start date and end date are required'}, status=400)

        # Create report record without generated_by for unauthenticated users
        report_data = {
            'report_type': 'sales',
            'start_date': start_date,
            'end_date': end_date,
        }
        
        # Only add generated_by if user is authenticated
        if request.user.is_authenticated:
            report_data['generated_by'] = request.user

        report = Report.objects.create(**report_data)

        # Generate CSV file
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="sales_report_{start_date}_to_{end_date}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Total Sales', 'Number of Orders', 'Average Order Value'])

        # Get daily sales data
        orders = Order.objects.filter(
            status='Completed',
            order_date__date__gte=start_date,
            order_date__date__lte=end_date
        )

        daily_sales = orders.annotate(
            date=TruncDate('order_date')
        ).values('date').annotate(
            total_sales=Sum('total_amount'),
            order_count=Count('id')
        ).order_by('date')

        for day in daily_sales:
            writer.writerow([
                day['date'],
                day['total_sales'],
                day['order_count'],
                day['total_sales'] / day['order_count'] if day['order_count'] > 0 else 0
            ])

        # Save file path
        file_path = os.path.join(settings.MEDIA_ROOT, 'reports', f'sales_report_{report.id}.csv')
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w') as f:
            f.write(response.content.decode('utf-8'))

        report.file_path = file_path
        report.save()

        return response

class InventoryReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Get inventory statistics
        total_products = Product.objects.count()
        low_stock_items = ProductBatch.objects.filter(
            is_active=True,
            quantity__lte=F('product__low_stock_threshold')
        ).count()
        out_of_stock_items = ProductBatch.objects.filter(
            is_active=True,
            quantity=0
        ).count()
        expiring_items = ProductBatch.objects.filter(
            is_active=True,
            expiration_date__lte=timezone.now().date() + timedelta(days=30)
        ).count()

        # Get stock levels with product details
        stock_levels = ProductBatch.objects.filter(
            is_active=True
        ).values(
            'product__product_name',
            'product__brand_name',
            'product__category',
            'product__price'
        ).annotate(
            current=Sum('quantity'),
            threshold=F('product__low_stock_threshold')
        )

        # Format stock levels data
        formatted_stock_levels = [{
            'name': f"{item['product__product_name']} ({item['product__brand_name']})",
            'category': item['product__category'],
            'price': item['product__price'],
            'current': item['current'],
            'threshold': item['threshold']
        } for item in stock_levels]

        data = {
            'totalProducts': total_products,
            'lowStockItems': low_stock_items,
            'outOfStockItems': out_of_stock_items,
            'expiringItems': expiring_items,
            'stockLevels': formatted_stock_levels
        }

        return Response(data)

    def post(self, request):
        # Create report record without generated_by for unauthenticated users
        report_data = {
            'report_type': 'inventory',
            'start_date': timezone.now().date(),
            'end_date': timezone.now().date(),
        }
        
        # Only add generated_by if user is authenticated
        if request.user.is_authenticated:
            report_data['generated_by'] = request.user

        report = Report.objects.create(**report_data)

        # Generate CSV file
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="inventory_report.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Product Name',
            'Brand Name',
            'Category',
            'Current Stock',
            'Threshold',
            'Status',
            'Price',
            'Total Value'
        ])

        # Get stock levels with product details
        stock_levels = ProductBatch.objects.filter(
            is_active=True
        ).values(
            'product__product_name',
            'product__brand_name',
            'product__category',
            'product__price'
        ).annotate(
            current=Sum('quantity'),
            threshold=F('product__low_stock_threshold')
        )

        for item in stock_levels:
            status = 'Low Stock' if item['current'] <= item['threshold'] else 'Adequate'
            total_value = item['current'] * item['product__price']
            writer.writerow([
                item['product__product_name'],
                item['product__brand_name'],
                item['product__category'],
                item['current'],
                item['threshold'],
                status,
                item['product__price'],
                total_value
            ])

        # Save file path
        file_path = os.path.join(settings.MEDIA_ROOT, 'reports', f'inventory_report_{report.id}.csv')
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w') as f:
            f.write(response.content.decode('utf-8'))

        report.file_path = file_path
        report.save()

        return response

class PrescriptionReportView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if not start_date or not end_date:
            return Response({'error': 'Start date and end date are required'}, status=400)

        # Get prescription statistics
        prescriptions = Prescription.objects.filter(
            uploaded_at__date__gte=start_date,
            uploaded_at__date__lte=end_date
        )

        total_prescriptions = prescriptions.count()
        pending_verifications = prescriptions.filter(status='Pending').count()
        verified_prescriptions = prescriptions.filter(status='Approved').count()
        rejected_prescriptions = prescriptions.filter(status='Rejected').count()

        # Get prescription trends
        prescription_trends = prescriptions.annotate(
            date=TruncDate('uploaded_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')

        data = {
            'totalPrescriptions': total_prescriptions,
            'pendingVerifications': pending_verifications,
            'verifiedPrescriptions': verified_prescriptions,
            'rejectedPrescriptions': rejected_prescriptions,
            'prescriptionTrends': list(prescription_trends)
        }

        return Response(data)

    def post(self, request):
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')

        if not start_date or not end_date:
            return Response({'error': 'Start date and end date are required'}, status=400)

        # Create report record without generated_by for unauthenticated users
        report_data = {
            'report_type': 'prescriptions',
            'start_date': start_date,
            'end_date': end_date,
        }
        
        # Only add generated_by if user is authenticated
        if request.user.is_authenticated:
            report_data['generated_by'] = request.user

        report = Report.objects.create(**report_data)

        # Generate CSV file
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="prescription_report_{start_date}_to_{end_date}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Total Prescriptions', 'Pending', 'Verified', 'Rejected'])

        # Get daily prescription data
        prescriptions = Prescription.objects.filter(
            uploaded_at__date__gte=start_date,
            uploaded_at__date__lte=end_date
        )

        daily_prescriptions = prescriptions.annotate(
            date=TruncDate('uploaded_at')
        ).values('date').annotate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='Pending')),
            verified=Count('id', filter=Q(status='Approved')),
            rejected=Count('id', filter=Q(status='Rejected'))
        ).order_by('date')

        for day in daily_prescriptions:
            writer.writerow([
                day['date'],
                day['total'],
                day['pending'],
                day['verified'],
                day['rejected']
            ])

        # Save file path
        file_path = os.path.join(settings.MEDIA_ROOT, 'reports', f'prescription_report_{report.id}.csv')
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, 'w') as f:
            f.write(response.content.decode('utf-8'))

        report.file_path = file_path
        report.save()

        return response
