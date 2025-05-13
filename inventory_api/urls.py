from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, RegisterView
from . import views

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'suppliers', views.SupplierViewSet)
router.register(r'stock-movements', views.StockMovementViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'sales', views.SaleViewSet)
router.register(r'business-settings', views.BusinessSettingsViewSet)

urlpatterns = [
    # ViewSet routes
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    
    # Statistics endpoints
    path('statistics/daily/', views.DailyStatsView.as_view(), name='daily-stats'),
    path('statistics/monthly/', views.MonthlyStatsView.as_view(), name='monthly-stats'),
    path('statistics/yearly/', views.YearlyStatsView.as_view(), name='yearly-stats'),
    
    # AI/ML endpoints
    path('ai/forecast/', views.DemandForecastView.as_view(), name='demand-forecast'),
    path('ai/restock-suggestion/', views.RestockSuggestionView.as_view(), name='restock-suggestion'),
    path('ai/anomaly-detection/', views.AnomalyDetectionView.as_view(), name='anomaly-detection'),
    
    # Sales endpoints
    path('sales/record/', views.RecordSaleView.as_view(), name='record-sale'),
    path('sales/analytics', views.SalesAnalyticsView.as_view(), name='sales-analytics'),
    
    # Dairy endpoints
    path('dairy/stats/', views.DairyStatsView.as_view(), name='dairy-stats'),
    
    # Reports
    path('reports/generate/', views.GenerateReportView.as_view(), name='generate-report'),
    
    # User management
    path('users/change_password/', views.change_password, name='change_password'),
] + router.urls