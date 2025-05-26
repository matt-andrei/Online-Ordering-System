from django.urls import path, include
from . import views
from .views import get_category_choices
from .views import CustomTokenObtainPairView
from rest_framework.routers import DefaultRouter
  
router = DefaultRouter()
router.register(r'reports', views.ReportViewSet, basename='report')

urlpatterns = [
    # Authentication endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # User endpoints
    path('users/', views.UserList.as_view(), name='user_list'),
    path('users/create/', views.CreateUserView.as_view(), name='create_user'),
    path('users/<int:pk>/', views.UserDetail.as_view(), name='user_detail'),
    path('users/update-delete/<int:pk>/', views.UserUpdateDelete.as_view(), name='update_delete_user'),
    path('users/fetch/', views.get_users, name='get_users'),
    path('users/create/fb/', views.create_user, name='create_user_fb'),
    path('users/detail/fb/<int:pk>/', views.user_detail, name='user_detail_fb'),

    # Product endpoints
    path('products/', views.ProductListCreate.as_view(), name='product_list_create'),
    path('products/<int:pk>/', views.ProductDetail.as_view(), name='product_detail'),
    path('categories/', get_category_choices, name='category-choices'),

    # Product Batch endpoints
    path('batches/', views.ProductBatchListCreate.as_view(), name='batch_list_create'),
    path('batches/<int:pk>/', views.ProductBatchDetail.as_view(), name='batch_detail'),
    path('product/<int:product_id>/batches/', views.product_batches, name='product_batches'),
    path('product/<int:product_id>/batches/create/', views.create_product_batch, name='create_product_batch'),
    path('product/<int:product_id>/batches/<int:batch_id>/update/', views.update_product_batch, name='update_product_batch'),
    path('product/<int:product_id>/batches/<int:batch_id>/delete/', views.delete_product_batch, name='delete_product_batch'),
    path('product/<int:product_id>/batches/active/', views.get_active_batches, name='get_active_batches'),

    # Dashboard endpoints
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('dashboard/recent-orders/', views.recent_orders, name='recent_orders'),

    # Prescription endpoints
    path('prescriptions/', views.PrescriptionListCreate.as_view(), name='prescription_list_create'),
    path('prescriptions/<int:pk>/', views.PrescriptionDetail.as_view(), name='prescription_detail'),
    path('prescriptions/<int:pk>/verify/', views.verify_prescription, name='verify_prescription'),
    path('prescriptions/customer/', views.customer_prescriptions, name='customer_prescriptions'),
    path('prescriptions/pending/', views.pending_prescriptions, name='pending_prescriptions'),

    # Order endpoints
    path('orders/', views.OrderListCreate.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', views.OrderDetail.as_view(), name='order-detail'),
    path('orders/<int:order_id>/status/', views.update_order_status, name='update-order-status'),

    # Report endpoints
    path('reports/sales/', views.SalesReportView.as_view(), name='sales-report'),
    path('reports/inventory/', views.InventoryReportView.as_view(), name='inventory-report'),
    path('reports/prescriptions/', views.PrescriptionReportView.as_view(), name='prescription-report'),
]

# Include router URLs
urlpatterns += router.urls
