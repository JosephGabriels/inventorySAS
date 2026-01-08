# Customer serializer
from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
from django.contrib.auth.password_validation import validate_password
from .models import (
    User, Product, Category, Supplier,
    StockMovement, Sale, SaleItem, BusinessSettings, Payment, Terminal
)

class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()
    is_manager = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 
                 'is_active', 'is_admin', 'is_manager', 'force_password_change', 
                 'date_joined', 'last_login')
        read_only_fields = ('id', 'date_joined', 'last_login', 'is_admin', 'is_manager')
    
    def get_is_admin(self, obj):
        """Return computed is_admin property"""
        return obj.is_admin
    
    def get_is_manager(self, obj):
        """Return computed is_manager property"""
        return obj.is_manager

class BusinessSettingsSerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    
    class Meta:
        model = BusinessSettings
        fields = (
            'id', 'business_name', 'logo', 'address', 'phone', 
            'email', 'tax_id', 'currency', 'created_at', 
            'updated_at', 'updated_by', 'updated_by_username'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'updated_by')
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['updated_by'] = request.user
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {"new_password": "Password fields don't match."}
            )
        return attrs

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, 
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('username', 'password', 'password_confirm', 'email', 
                 'first_name', 'last_name', 'role')
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {"password": "Password fields don't match."}
            )
        return attrs
        
    def create(self, validated_data):
        # Remove password_confirm as it's not needed for user creation
        validated_data.pop('password_confirm')
        
        # Create the user with the validated data
        user = User.objects.create_user(**validated_data)
        return user

class UserManagementSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=False, 
        validators=[validate_password]
    )
    is_admin = serializers.SerializerMethodField()
    is_manager = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email', 
                 'first_name', 'last_name', 'role', 'is_active',
                 'is_admin', 'is_manager', 'date_joined', 'last_login')
        read_only_fields = ('id', 'date_joined', 'last_login', 'is_admin', 'is_manager')
    
    def get_is_admin(self, obj):
        """Return computed is_admin property"""
        return obj.is_admin
    
    def get_is_manager(self, obj):
        """Return computed is_manager property"""
        return obj.is_manager
    
    def validate_role(self, value):
        """Validate role is one of the allowed choices"""
        valid_roles = ['admin', 'manager', 'staff']
        if value not in valid_roles:
            raise serializers.ValidationError(
                f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        return value
        
    def update(self, instance, validated_data):
        # Handle password separately
        password = validated_data.pop('password', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        # Set password if provided
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance
    
    def create(self, validated_data):
        # Remove password from validated_data
        password = validated_data.pop('password', None)
        
        # Create user
        user = User.objects.create(**validated_data)
        
        # Set password if provided
        if password:
            user.set_password(password)
            user.save()
        
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = Product
        fields = (
            'id', 'name', 'sku', 'description', 'quantity',
            'unit_price', 'cost_price', 'category', 'category_name',
            'supplier', 'supplier_name', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = (
            'id', 'product', 'product_name', 'movement_type',
            'quantity', 'reason', 'notes',
            'created_at', 'created_by', 'created_by_username'
        )
        read_only_fields = ('id', 'created_at', 'created_by')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)

# Statistics Serializers
class DailyStatsSerializer(serializers.Serializer):
    date = serializers.DateField()
    total_sales = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2)
    profit = serializers.DecimalField(max_digits=10, decimal_places=2)
    items_sold = serializers.IntegerField()
    top_products = serializers.ListField(child=serializers.DictField())

class MonthlyStatsSerializer(serializers.Serializer):
    month = serializers.DateField()
    total_sales = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_cost = serializers.DecimalField(max_digits=10, decimal_places=2)
    profit = serializers.DecimalField(max_digits=10, decimal_places=2)
    items_sold = serializers.IntegerField()
    growth_rate = serializers.DecimalField(max_digits=5, decimal_places=2)

class AIForecastSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    forecast_quantity = serializers.IntegerField()
    confidence_score = serializers.FloatField()
    suggested_restock_date = serializers.DateField()

class TerminalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Terminal
        fields = '__all__'

class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    total_price = serializers.SerializerMethodField()
    product_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = SaleItem
        fields = (
            'id', 'product', 'product_id', 'product_name', 'quantity',
            'unit_price', 'total_price'
        )
        read_only_fields = ('id', 'product', 'total_price')
        extra_kwargs = {
            'product': {'required': False}  # Make product not required since we'll use product_id
        }

    def get_total_price(self, obj):
        return obj.quantity * obj.unit_price
        
    def validate(self, data):
        """Validate the product exists and is in stock"""
        from .models import Product
        
        product_id = data.get('product_id')
        if product_id:
            try:
                product = Product.objects.get(id=product_id)
                data['product'] = product
                
                # Check if requested quantity is available
                if data['quantity'] > product.quantity:
                    raise serializers.ValidationError(
                        f"Insufficient stock for product {product.name}. Available: {product.quantity}"
                    )
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with ID {product_id} does not exist")
        return data

class PaymentSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = (
            'id', 'sale', 'payment_method', 'amount', 'notes',
            'terminal', 'created_at', 'created_by', 'created_by_username',
            'customer_name'
        )
        read_only_fields = ('id', 'sale', 'created_at', 'created_by')

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else 'System'
    
    def get_customer_name(self, obj):
        if obj.sale and obj.sale.customer:
            return obj.sale.customer.name
        return None

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    payments = PaymentSerializer(many=True, required=False)
    created_by_username = serializers.SerializerMethodField()
    terminal_name = serializers.CharField(source='terminal.name', read_only=True)
    balance_due = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Sale
        fields = (
            'id', 'order_number', 'status', 'total_amount', 'amount_paid', 'balance_due',
            'terminal', 'terminal_name', 'customer', 'customer_name',
            'created_at', 'created_by', 'created_by_username',
            'items', 'payments'
        )
        read_only_fields = ('id', 'order_number', 'created_at', 'created_by', 'amount_paid', 'status')

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else 'System'

    def validate_terminal(self, value):
        if value and not value.is_active:
            raise serializers.ValidationError("This terminal is inactive.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        payments_data = validated_data.pop('payments', [])
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        sale = Sale.objects.create(**validated_data)
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        # Only record up to the total amount as payment (excess is not recorded, only shown as change)
        total_to_record = sale.total_amount
        for payment_data in payments_data:
            if total_to_record <= 0:
                break
            payment_data['sale'] = sale
            # Automatically assign the same terminal as the sale if not provided
            if not payment_data.get('terminal'):
                payment_data['terminal'] = sale.terminal
            if request and request.user and request.user.is_authenticated:
                payment_data['created_by'] = request.user
            payment_amount = min(payment_data['amount'], total_to_record)
            payment_data['amount'] = payment_amount
            Payment.objects.create(**payment_data)
            total_to_record -= payment_amount
        return sale
