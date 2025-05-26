from rest_framework import permissions

class IsOwnerReadOnly(permissions.BasePermission):
    """
    Allows read-only access to any user, but write access only to the owner (customer).
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.customer == request.user


class IsPharmacyStaff(permissions.BasePermission):
    """
    Allows access only to users with role Admin or Pharmacy Staff.
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.userrole in ['Admin', 'Pharmacy Staff']
        )
