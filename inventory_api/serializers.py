from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    User, Product, Category, Supplier,
    StockMovement, Sale, SaleItem, BusinessSettings
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'force_password_change')
        read_only_fields = ('id',)

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
    
    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'email', 
                 'first_name', 'last_name', 'role', 'is_active')
        read_only_fields = ('id',)
        
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

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Sale
        fields = (
            'id', 'payment_method', 'total_amount',
            'created_at', 'created_by', 'created_by_username',
            'items'
        )
        read_only_fields = ('id', 'created_at', 'created_by')

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        request = self.context.get('request')
        
        # We don't set created_by at all - let the model handle it with its default
        # This allows anonymous users to create sales
        
        sale = Sale.objects.create(**validated_data)
        
        for item_data in items_data:
            SaleItem.objects.create(sale=sale, **item_data)
        
        return sale