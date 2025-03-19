"""
Email Manager Module for Lead Generation Tool

This module handles email operations for the lead generation tool,
including sending exports to users and notifications to team members.
"""

import logging
import os
import smtplib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime
from socket import gaierror, timeout

# Configure logger
logger = logging.getLogger(__name__)

class EmailValidationError(Exception):
    """Exception raised for invalid email addresses."""
    pass

class EmailSendError(Exception):
    """Exception raised when email sending fails."""
    pass

class EmailManager:
    """
    Manages email operations for the lead generation tool.
    
    This class handles sending exports via email, configuring email settings,
    and managing templates for common email formats.
    """
    
    def __init__(self):
        """Initialize the email manager with default settings."""
        self.configured = False
        self.settings = {
            'smtp_server': os.environ.get('SMTP_SERVER', 'smtp.gmail.com'),
            'smtp_port': int(os.environ.get('SMTP_PORT', 587)),
            'smtp_user': os.environ.get('SMTP_USER', 'leadgen12344@gmail.com'),
            'smtp_password': os.environ.get('SMTP_PASSWORD', 'dvjyrfoziaojyorz'),
            'default_sender': os.environ.get('DEFAULT_SENDER', 'leadgen12344@gmail.com'),
            'default_subject_prefix': '[Caprae Capital] ',
            'retry_attempts': int(os.environ.get('EMAIL_RETRY_ATTEMPTS', 3)),
            'connection_timeout': int(os.environ.get('EMAIL_TIMEOUT', 30)),
        }
        logger.info("Email manager initialized with default settings")
    
    def configure(self, settings):
        """
        Configure the email manager with custom settings.
        
        Args:
            settings (dict): Email configuration settings
                - smtp_server: SMTP server hostname
                - smtp_port: SMTP server port
                - smtp_user: SMTP username
                - smtp_password: SMTP password
                - default_sender: Default sender email address
                - default_subject_prefix: Prefix for email subjects
                - retry_attempts: Number of retry attempts for failed sends
                - connection_timeout: Timeout in seconds for SMTP connection
        
        Returns:
            bool: True if configuration was successful
        
        Raises:
            ValueError: If required settings are missing or invalid
        """
        # Validate required settings
        required_keys = ['smtp_server', 'smtp_port', 'smtp_user', 'smtp_password']
        missing_keys = [key for key in required_keys if key in settings and not settings[key]]
        
        if missing_keys:
            error_msg = f"Missing required email settings: {', '.join(missing_keys)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
            
        # Update settings with provided values
        for key, value in settings.items():
            if key in self.settings:
                self.settings[key] = value
        
        # Mark as configured
        self.configured = True
        logger.info("Email manager configured with custom settings")
        return True
    
    def validate_email(self, email):
        """
        Validate an email address format.
        
        Args:
            email (str): Email address to validate
            
        Returns:
            bool: True if email is valid
            
        Raises:
            EmailValidationError: If email format is invalid
        """
        # Simple regex for basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise EmailValidationError(f"Invalid email address format: {email}")
        return True
    
    def send_export(self, recipient, subject, message, file_data, file_name, file_type):
        """
        Send an export file via email.
        
        Args:
            recipient (str): Recipient email address
            subject (str): Email subject line
            message (str): Email message content
            file_data (str/bytes): The file content to attach
            file_name (str): The name of the attachment
            file_type (str): The type of file (csv, json, etc.)
            
        Returns:
            dict: Status of the email operation
            
        Raises:
            EmailValidationError: If email format is invalid
            EmailSendError: If there is an error sending the email
        """
        try:
            # Validate email
            self.validate_email(recipient)
            
            # Log the email request
            logger.info(f"Preparing to send {file_type} export to {recipient}")
            
            # Create a multipart message
            msg = MIMEMultipart()
            msg['From'] = self.settings['default_sender']
            msg['To'] = recipient
            msg['Subject'] = f"{self.settings['default_subject_prefix']}{subject}"
            
            # Add message body
            body = self._build_email_body(message, file_type)
            msg.attach(MIMEText(body, 'html'))
            
            # Add file attachment
            attachment = self._create_attachment(file_data, file_name, file_type)
            msg.attach(attachment)
            
            # Connect to SMTP server and send email
            attempts = 0
            while attempts < self.settings['retry_attempts']:
                try:
                    with smtplib.SMTP(self.settings['smtp_server'], 
                                     self.settings['smtp_port'], 
                                     timeout=self.settings['connection_timeout']) as server:
                        server.starttls()
                        if self.settings['smtp_user'] and self.settings['smtp_password']:
                            server.login(self.settings['smtp_user'], self.settings['smtp_password'])
                        server.send_message(msg)
                        
                        # Log successful send
                        logger.info(f"Export successfully sent to {recipient}")
                        
                        return {
                            'status': 'success',
                            'message': f'Export successfully sent to {recipient}',
                            'timestamp': datetime.now().isoformat()
                        }
                except (smtplib.SMTPException, gaierror, timeout) as e:
                    attempts += 1
                    logger.warning(f"Email send attempt {attempts} failed: {str(e)}")
                    if attempts >= self.settings['retry_attempts']:
                        raise EmailSendError(f"Failed to send email after {attempts} attempts: {str(e)}")
            
        except EmailValidationError as e:
            # Log validation error
            logger.error(f"Email validation error: {str(e)}")
            return {
                'status': 'error',
                'message': f'Email validation error: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
            
        except EmailSendError as e:
            # Log sending error
            logger.error(f"Email send error: {str(e)}")
            return {
                'status': 'error',
                'message': f'Email send error: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            # Log unexpected error
            logger.error(f"Unexpected error sending export to {recipient}: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Failed to send export: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
    
    def _build_email_body(self, message, file_type):
        """
        Build the HTML body for the email.
        
        Args:
            message (str): Custom message from the user
            file_type (str): Type of export file
            
        Returns:
            str: HTML formatted email body
        """
        # Basic HTML template for the email
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4f46e5; color: white; padding: 10px 20px; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .footer {{ font-size: 12px; color: #666; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Caprae Capital Lead Export</h2>
                </div>
                <div class="content">
                    <p>An export file has been shared with you from the Caprae Capital AI Readiness Lead Tool.</p>
                    
                    {f'<p><strong>Message:</strong> {message}</p>' if message else ''}
                    
                    <p>You will find a {file_type.upper()} file attached to this email containing the exported lead data.</p>
                    
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; {datetime.now().year} Caprae Capital Partners. All rights reserved.</p>
                    <p>This email and any attachments are confidential and may be privileged.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html_template
    
    def _create_attachment(self, file_data, file_name, file_type):
        """
        Create an email attachment from file data.
        
        Args:
            file_data (str/bytes): The file content
            file_name (str): The name of the file
            file_type (str): The type of file
            
        Returns:
            MIMEApplication: The email attachment
        """
        # Handle different file types
        if isinstance(file_data, str):
            file_data = file_data.encode('utf-8')
        
        # Create attachment
        attachment = MIMEApplication(file_data)
        
        # Set content-disposition header with filename
        attachment.add_header(
            'Content-Disposition', 
            f'attachment; filename="{file_name}"'
        )
        
        return attachment
    
    def send_notification(self, recipients, subject, message, notification_type='info'):
        """
        Send a notification email to team members.
        
        Args:
            recipients (list): List of recipient email addresses
            subject (str): Email subject line
            message (str): Email message content
            notification_type (str): Type of notification (info, success, warning, error)
            
        Returns:
            dict: Status of the email operation
            
        Raises:
            EmailValidationError: If any email format is invalid
            EmailSendError: If there is an error sending the email
        """
        try:
            # Validate all recipient emails
            invalid_emails = []
            for recipient in recipients:
                try:
                    self.validate_email(recipient)
                except EmailValidationError:
                    invalid_emails.append(recipient)
            
            if invalid_emails:
                raise EmailValidationError(f"Invalid email addresses: {', '.join(invalid_emails)}")
            
            # Log the notification request
            logger.info(f"Sending {notification_type} notification to {len(recipients)} recipients")
            
            # Create notification template based on notification type
            color_map = {
                'info': '#3498db',     # Blue
                'success': '#2ecc71',  # Green
                'warning': '#f39c12',  # Orange
                'error': '#e74c3c'     # Red
            }
            
            notification_color = color_map.get(notification_type.lower(), color_map['info'])
            
            # Create HTML email template
            html_template = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: {notification_color}; color: white; padding: 10px 20px; }}
                    .content {{ padding: 20px; background-color: #f9f9f9; }}
                    .footer {{ font-size: 12px; color: #666; margin-top: 20px; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Caprae Capital Notification</h2>
                    </div>
                    <div class="content">
                        <p><strong>{notification_type.upper()}:</strong> {message}</p>
                    </div>
                    <div class="footer">
                        <p>&copy; {datetime.now().year} Caprae Capital Partners. All rights reserved.</p>
                        <p>This email and any attachments are confidential and may be privileged.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Add notification type prefix to subject
            full_subject = f"{self.settings['default_subject_prefix']}[{notification_type.upper()}] {subject}"
            
            # Connect to SMTP server
            attempts = 0
            while attempts < self.settings['retry_attempts']:
                try:
                    with smtplib.SMTP(self.settings['smtp_server'], 
                                     self.settings['smtp_port'], 
                                     timeout=self.settings['connection_timeout']) as server:
                        # Start TLS for security
                        server.starttls()
                        
                        # Authentication if provided
                        if self.settings['smtp_user'] and self.settings['smtp_password']:
                            server.login(self.settings['smtp_user'], self.settings['smtp_password'])
                        
                        # Loop through recipients and send individual emails
                        for recipient in recipients:
                            # Create message
                            msg = MIMEMultipart()
                            msg['From'] = self.settings['default_sender']
                            msg['To'] = recipient
                            msg['Subject'] = full_subject
                            
                            # Attach HTML body
                            msg.attach(MIMEText(html_template, 'html'))
                            
                            # Send email
                            server.send_message(msg)
                            
                            logger.debug(f"Notification sent to {recipient}")
                        
                        # Log successful sends
                        logger.info(f"Notifications successfully sent to {len(recipients)} recipients")
                        
                        return {
                            'status': 'success',
                            'message': f'Notifications sent to {len(recipients)} recipients',
                            'timestamp': datetime.now().isoformat()
                        }
                
                except (smtplib.SMTPException, gaierror, timeout) as e:
                    attempts += 1
                    logger.warning(f"Notification send attempt {attempts} failed: {str(e)}")
                    if attempts >= self.settings['retry_attempts']:
                        raise EmailSendError(f"Failed to send notifications after {attempts} attempts: {str(e)}")
        
        except EmailValidationError as e:
            # Log validation error
            logger.error(f"Email validation error: {str(e)}")
            return {
                'status': 'error',
                'message': f'Email validation error: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
            
        except EmailSendError as e:
            # Log sending error
            logger.error(f"Email send error: {str(e)}")
            return {
                'status': 'error',
                'message': f'Email send error: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            # Log unexpected error
            logger.error(f"Unexpected error sending notifications: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Failed to send notifications: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }

    def test_connection(self):
        """
        Test the SMTP connection to verify settings.
        
        Returns:
            dict: Status of the connection test
        """
        try:
            logger.info(f"Testing connection to SMTP server {self.settings['smtp_server']}:{self.settings['smtp_port']}")
            
            with smtplib.SMTP(self.settings['smtp_server'], 
                             self.settings['smtp_port'], 
                             timeout=self.settings['connection_timeout']) as server:
                server.starttls()
                if self.settings['smtp_user'] and self.settings['smtp_password']:
                    server.login(self.settings['smtp_user'], self.settings['smtp_password'])
                
                logger.info("SMTP connection test successful")
                return {
                    'status': 'success',
                    'message': 'SMTP connection test successful',
                    'timestamp': datetime.now().isoformat()
                }
        
        except (smtplib.SMTPException, gaierror, timeout) as e:
            logger.error(f"SMTP connection test failed: {str(e)}")
            return {
                'status': 'error',
                'message': f'SMTP connection test failed: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            logger.error(f"Unexpected error testing SMTP connection: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'SMTP connection test failed: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }

# For testing
if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Create email manager
    email_mgr = EmailManager()
    
    # Configure with real settings (for testing)
    # In production, these would come from environment variables or a config file
    email_mgr.configure({
        'smtp_server': 'smtp.gmail.com',  # Example for Gmail
        'smtp_port': 587,
        'smtp_user': 'your-email@gmail.com',
        'smtp_password': 'your-app-password',  # Use app password for Gmail
        'default_sender': 'your-email@gmail.com',
    })
    
    # Test the connection
    connection_test = email_mgr.test_connection()
    print(f"Connection test result: {connection_test}")
    
    # Only proceed with sending test email if connection was successful
    if connection_test['status'] == 'success':
        # Test sending an export
        result = email_mgr.send_export(
            recipient="recipient@example.com",  # Change to a real recipient for testing
            subject="Test Export",
            message="This is a test export",
            file_data="Name,Email\nTest User,test@example.com",
            file_name="test_export.csv",
            file_type="csv"
        )
        
        print(f"Email send result: {result}")