from flask import Flask, request, render_template, jsonify
import os
import nltk

# Import modules
from modules.scraper import WebScraper
from modules.analyzer import ContentAnalyzer
from modules.scorer import AIReadinessScorer

# Download necessary NLTK data on startup
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

app = Flask(__name__)

# Initialize components
scraper = WebScraper()
analyzer = ContentAnalyzer()
scorer = AIReadinessScorer()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    url = request.form.get('url')
    if not url:
        return jsonify({"error": "URL is required"})
        
    # Validate URL format
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    try:
        # Step 1: Scrape website
        base_url, pages_content = scraper.scrape_website(url)
        
        if not pages_content:
            return jsonify({"error": "Could not access website or no content found"})
        
        # Step 2: Analyze content
        analysis_results = analyzer.analyze_content(pages_content, base_url)
        
        # Step 3: Calculate AI readiness score
        final_results = scorer.calculate_score(analysis_results)
        
        # Add pages analyzed to results
        final_results['pages_analyzed'] = list(pages_content.keys())
        
        return jsonify(final_results)
    
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"})

if __name__ == '__main__':
    app.run(debug=True)