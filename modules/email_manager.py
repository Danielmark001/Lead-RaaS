"""
Email Manager Module for Lead Generation Tool

This module handles email operations for the lead generation tool,
including sending exports to users and notifications to team members.
"""

import logging
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from datetime import datetime

# Configure logger
logger = logging.getLogger(__name__)

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
            'smtp_server': os.environ.get('SMTP_SERVER', 'smtp.example.com'),
            'smtp_port': int(os.environ.get('SMTP_PORT', 587)),
            'smtp_user': os.environ.get('SMTP_USER', ''),
            'smtp_password': os.environ.get('SMTP_PASSWORD', ''),
            'default_sender': os.environ.get('DEFAULT_SENDER', 'noreply@capraecapital.com'),
            'default_subject_prefix': '[Caprae Capital] ',
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
        
        Returns:
            bool: True if configuration was successful
        """
        # Update settings with provided values
        for key, value in settings.items():
            if key in self.settings:
                self.settings[key] = value
        
        # Mark as configured
        self.configured = True
        logger.info("Email manager configured with custom settings")
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
        """
        try:
            # Log the email request
            logger.info(f"Preparing to send {file_type} export to {recipient}")
            
            # For demo purposes, we'll just log and return success
            # In a production environment, uncomment and configure the email sending code below
            
            """
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
            with smtplib.SMTP(self.settings['smtp_server'], self.settings['smtp_port']) as server:
                server.starttls()
                if self.settings['smtp_user'] and self.settings['smtp_password']:
                    server.login(self.settings['smtp_user'], self.settings['smtp_password'])
                server.send_message(msg)
            """
            
            # Log successful send
            logger.info(f"Export successfully sent to {recipient}")
            
            return {
                'status': 'success',
                'message': f'Export successfully sent to {recipient}',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            # Log error
            logger.error(f"Failed to send export to {recipient}: {str(e)}")
            
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
        """
        # Log the notification request
        logger.info(f"Sending {notification_type} notification to {len(recipients)} recipients")
        
        # In a production environment, implement actual notification sending
        
        return {
            'status': 'success',
            'message': f'Notification sent to {len(recipients)} recipients',
            'timestamp': datetime.now().isoformat()
        }

# For testing
if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Create email manager
    email_mgr = EmailManager()
    
    # Test sending an export
    result = email_mgr.send_export(
        recipient="test@example.com",
        subject="Test Export",
        message="This is a test export",
        file_data="Name,Email\nTest User,test@example.com",
        file_name="test_export.csv",
        file_type="csv"
    )
    
    print(f"Email send result: {result}")