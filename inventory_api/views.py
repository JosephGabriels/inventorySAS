from rest_framework import viewsets, views, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash, get_user_model
from django.db.models import Sum, Count, F, ExpressionWrapper, DecimalField, Avg
from django.db.models.functions import TruncDate, TruncMonth, TruncYear
from django.utils import timezone
from datetime import timedelta, datetime
import pandas as pd
import numpy as np

from .models import (
    User, Product, Category, Supplier,
    StockMovement, Sale, SaleItem, BusinessSettings
)
from .serializers import (
    UserSerializer, ProductSerializer, CategorySerializer,
    SupplierSerializer, StockMovementSerializer,
    DailyStatsSerializer, MonthlyStatsSerializer, AIForecastSerializer,
    SaleSerializer, SaleItemSerializer,
    RegisterSerializer, UserManagementSerializer, BusinessSettingsSerializer,
    ChangePasswordSerializer
)

# Custom permissions
class IsAdminOrManager(permissions.BasePermission):
    """
    Custom permission to only allow admins or managers.
    """
    def has_permission(self, request, view):
        # Check if the user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Allow if admin or manager role
        return request.user.role in ['admin', 'manager']

class IsAdminOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users.
    """
    def has_permission(self, request, view):
        # Check if the user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Allow only if admin role
        return request.user.role == 'admin'

# Authentication views
class RegisterView(views.APIView):
    """API view for user registration"""
    permission_classes = [IsAdminOnly]  # Only admins can register new users
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens for the user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAdminOnly]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserManagementSerializer
        return UserSerializer
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Returns the current authenticated user
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """
        Change the password for the current user
        """
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            # Check current password
            if not user.check_password(serializer.validated_data['current_password']):
                return Response(
                    {'current_password': ['Wrong password.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            
            # Remove force_password_change flag if it was set
            if user.force_password_change:
                user.force_password_change = False
            
            user.save()
            
            # Update session to avoid logout
            update_session_auth_hash(request, user)
            
            return Response({'status': 'password changed'}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    data = request.data

    if not data.get('old_password') or not data.get('new_password'):
        return Response(
            {'message': 'Both old_password and new_password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if old password is correct
    if not user.check_password(data['old_password']):
        return Response(
            {'message': 'Current password is incorrect'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set new password
    user.set_password(data['new_password'])
    user.save()

    return Response({'message': 'Password updated successfully'})

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        try:
            serializer.save(created_by=self.request.user)
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def perform_update(self, serializer):
        try:
            serializer.save(updated_by=self.request.user)
        except Exception as e:
            raise serializers.ValidationError(str(e))

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            response.data['message'] = 'Product created successfully'
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code == 200:
            response.data['message'] = 'Product updated successfully'
        return response


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            print(f"Received sale data: {request.data}")  # Log received data
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                print(f"Validation errors: {serializer.errors}")  # Log validation errors
                return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except serializers.ValidationError as e:
            print(f"Validation error: {str(e)}")  # Log validation error
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error creating sale: {str(e)}")  # Log the error
            return Response({'error': 'An unexpected error occurred'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        print("Performing create...")  # Log create operation
        
        # Set created_by from authenticated user
        sale = serializer.save(created_by=self.request.user)
            
        print(f"Sale created: {sale.id}")  # Log created sale ID

class DailyStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        movements = StockMovement.objects.filter(
            created_at__date=today,
            movement_type='out'
        )
        
        stats = {
            'date': today,
            'total_sales': movements.aggregate(
                total=Sum(F('quantity') * F('product__unit_price'))
            )['total'] or 0,
            'total_cost': movements.aggregate(
                total=Sum(F('quantity') * F('product__cost_price'))
            )['total'] or 0,
            'items_sold': movements.aggregate(
                total=Sum('quantity')
            )['total'] or 0,
            'top_products': self._get_top_products(movements)
        }
        
        stats['profit'] = stats['total_sales'] - stats['total_cost']
        
        serializer = DailyStatsSerializer(stats)
        return Response(serializer.data)

    def _get_top_products(self, movements):
        return movements.values(
            'product__name'
        ).annotate(
            quantity=Sum('quantity'),
            revenue=Sum(F('quantity') * F('product__unit_price'))
        ).order_by('-quantity')[:5]

class MonthlyStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        movements = StockMovement.objects.filter(
            created_at__date__range=[start_date, end_date],
            movement_type='out'
        )
        
        monthly_data = movements.annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total_sales=Sum(F('quantity') * F('product__unit_price')),
            total_cost=Sum(F('quantity') * F('product__cost_price')),
            items_sold=Sum('quantity')
        ).order_by('month')
        
        serializer = MonthlyStatsSerializer(monthly_data, many=True)
        return Response(serializer.data)

class DemandForecastView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get historical data
        movements = StockMovement.objects.filter(
            product=product,
            created_at__gte=timezone.now() - timedelta(days=90)
        ).values('created_at__date').annotate(
            quantity=Sum('quantity')
        ).order_by('created_at__date')

        # Simple moving average forecast
        if movements:
            df = pd.DataFrame(movements)
            ma = df['quantity'].rolling(window=7).mean()
            forecast = int(ma.iloc[-1]) if not np.isnan(ma.iloc[-1]) else 0
            
            forecast_data = {
                'product_id': product_id,
                'forecast_quantity': max(0, forecast),
                'confidence_score': 0.7,  # Placeholder
                'suggested_restock_date': timezone.now().date() + timedelta(days=7)
            }
            
            serializer = AIForecastSerializer(forecast_data)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Insufficient data for forecast'},
            status=status.HTTP_400_BAD_REQUEST
        )

class RestockSuggestionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        low_stock_products = Product.objects.filter(quantity__lte=F('reorder_point'))
        suggestions = []
        
        for product in low_stock_products:
            # Calculate average daily sales
            thirty_days_ago = timezone.now() - timedelta(days=30)
            daily_sales = StockMovement.objects.filter(
                product=product,
                movement_type='out',
                created_at__gte=thirty_days_ago
            ).values('created_at__date').annotate(
                total=Sum('quantity')
            ).aggregate(avg=Avg('total'))['avg'] or 0
            
            suggested_quantity = max(1, int(daily_sales * 7))  # 1 week stock
            
            suggestions.append({
                'product_id': product.id,
                'product_name': product.name,
                'current_stock': product.quantity,
                'suggested_quantity': suggested_quantity,
                'urgency': 'high' if product.quantity == 0 else 'medium'
            })
        
        return Response(suggestions)

class YearlyStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=365)
        
        movements = StockMovement.objects.filter(
            created_at__date__range=[start_date, end_date],
            movement_type='out'
        )
        
        yearly_data = movements.annotate(
            year=TruncYear('created_at')
        ).values('year').annotate(
            total_sales=Sum(F('quantity') * F('product__unit_price')),
            total_cost=Sum(F('quantity') * F('product__cost_price')),
            items_sold=Sum('quantity')
        ).order_by('year')
        
        serializer = MonthlyStatsSerializer(yearly_data, many=True)
        return Response(serializer.data)

class DairyStatsView(views.APIView):
    """
    View to provide statistics specifically for dairy products.
    This endpoint supplies daily sales, profits, and other metrics for dairy products.
    """
    permission_classes = [permissions.AllowAny]  # Temporarily allow all access for development

    def get(self, request):
        # Parse query parameters
        days = int(request.query_params.get('days', 1))
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Calculate date range
        if start_date and end_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=days-1)
        
        print(f"Generating dairy stats from {start_date} to {end_date} ({days} days)")
        
        # Get ALL products to ensure we don't miss any sales
        all_products = Product.objects.all()
        print(f"Total products in system: {all_products.count()}")
        
        # Step 1: Identify dairy-related categories and products
        dairy_categories = []
        dairy_keywords = ['dairy', 'milk', 'cheese', 'yogurt', 'cream', 'butter']
        
        # First look for categories with dairy-related names
        for name in dairy_keywords:
            categories = Category.objects.filter(name__icontains=name)
            for category in categories:
                if category not in dairy_categories:
                    dairy_categories.append(category)
                    print(f"Found dairy category: {category.name} (ID: {category.id})")
        
        # Then look for products with dairy-related names
        product_name_filter = r'(?i)(' + '|'.join(dairy_keywords) + ')'
        dairy_named_products = Product.objects.filter(name__iregex=product_name_filter)
        
        # Add their categories
        for product in dairy_named_products:
            if product.category and product.category not in dairy_categories:
                dairy_categories.append(product.category)
                print(f"Added category from product name: {product.category.name} (from product: {product.name})")
        
        # If we still don't have any dairy categories, include all categories
        # This ensures we get data, even if imperfect, rather than zeros
        if not dairy_categories:
            print("No dairy categories found. Including all categories for data.")
            dairy_categories = list(Category.objects.all())
            
        # Get all products from the identified categories
        dairy_products = Product.objects.filter(category__in=dairy_categories)
        print(f"Found {dairy_products.count()} dairy products in {len(dairy_categories)} categories")
        
        # Print all dairy product names for debugging
        for product in dairy_products[:10]:  # Limit to 10 to avoid console spam
            print(f"Dairy product: {product.name} (ID: {product.id}, Category: {product.category.name if product.category else 'None'})")
        
        # Get sales data: First try SaleItem
        # This approach directly uses the Sale and SaleItem models which should be more reliable
        # for tracking actual sales than StockMovements
        sale_items = []
        try:
            # Get all sales in the date range
            sales = Sale.objects.filter(created_at__date__range=[start_date, end_date])
            print(f"Found {sales.count()} total sales in date range")
            
            # Get sale items for dairy products
            sale_items = SaleItem.objects.filter(
                sale__in=sales,
                product__in=dairy_products
            )
            print(f"Found {sale_items.count()} sale items for dairy products")
        except Exception as e:
            print(f"Error fetching sale items: {e}")
        
        # If we have sale items, use them for the statistics
        if sale_items:
            try:
                # Calculate statistics using SaleItem data
                total_revenue = sum(item.quantity * item.unit_price for item in sale_items)
                total_cost = sum(item.quantity * item.product.cost_price for item in sale_items)
                total_quantity = sum(item.quantity for item in sale_items)
                total_profit = total_revenue - total_cost
                
                # Group and summarize product performance
                product_summary = {}
                for item in sale_items:
                    product_id = item.product.id
                    product_name = item.product.name
                    
                    if product_id not in product_summary:
                        product_summary[product_id] = {
                            'product__name': product_name,
                            'product__id': product_id,
                            'total_quantity': 0,
                            'total_revenue': 0,
                            'total_cost': 0,
                            'profit': 0
                        }
                    
                    product_summary[product_id]['total_quantity'] += item.quantity
                    product_summary[product_id]['total_revenue'] += (item.quantity * item.unit_price)
                    product_summary[product_id]['total_cost'] += (item.quantity * item.product.cost_price)
                    product_summary[product_id]['profit'] += (item.quantity * (item.unit_price - item.product.cost_price))
                
                # Convert to list and sort by revenue
                product_stats = list(product_summary.values())
                product_stats.sort(key=lambda x: x['total_revenue'], reverse=True)
                
                print(f"Calculated from SaleItems: Revenue: {total_revenue}, Profit: {total_profit}, Quantity: {total_quantity}")
                
            except Exception as e:
                print(f"Error calculating sale item statistics: {e}")
                # Fallback to zero values if there's an error
                total_revenue = 0
                total_cost = 0
                total_quantity = 0
                total_profit = 0
                product_stats = []
                
        # Fallback to StockMovements if no SaleItems were found
        else:
            print("No sale items found. Falling back to StockMovements...")
            # Get stock movements for the dairy products in the date range
            movements = StockMovement.objects.filter(
                product__in=dairy_products,
                created_at__date__range=[start_date, end_date],
                movement_type='out'  # Look for any 'out' movements, not just sales
            )
            print(f"Found {movements.count()} stock movements for dairy products")
            
            # If we have movements, calculate statistics
            if movements.exists():
                try:
                    # Calculate statistics
                    total_stats = movements.aggregate(
                        total_revenue=Sum(F('quantity') * F('product__unit_price')),
                        total_cost=Sum(F('quantity') * F('product__cost_price')),
                        total_quantity=Sum('quantity')
                    )
                    
                    total_revenue = total_stats['total_revenue'] or 0
                    total_cost = total_stats['total_cost'] or 0
                    total_quantity = total_stats['total_quantity'] or 0
                    total_profit = float(total_revenue) - float(total_cost)
                    
                    # Get product-specific statistics
                    product_stats = movements.values(
                        'product__name',
                        'product__id'
                    ).annotate(
                        total_quantity=Sum('quantity'),
                        total_revenue=Sum(F('quantity') * F('product__unit_price')),
                        total_cost=Sum(F('quantity') * F('product__cost_price')),
                        profit=Sum(
                            F('quantity') * (F('product__unit_price') - F('product__cost_price'))
                        )
                    ).order_by('-total_revenue')
                    
                    print(f"Calculated from StockMovements: Revenue: {total_revenue}, Profit: {total_profit}, Quantity: {total_quantity}")
                    
                except Exception as e:
                    print(f"Error calculating stock movement statistics: {e}")
                    # Fallback to zero values if there's an error
                    total_revenue = 0
                    total_cost = 0
                    total_quantity = 0
                    total_profit = 0
                    product_stats = []
            else:
                print("No stock movements found either.")
                # No data found
                total_revenue = 0
                total_cost = 0
                total_quantity = 0
                total_profit = 0
                product_stats = []
        
        # If we still have no data, check if there are any sales at all
        if total_revenue == 0 and total_quantity == 0:
            print("No dairy sales found. Checking if there are any sales in the system...")
            try:
                all_sales = Sale.objects.filter(created_at__date__range=[start_date, end_date])
                all_sale_items = SaleItem.objects.filter(sale__in=all_sales)
                
                if all_sales.exists():
                    print(f"Found {all_sales.count()} total sales with {all_sale_items.count()} items, but none matched dairy products.")
                    
                    # For debugging, show what products were actually sold
                    sold_products = Product.objects.filter(
                        id__in=all_sale_items.values_list('product', flat=True).distinct()
                    )
                    print(f"Products sold in this period ({sold_products.count()}):")
                    for product in sold_products[:10]:  # Limit to 10
                        print(f"- {product.name} (Category: {product.category.name if product.category else 'None'})")
            except Exception as e:
                print(f"Error checking overall sales: {e}")
        
        # Return comprehensive response with debug info
        return Response({
            'period': {
                'start_date': str(start_date),
                'end_date': str(end_date),
                'days': (end_date - start_date).days + 1
            },
            'total_stats': {
                'revenue': float(total_revenue),
                'cost': float(total_cost),
                'profit': float(total_profit),
                'quantity': total_quantity
            },
            'dairy_products': product_stats,
            'categories_used': [cat.name for cat in dairy_categories],
            'product_count': dairy_products.count(),
            'debug_info': {
                'dairy_categories_count': len(dairy_categories),
                'dairy_products_count': dairy_products.count(),
                'date_range': f"{start_date} to {end_date}",
                'data_source': 'SaleItems' if sale_items else ('StockMovements' if 'movements' in locals() and movements.exists() else 'No data')
            }
        })

class AnomalyDetectionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        days = int(request.data.get('days', 30))
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get historical data
        movements = StockMovement.objects.filter(
            product=product,
            created_at__gte=timezone.now() - timedelta(days=days)
        ).values('created_at__date').annotate(
            quantity=Sum('quantity')
        ).order_by('created_at__date')

        if movements:
            df = pd.DataFrame(movements)
            # Calculate mean and standard deviation
            mean = df['quantity'].mean()
            std = df['quantity'].std()
            
            # Define anomalies as values outside 2 standard deviations
            anomalies = df[abs(df['quantity'] - mean) > 2 * std]
            
            result = []
            for _, row in anomalies.iterrows():
                result.append({
                    'date': row['created_at__date'],
                    'quantity': row['quantity'],
                    'expected_range': {
                        'min': mean - 2 * std,
                        'max': mean + 2 * std
                    },
                    'deviation_score': abs(row['quantity'] - mean) / std,
                    'type': 'high' if row['quantity'] > mean else 'low'
                })
            
            return Response({
                'product_id': product_id,
                'anomalies': result,
                'analysis_period_days': days,
                'total_movements_analyzed': len(df),
                'anomalies_detected': len(result)
            })
        
        return Response(
            {'error': 'Insufficient data for anomaly detection'},
            status=status.HTTP_400_BAD_REQUEST
        )

class RecordSaleView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        items = request.data.get('items', [])
        if not items:
            return Response(
                {'error': 'No items provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sale_movements = []
        total_amount = 0
        
        for item in items:
            try:
                product = Product.objects.get(id=item['product_id'])
            except Product.DoesNotExist:
                return Response(
                    {'error': f'Product {item["product_id"]} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            quantity = int(item.get('quantity', 1))
            if quantity > product.quantity:
                return Response(
                    {'error': f'Insufficient stock for product {product.name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create stock movement
            movement = StockMovement.objects.create(
                product=product,
                quantity=quantity,
                movement_type='out',
                reason='sale',
                created_by=request.user
            )
            
            # Update product quantity
            product.quantity -= quantity
            product.save()
            
            sale_movements.append(movement)
            total_amount += quantity * product.unit_price
        
        return Response({
            'status': 'success',
            'total_amount': total_amount,
            'items_count': len(sale_movements),
            'movements': StockMovementSerializer(sale_movements, many=True).data
        })

class SalesAnalyticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        group_by = request.query_params.get('group_by', 'product')
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        movements = StockMovement.objects.filter(
            created_at__date__range=[start_date, end_date],
            movement_type='out',
            reason='sale'
        )
        
        if group_by == 'product':
            analytics = movements.values(
                'product__name'
            ).annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum(F('quantity') * F('product__unit_price')),
                total_cost=Sum(F('quantity') * F('product__cost_price')),
                profit=Sum(
                    F('quantity') * (F('product__unit_price') - F('product__cost_price'))
                )
            ).order_by('-total_revenue')
        elif group_by == 'category':
            analytics = movements.values(
                'product__category__name'
            ).annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum(F('quantity') * F('product__unit_price')),
                total_cost=Sum(F('quantity') * F('product__cost_price')),
                profit=Sum(
                    F('quantity') * (F('product__unit_price') - F('product__cost_price'))
                )
            ).order_by('-total_revenue')
        else:
            return Response(
                {'error': 'Invalid group_by parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        total_stats = movements.aggregate(
            total_revenue=Sum(F('quantity') * F('product__unit_price')),
            total_cost=Sum(F('quantity') * F('product__cost_price')),
            total_quantity=Sum('quantity')
        )
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'days': days
            },
            'total_stats': {
                'revenue': total_stats['total_revenue'] or 0,
                'cost': total_stats['total_cost'] or 0,
                'profit': (total_stats['total_revenue'] or 0) - (total_stats['total_cost'] or 0),
                'quantity': total_stats['total_quantity'] or 0
            },
            'analytics': analytics
        })

class GenerateReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        report_type = request.data.get('type', 'sales')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if report_type == 'sales':
            data = self._generate_sales_report(start_date, end_date)
        elif report_type == 'inventory':
            data = self._generate_inventory_report()
        else:
            return Response(
                {'error': 'Invalid report type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(data)

    def _generate_sales_report(self, start_date, end_date):
        movements = StockMovement.objects.filter(
            movement_type='out',
            created_at__date__range=[start_date, end_date]
        )
        
        return {
            'total_sales': movements.aggregate(
                total=Sum(F('quantity') * F('product__unit_price'))
            )['total'] or 0,
            'total_items': movements.aggregate(
                total=Sum('quantity')
            )['total'] or 0,
            'by_product': movements.values(
                'product__name'
            ).annotate(
                quantity=Sum('quantity'),
                revenue=Sum(F('quantity') * F('product__unit_price'))
            ).order_by('-revenue')
        }

    def _generate_inventory_report(self):
        return {
            'total_products': Product.objects.count(),
            'total_value': Product.objects.aggregate(
                total=Sum(F('quantity') * F('cost_price'))
            )['total'] or 0,
            'low_stock': Product.objects.filter(
                quantity__lte=F('reorder_point')
            ).count(),
            'by_category': Product.objects.values(
                'category__name'
            ).annotate(
                count=Count('id'),
                value=Sum(F('quantity') * F('cost_price'))
            )
        }


class BusinessSettingsViewSet(viewsets.ModelViewSet):
    """
    API endpoint for business settings
    """
    queryset = BusinessSettings.objects.all()
    serializer_class = BusinessSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)
        
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)