from flask import Flask, request, render_template, jsonify, send_file
import os
import nltk
import json
import csv
import io
import logging
import uuid
from datetime import datetime
import re

# Import modules
from modules.scraper import WebScraper
from modules.analyzer import ContentAnalyzer
from modules.scorer import AIReadinessScorer
from modules.lead_scorer import LeadScorer
from modules.crm_integration import CRMIntegrationManager
from modules.email_manager import EmailManager  

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Download necessary NLTK data on startup
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

app = Flask(__name__)

# Initialize components
scraper = WebScraper()
analyzer = ContentAnalyzer()
ai_scorer = AIReadinessScorer()
lead_scorer = LeadScorer()
crm_manager = CRMIntegrationManager()
email_manager = EmailManager()  # New component for email functionality

# In-memory data store for leads (in a production app, this would be a database)
# For demo purposes, we'll use a simple dictionary to store leads
leads_store = {}


@app.route('/')
def home():
    """Render the main application page"""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze a company website for AI readiness and lead potential"""
    url = request.form.get('url')
    if not url:
        return jsonify({"error": "URL is required"})
    
    logger.info(f"Starting analysis for URL: {url}")
    
    # Validate URL format
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    try:
        # Step 1: Scrape website
        logger.info("Scraping website content")
        base_url, pages_content = scraper.scrape_website(url)
        
        if not pages_content:
            logger.warning(f"No content found for URL: {url}")
            return jsonify({"error": "Could not access website or no content found"})
        
        # Step 2: Analyze content
        logger.info("Analyzing website content")
        analysis_results = analyzer.analyze_content(pages_content, base_url)
        
        # Step 3: Calculate AI readiness score
        logger.info("Calculating AI readiness score")
        ai_results = ai_scorer.calculate_score(analysis_results)
        
        # Step 4: Calculate lead score and sales insights
        logger.info("Generating lead qualification insights")
        sales_insights = lead_scorer.calculate_lead_score(
            analysis_results, 
            ai_results['ai_readiness_score']
        )
        
        # Combine results
        final_results = {**ai_results}
        final_results['sales_insights'] = sales_insights
        
        # Add pages analyzed to results
        final_results['pages_analyzed'] = list(pages_content.keys())
        
        # Extract company name from URL
        company_name = extract_company_name(url)
        final_results['company_name'] = company_name
        
        # Add URL to results
        final_results['url'] = url
        
        # Generate a unique ID for this analysis
        analysis_id = f"lead_{int(datetime.now().timestamp())}"
        final_results['id'] = analysis_id
        
        # Add verification status (initially pending)
        final_results['verification'] = {
            'status': 'Pending',
            'date': datetime.now().isoformat(),
            'notes': '',
            'verified_by': 'System'
        }
        
        # Add CRM status (initially not synced)
        final_results['crm'] = {
            'status': 'Not Synced',
            'date': None,
            'crm_id': None
        }
        
        # Store lead in memory
        leads_store[analysis_id] = final_results
        
        logger.info(f"Analysis completed successfully for URL: {url}")
        return jsonify(final_results)
    
    except Exception as e:
        logger.error(f"Analysis failed for URL {url}: {str(e)}", exc_info=True)
        return jsonify({"error": f"Analysis failed: {str(e)}"})

@app.route('/export-csv', methods=['POST'])
def export_csv():
    """Export analysis results as a CSV file for CRM import"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided for export"})
        
        logger.info("Exporting data as CSV")
        
        # Check if this is a single lead or multiple leads
        leads_data = []
        if isinstance(data, list):
            leads_data = data
        else:
            leads_data = [data]
            
        # Create a string buffer to write CSV data
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        
        # Write headers
        writer.writerow([
            'Company Name', 
            'Website', 
            'Lead Score', 
            'Lead Tier',
            'AI Readiness Score',
            'Company Size',
            'Outreach Timing',
            'Contact Name',
            'Contact Title',
            'Contact Email',
            'Contact Phone',
            'Recommended Approach',
            'Conversation Starters',
            'Pain Points',
            'Verification Status',
            'Verification Date',
            'CRM Status'
        ])
        
        # Write data rows
        for lead in leads_data:
            # Extract data for CSV
            crm_data = lead.get('sales_insights', {}).get('crm_ready', {})
            outreach = lead.get('sales_insights', {}).get('outreach_recommendation', {})
            pain_points = lead.get('sales_insights', {}).get('pain_points', [])
            verification = lead.get('verification', {})
            crm_status = lead.get('crm', {})
            
            company = crm_data.get('company', {})
            contact = crm_data.get('contact', {})
            approach = outreach.get('approach', {})
            
            # Format conversation starters
            conversation_starters = '; '.join(approach.get('conversation_starters', []))
            
            # Format pain points
            pain_points_text = '; '.join(pain_points[:3])  # Include up to 3 pain points
            
            # Write data row
            writer.writerow([
                lead.get('company_name', company.get('name', '')),
                lead.get('url', company.get('website', '')),
                lead.get('sales_insights', {}).get('lead_score', company.get('lead_score', '')),
                lead.get('sales_insights', {}).get('lead_tier', company.get('lead_tier', '')),
                lead.get('ai_readiness_score', company.get('ai_readiness_score', '')),
                lead.get('company_size_indicator', company.get('size', '')),
                outreach.get('timing', company.get('outreach_timing', '')),
                (contact.get('name', '')),
                (contact.get('title', '')),
                (contact.get('email', '')),
                (contact.get('phone', '')),
                approach.get('focus', ''),
                conversation_starters,
                pain_points_text,
                verification.get('status', 'Pending'),
                verification.get('date', ''),
                crm_status.get('status', 'Not Synced')
            ])
        
        # Create response
        csv_buffer.seek(0)
        return send_file(
            io.BytesIO(csv_buffer.getvalue().encode()),
            mimetype='text/csv',
            as_attachment=True,
            download_name='lead_data.csv'
        )
        
    except Exception as e:
        logger.error(f"CSV export failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Export failed: {str(e)}"})

@app.route('/export-json', methods=['POST'])
def export_json():
    """Export analysis results as a JSON file for system integration"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided for export"})
            
        logger.info("Exporting data as JSON")
        
        # Check field selection if provided
        field_selection = data.get('field_selection', None)
        export_data = data.get('leads', data)
        
        # If field selection is provided, filter the data
        if field_selection:
            if isinstance(export_data, list):
                export_data = [filter_lead_data(lead, field_selection) for lead in export_data]
            else:
                export_data = filter_lead_data(export_data, field_selection)
            
        # Create a formatted JSON string
        json_data = json.dumps(export_data, indent=2)
        
        # Create response
        return send_file(
            io.BytesIO(json_data.encode()),
            mimetype='application/json',
            as_attachment=True,
            download_name='lead_analysis.json'
        )
        
    except Exception as e:
        logger.error(f"JSON export failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Export failed: {str(e)}"})

@app.route('/verify-lead', methods=['POST'])
def verify_lead():
    """Verify a lead and update its verification status"""
    try:
        # Get lead data from request
        data = request.json
        
        if not data or 'id' not in data:
            return jsonify({"error": "Invalid lead data"}), 400
        
        lead_id = data['id']
        
        # Check if lead exists in store
        if lead_id not in leads_store:
            return jsonify({"error": f"Lead with ID {lead_id} not found"}), 404
        
        # Extract verification details
        verification = {
            'status': data.get('status', 'Verified'),
            'date': datetime.now().isoformat(),
            'notes': data.get('notes', ''),
            'verified_by': data.get('verified_by', 'User')
        }
        
        # Update lead verification status
        leads_store[lead_id]['verification'] = verification
        
        return jsonify({
            'status': 'success',
            'message': 'Lead verification updated successfully',
            'verification': verification
        })
        
    except Exception as e:
        logger.error(f"Lead verification failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Verification failed: {str(e)}"}), 500

@app.route('/crm-sync', methods=['POST'])
def crm_sync():
    """Sync leads to CRM system"""
    try:
        # Get lead data and CRM settings from request
        data = request.json
        lead_ids = data.get('lead_ids', [])
        settings = data.get('settings', {})
        
        if not lead_ids:
            return jsonify({"error": "No leads provided for sync"}), 400
            
        # Retrieve leads from store
        leads_to_sync = []
        for lead_id in lead_ids:
            if lead_id in leads_store:
                leads_to_sync.append(leads_store[lead_id])
        
        if not leads_to_sync:
            return jsonify({"error": "None of the provided lead IDs were found"}), 404
        
        # Call CRM manager to sync leads
        sync_results = []
        
        for lead in leads_to_sync:
            try:
                # Enrich lead profile
                enriched_profile = crm_manager.enrich_lead_profile(lead)
                
                # Export to CRM
                export_result = crm_manager.export_lead(enriched_profile, settings)
                
                # Update lead CRM status
                lead_id = lead['id']
                leads_store[lead_id]['crm'] = {
                    'status': 'Synced',
                    'date': datetime.now().isoformat(),
                    'crm_id': export_result.get('crm_id', None)
                }
                
                sync_results.append({
                    'id': lead_id,
                    'status': 'success',
                    'message': 'Successfully synced to CRM',
                    'crm_id': export_result.get('crm_id', None)
                })
                
            except Exception as e:
                logger.error(f"CRM sync failed for lead {lead.get('id')}: {str(e)}")
                sync_results.append({
                    'id': lead.get('id'),
                    'status': 'error',
                    'message': str(e)
                })
        
        return jsonify({
            'status': 'success',
            'message': f'Successfully processed {len(sync_results)} lead sync requests',
            'results': sync_results
        })
        
    except Exception as e:
        logger.error(f"CRM sync failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"CRM sync failed: {str(e)}"}), 500

@app.route('/test-crm-connection', methods=['POST'])
def test_crm_connection():
    """Test connection to CRM system"""
    try:
        # Get CRM settings from request
        settings = request.json
        
        if not settings:
            return jsonify({"error": "No CRM settings provided"}), 400
            
        # Required fields
        if 'provider' not in settings or 'apiKey' not in settings:
            return jsonify({"error": "CRM provider and API key are required"}), 400
            
        # Test connection to CRM
        connection_result = crm_manager.test_connection(settings)
        
        if connection_result.get('status') == 'success':
            return jsonify({
                'status': 'success',
                'message': connection_result.get('message', 'CRM connection successful')
            })
        else:
            return jsonify({
                'status': 'error',
                'message': connection_result.get('message', 'CRM connection failed')
            }), 400
        
    except Exception as e:
        logger.error(f"CRM connection test failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"CRM connection test failed: {str(e)}"}), 500

@app.route('/export-pdf', methods=['POST'])
def export_pdf():
    """Export analysis results as a PDF file"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided for export"}), 400
            
        logger.info("Exporting data as PDF")
        
        # NOTE: For a complete implementation, you would use a PDF generation library
        # like reportlab, WeasyPrint, or pdfkit. This is a simplified version.
            
        # For this demo, we'll return a placeholder response
        return jsonify({
            "status": "error",
            "message": "PDF export is not fully implemented in this demo version"
        }), 501
        
    except Exception as e:
        logger.error(f"PDF export failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"PDF export failed: {str(e)}"}), 500

@app.route('/export-xlsx', methods=['POST'])
def export_xlsx():
    """Export analysis results as an Excel file"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided for export"}), 400
            
        logger.info("Exporting data as Excel")
        
        # NOTE: For a complete implementation, you would use an Excel library
        # like openpyxl or xlsxwriter. This is a simplified version.
            
        # For this demo, we'll return a placeholder response
        return jsonify({
            "status": "error",
            "message": "Excel export is not fully implemented in this demo version"
        }), 501
        
    except Exception as e:
        logger.error(f"Excel export failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Excel export failed: {str(e)}"}), 500

@app.route('/email-export', methods=['POST'])
def email_export():
    """Email export files to recipients"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided for email"}), 400
            
        # Extract email details
        recipient = data.get('recipient')
        subject = data.get('subject')
        message = data.get('message')
        format = data.get('format', 'csv')
        leads = data.get('leads', [])
        
        if not recipient:
            return jsonify({"error": "Recipient email is required"}), 400
            
        if not leads:
            return jsonify({"error": "No leads provided for email export"}), 400
        
        # Generate export file based on format
        export_file = None
        if format == 'csv':
            export_file = generate_csv_export(leads)
        elif format == 'json':
            export_file = generate_json_export(leads)
        elif format == 'pdf':
            # Would implement PDF generation here
            return jsonify({"error": "PDF export not fully implemented"}), 501
        elif format == 'xlsx':
            # Would implement Excel generation here
            return jsonify({"error": "Excel export not fully implemented"}), 501
        else:
            return jsonify({"error": f"Unsupported export format: {format}"}), 400
            
        # Send email
        email_result = email_manager.send_export(
            recipient=recipient,
            subject=subject,
            message=message,
            file_data=export_file,
            file_name=f"lead_export.{format}",
            file_type=format
        )
        
        if email_result.get('status') == 'success':
            return jsonify({
                'status': 'success',
                'message': f'Export successfully sent to {recipient}'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': email_result.get('message', 'Email send failed')
            }), 500
            
    except Exception as e:
        logger.error(f"Email export failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Email export failed: {str(e)}"}), 500

@app.route('/get-leads', methods=['GET'])
def get_leads():
    """Get all stored leads"""
    try:
        # In a real implementation, you would filter by user
        # and implement pagination
        return jsonify({
            'status': 'success',
            'leads': list(leads_store.values())
        })
    except Exception as e:
        logger.error(f"Get leads failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to retrieve leads: {str(e)}"}), 500

@app.route('/delete-lead', methods=['POST'])
def delete_lead():
    """Delete a lead from storage"""
    try:
        data = request.json
        if not data or 'id' not in data:
            return jsonify({"error": "Lead ID is required"}), 400
            
        lead_id = data['id']
        
        if lead_id not in leads_store:
            return jsonify({"error": f"Lead with ID {lead_id} not found"}), 404
            
        # Remove lead from store
        leads_store.pop(lead_id)
        
        return jsonify({
            'status': 'success',
            'message': f'Lead {lead_id} successfully deleted'
        })
    except Exception as e:
        logger.error(f"Delete lead failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to delete lead: {str(e)}"}), 500

@app.route('/save-lead', methods=['POST'])
def save_lead():
    """Save a lead to storage"""
    try:
        lead_data = request.json
        if not lead_data:
            return jsonify({"error": "No lead data provided"}), 400
            
        # Generate ID if not present
        if 'id' not in lead_data:
            lead_data['id'] = f"lead_{int(datetime.now().timestamp())}"
            
        lead_id = lead_data['id']
        
        # Add to lead store
        leads_store[lead_id] = lead_data
        
        return jsonify({
            'status': 'success',
            'message': f'Lead saved successfully',
            'id': lead_id
        })
    except Exception as e:
        logger.error(f"Save lead failed: {str(e)}", exc_info=True)
        return jsonify({"error": f"Failed to save lead: {str(e)}"}), 500

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors"""
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    logger.error(f"Server error: {str(e)}", exc_info=True)
    return jsonify({"error": "Internal server error"}), 500

# Helper functions
def extract_company_name(url):
    """Extract company name from URL"""
    # Remove protocol and www
    clean_url = re.sub(r'^https?://(www\.)?', '', url)
    # Get domain part
    domain = clean_url.split('/')[0]
    # Remove TLD and get company name
    parts = domain.split('.')
    if len(parts) >= 2:
        return parts[-2].capitalize()
    return domain.capitalize()

def filter_lead_data(lead, field_selection):
    """Filter lead data based on field selection"""
    filtered_lead = {}
    
    # Company information
    if any(field_selection.get('company', {}).values()):
        filtered_lead['company'] = {}
        if field_selection.get('company', {}).get('name'):
            filtered_lead['company']['name'] = lead.get('company_name', '')
        if field_selection.get('company', {}).get('website'):
            filtered_lead['company']['website'] = lead.get('url', '')
        if field_selection.get('company', {}).get('size'):
            filtered_lead['company']['size'] = lead.get('company_size_indicator', '')
    
    # Contact information
    if any(field_selection.get('contact', {}).values()) and lead.get('sales_insights', {}).get('primary_contact'):
        filtered_lead['contact'] = {}
        contact = lead.get('sales_insights', {}).get('primary_contact', {})
        if field_selection.get('contact', {}).get('name'):
            filtered_lead['contact']['name'] = contact.get('name', '')
        if field_selection.get('contact', {}).get('title'):
            filtered_lead['contact']['title'] = contact.get('title', '')
        if field_selection.get('contact', {}).get('email'):
            filtered_lead['contact']['email'] = contact.get('email', '')
        if field_selection.get('contact', {}).get('phone'):
            filtered_lead['contact']['phone'] = contact.get('phone', '')
    
    # Assessment data
    if any(field_selection.get('assessment', {}).values()):
        filtered_lead['assessment'] = {}
        if field_selection.get('assessment', {}).get('aiScore'):
            filtered_lead['assessment']['aiReadinessScore'] = lead.get('ai_readiness_score', 0)
        if field_selection.get('assessment', {}).get('leadScore'):
            filtered_lead['assessment']['leadScore'] = lead.get('sales_insights', {}).get('lead_score', 0)
        if field_selection.get('assessment', {}).get('leadTier'):
            filtered_lead['assessment']['leadTier'] = lead.get('sales_insights', {}).get('lead_tier', '')
        if field_selection.get('assessment', {}).get('painPoints'):
            filtered_lead['assessment']['painPoints'] = lead.get('sales_insights', {}).get('pain_points', [])
    
    # Verification data
    if any(field_selection.get('verification', {}).values()) and lead.get('verification'):
        filtered_lead['verification'] = {}
        verification = lead.get('verification', {})
        if field_selection.get('verification', {}).get('status'):
            filtered_lead['verification']['status'] = verification.get('status', '')
        if field_selection.get('verification', {}).get('date'):
            filtered_lead['verification']['date'] = verification.get('date', '')
        if field_selection.get('verification', {}).get('notes'):
            filtered_lead['verification']['notes'] = verification.get('notes', '')
    
    return filtered_lead

def generate_csv_export(leads):
    """Generate CSV export for email attachment"""
    # Create a string buffer to write CSV data
    csv_buffer = io.StringIO()
    writer = csv.writer(csv_buffer)
    
    # Write headers
    writer.writerow([
        'Company Name', 
        'Website', 
        'Lead Score', 
        'Lead Tier',
        'AI Readiness Score',
        'Company Size',
        'Contact Name',
        'Contact Title',
        'Verification Status'
    ])
    
    # Write data rows
    for lead in leads:
        writer.writerow([
            lead.get('company_name', ''),
            lead.get('url', ''),
            lead.get('sales_insights', {}).get('lead_score', ''),
            lead.get('sales_insights', {}).get('lead_tier', ''),
            lead.get('ai_readiness_score', ''),
            lead.get('company_size_indicator', ''),
            lead.get('sales_insights', {}).get('primary_contact', {}).get('name', ''),
            lead.get('sales_insights', {}).get('primary_contact', {}).get('title', ''),
            lead.get('verification', {}).get('status', 'Pending')
        ])
    
    csv_buffer.seek(0)
    return csv_buffer.getvalue()

def generate_json_export(leads):
    """Generate JSON export for email attachment"""
    return json.dumps(leads, indent=2)

# Mock email manager class - would be in separate module
# Configure email manager with SMTP settings from environment variables
email_manager.configure({
    'smtp_server': os.environ.get('SMTP_SERVER', 'smtp.gmail.com'),
    'smtp_port': int(os.environ.get('SMTP_PORT', 587)),
    'smtp_user': os.environ.get('SMTP_USER', 'leadgen12344@gmail.com'),
    'smtp_password': os.environ.get('SMTP_PASSWORD', 'dvjyrfoziaojyorz'),
    'default_sender': os.environ.get('DEFAULT_SENDER', 'leadgen12344@gmail.com'),
    'default_subject_prefix': os.environ.get('EMAIL_SUBJECT_PREFIX', '[Caprae Capital] '),
})

# Test connection if SMTP credentials are provided
if os.environ.get('SMTP_USER') and os.environ.get('SMTP_PASSWORD'):
    connection_test = email_manager.test_connection()
    if connection_test['status'] == 'success':
        logger.info("Email system successfully configured")
    else:
        logger.warning(f"Email system configuration issue: {connection_test['message']}")

if __name__ == '__main__':
    # Ensure the necessary directories exist
    os.makedirs('logs', exist_ok=True)
    
    # Set up file handler for logging
    file_handler = logging.FileHandler('logs/app.log')
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))
    logger.addHandler(file_handler)
    
    logger.info("Starting Enhanced AI-Readiness Lead Generation Tool")
    app.run(debug=True, host='0.0.0.0', port=5000)