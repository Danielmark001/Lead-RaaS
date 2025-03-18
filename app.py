from flask import Flask, request, render_template, jsonify, send_file
import os
import nltk
import json
import csv
import io
import logging

# Import modules
from modules.scraper import WebScraper
from modules.analyzer import ContentAnalyzer
from modules.scorer import AIReadinessScorer
from modules.lead_scorer import LeadScorer

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
            'Pain Points'
        ])
        
        # Extract data for CSV
        crm_data = data.get('sales_insights', {}).get('crm_ready', {})
        outreach = data.get('sales_insights', {}).get('outreach_recommendation', {})
        pain_points = data.get('sales_insights', {}).get('pain_points', [])
        
        company = crm_data.get('company', {})
        contact = crm_data.get('contact', {})
        approach = outreach.get('approach', {})
        
        # Format conversation starters
        conversation_starters = '; '.join(approach.get('conversation_starters', []))
        
        # Format pain points
        pain_points_text = '; '.join(pain_points[:3])  # Include up to 3 pain points
        
        # Write data row
        writer.writerow([
            company.get('name', ''),
            company.get('website', ''),
            company.get('lead_score', ''),
            company.get('lead_tier', ''),
            company.get('ai_readiness_score', ''),
            company.get('size', ''),
            company.get('outreach_timing', ''),
            contact.get('name', ''),
            contact.get('title', ''),
            contact.get('email', ''),
            contact.get('phone', ''),
            approach.get('focus', ''),
            conversation_starters,
            pain_points_text
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
            
        # Create a formatted JSON string
        json_data = json.dumps(data, indent=2)
        
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

@app.errorhandler(404)
def page_not_found(e):
    """Handle 404 errors"""
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(e):
    """Handle 500 errors"""
    logger.error(f"Server error: {str(e)}", exc_info=True)
    return jsonify({"error": "Internal server error"}), 500

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
    
    logger.info("Starting AI-Readiness Lead Generation Tool")
    app.run(debug=True, host='0.0.0.0', port=5000)