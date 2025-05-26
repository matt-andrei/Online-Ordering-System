from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse
import json

class JWTAutomaticRefreshMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Only process if the response is a 401 and contains a refresh token
        if response.status_code == 401 and 'refresh' in request.COOKIES:
            try:
                # Get the refresh token from cookies
                refresh_token = request.COOKIES['refresh']
                
                # Create a new refresh token instance
                refresh = RefreshToken(refresh_token)
                
                # Generate new access token
                new_access_token = str(refresh.access_token)
                
                # Update the response with the new access token
                response_data = json.loads(response.content)
                response_data['access'] = new_access_token
                
                # Create new response with the updated data
                new_response = JsonResponse(response_data)
                
                # Copy all headers from the original response
                for key, value in response.items():
                    new_response[key] = value
                
                return new_response
            except Exception as e:
                # If token refresh fails, return the original response
                return response
        
        return response 