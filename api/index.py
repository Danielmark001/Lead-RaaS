import sys
import os
import json

# Add the project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Import the Flask application
from app import app as application

def handler(request, response):
    """
    Vercel serverless function handler that bridges Flask with Vercel's request/response model.
    
    Args:
        request: Vercel request object
        response: Vercel response object
    
    Returns:
        Bytes representing the response body
    """
    try:
        # Prepare the WSGI environment dictionary
        environ = {
            'REQUEST_METHOD': request.method,
            'SCRIPT_NAME': '',
            'PATH_INFO': request.path,
            'QUERY_STRING': request.query_string.decode('utf-8') if request.query_string else '',
            'SERVER_NAME': request.headers.get('host', 'localhost'),
            'SERVER_PORT': '443',
            'wsgi.version': (1, 0),
            'wsgi.url_scheme': 'https',
            'wsgi.input': request.stream,
            'wsgi.errors': sys.stderr,
            'wsgi.multithread': False,
            'wsgi.multiprocess': False,
            'wsgi.run_once': False
        }

        # Add request headers to the environment
        for key, value in request.headers.items():
            key = 'HTTP_' + key.upper().replace('-', '_')
            environ[key] = value

        # Prepare to collect response information
        response_headers = []
        status = ['200 OK']

        def start_response(status_str, headers, exc_info=None):
            """WSGI start_response callable to capture response status and headers."""
            status[0] = status_str
            response_headers.extend(headers)
            return []

        # Execute the Flask application
        response_body = application(environ, start_response)

        # Parse the status code
        status_code = int(status[0].split()[0])
        
        # Set the response status code
        response.status_code = status_code

        # Set response headers
        for header, value in response_headers:
            response.headers[header] = value

        # Convert response body to bytes if it's not already
        if isinstance(response_body, list):
            response_body = b''.join(body.encode('utf-8') if isinstance(body, str) else body for body in response_body)
        elif isinstance(response_body, str):
            response_body = response_body.encode('utf-8')

        return response_body

    except Exception as e:
        # Comprehensive error handling
        error_response = {
            'error': 'Internal Server Error',
            'message': str(e),
            'traceback': str(sys.exc_info())
        }
        
        # Log the full error (this will appear in Vercel logs)
        print(f"Serverless Handler Error: {error_response}", file=sys.stderr)
        
        # Set error response
        response.status_code = 500
        response.headers['Content-Type'] = 'application/json'
        return json.dumps(error_response).encode('utf-8')