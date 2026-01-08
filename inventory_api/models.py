from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _

# Customer model for loyal/credit customers
class Customer(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class User(AbstractUser):
    """Custom user model for role-based access"""
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('staff', 'Staff'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='staff')
    force_password_change = models.BooleanField(default=False, help_text=_('Require user to change password on next login'))
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
    
    @property
    def is_admin(self):
        """Computed property for backward compatibility"""
        return self.role == 'admin'
    
    @property
    def is_manager(self):
        """Check if user is admin or manager"""
        return self.role in ['admin', 'manager']

class BusinessSettings(models.Model):
    """Store business settings like name, logo, and contact info"""
    business_name = models.CharField(max_length=100, default="Inventory Management System")
    logo = models.ImageField(upload_to='business/', null=True, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    currency = models.CharField(max_length=3, default="USD")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return self.business_name
    
    class Meta:
        verbose_name = _('business settings')
        verbose_name_plural = _('business settings')

class Category(models.Model):
    """Product category model"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

class Supplier(models.Model):
    """Supplier model with contact and payment information"""
    name = models.CharField(max_length=100)
    contact_person = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    tax_id = models.CharField(max_length=50, blank=True)
    payment_terms = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Product(models.Model):
    """Product model with image support and inventory tracking"""
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Relationships
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True)
    
    # Timestamps and audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='products_created')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='products_updated')

    def __str__(self):
        return f"{self.name} ({self.sku})"

    class Meta:
        ordering = ['name']


class StockMovement(models.Model):
    """Track stock movements (in/out) with reason and proof"""
    MOVEMENT_TYPES = (
        ('in', 'Stock In'),
        ('out', 'Stock Out'),
    )
    REASON_CHOICES = (
        ('purchase', 'Purchase'),
        ('sale', 'Sale'),
        ('return', 'Return'),
        ('adjustment', 'Adjustment'),
        ('damage', 'Damage'),
        ('other', 'Other'),
    )
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    movement_type = models.CharField(max_length=3, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    notes = models.TextField(blank=True)
    # Timestamps and audit
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def save(self, *args, **kwargs):
        """Update product quantity on stock movement"""
        if self.movement_type == 'in':
            self.product.quantity += self.quantity
        else:
            self.product.quantity = max(0, self.product.quantity - self.quantity)
        self.product.save()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']

class Terminal(models.Model):
    """Point of Sale terminal/register"""
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']

class Sale(models.Model):
    """Track sales transactions"""
    STATUS_CHOICES = (
        ('paid', 'Fully Paid'),
        ('partial', 'Partially Paid'),
        ('pending', 'Pending'),
    )
    

    order_number = models.CharField(max_length=16, unique=True, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='paid')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    terminal = models.ForeignKey(Terminal, on_delete=models.PROTECT, related_name='sales', null=True)
    customer = models.ForeignKey('Customer', on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='sales_created', null=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            import random, string
            self.order_number = 'PD' + ''.join(random.choices(string.digits, k=6))
        super().save(*args, **kwargs)

    @property
    def balance_due(self):
        return self.total_amount - self.amount_paid

    def __str__(self):
        return f"Sale #{self.id} - {self.status} by {self.created_by.username if self.created_by else 'Unknown'}"

    class Meta:
        ordering = ['-created_at']

class Payment(models.Model):
    """Track individual payments for a sale"""
    PAYMENT_METHODS = (
        ('cash', 'Cash'),
        ('mpesa', 'MPESA'),
        ('equity', 'Equity'),
        ('credit', 'Credit'),
        ('card', 'Card'),
        ('mobile', 'Mobile Payment'),
    )
    
    sale = models.ForeignKey(Sale, related_name='payments', on_delete=models.CASCADE)
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)
    terminal = models.ForeignKey(Terminal, on_delete=models.PROTECT, related_name='payments', null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='payments_created', null=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update sale amount_paid and status
        sale = self.sale
        # Exclude credit payments from amount_paid as they are not "at hand"
        total_paid = sum(p.amount for p in sale.payments.exclude(payment_method='credit'))
        sale.amount_paid = total_paid
        
        # Determine status
        has_credit = sale.payments.filter(payment_method='credit').exists()
        
        if total_paid >= sale.total_amount:
            sale.status = 'paid'
        elif total_paid > 0 or has_credit:
            sale.status = 'partial'
        else:
            sale.status = 'pending'
            
        sale.save(update_fields=["amount_paid", "status"])

    def __str__(self):
        return f"Payment of {self.amount} for Sale #{self.sale.id} ({self.payment_method})"

    class Meta:
        ordering = ['-created_at']

class SaleItem(models.Model):
    """Individual items in a sale"""
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        """Create stock movement on sale"""
        super().save(*args, **kwargs)
        
        # Create stock movement
        StockMovement.objects.create(
            product=self.product,
            movement_type='out',
            quantity=self.quantity,
            reason='sale',
            notes=f'Sale #{self.sale.id}',
            created_by=self.sale.created_by
        )