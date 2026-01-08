"""
Custom authentication classes for the inventory API.
"""
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions
from django.utils.translation import gettext_lazy as _


class ActiveUserJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that checks if the user is active.
    
    This extends the default JWTAuthentication to add an additional
    check for the user's is_active status. If a user is marked as
    inactive, they will not be able to authenticate even with a
    valid JWT token.
    """
    
    def authenticate(self, request):
        """
        Authenticate the request and return a two-tuple of (user, token).
        
        Raises:
            AuthenticationFailed: If the user is inactive
        """
        # Call parent authentication method
        result = super().authenticate(request)
        
        # If authentication was successful, check if user is active
        if result is not None:
            user, token = result
            
            # Check if user is active
            if not user.is_active:
                raise exceptions.AuthenticationFailed(
                    _('User account is disabled. Please contact an administrator.'),
                    code='user_inactive'
                )
            
            return user, token
        
        return None
