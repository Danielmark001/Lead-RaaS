import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
from utils.helpers import clean_text

class WebScraper:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # Pages to prioritize for AI readiness assessment
        self.important_pages = [
            'about', 'team', 'leadership', 'technology', 'platform', 
            'solution', 'product', 'services', 'career', 'contact',
            'digital', 'innovation', 'ai', 'machine-learning', 'data'
        ]
        
    def get_base_url(self, url):
        """Extract the base URL"""
        parsed_uri = urlparse(url)
        base_url = '{uri.scheme}://{uri.netloc}/'.format(uri=parsed_uri)
        return base_url
        
    def extract_page_content(self, url):
        """Get content from a single page"""
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                return response.text
            return None
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None
            
    def find_important_pages(self, base_url, soup):
        """Find links to important pages"""
        important_page_urls = {}
        links = soup.find_all('a', href=True)
        
        for link in links:
            href = link['href']
            if href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:'):
                continue
                
            # Check if the link text contains important keywords
            link_text = link.get_text().strip().lower()
            full_url = urljoin(base_url, href)
            
            for page_type in self.important_pages:
                if page_type in href.lower() or page_type in link_text:
                    important_page_urls[page_type] = full_url
                    break
                    
        return important_page_urls
    
    def scrape_website(self, url):
        """Main method to scrape a company website"""
        base_url = self.get_base_url(url)
        home_content = self.extract_page_content(url)
        
        if not home_content:
            return base_url, {}
            
        soup = BeautifulSoup(home_content, 'html.parser')
        
        # Store content from all pages
        pages_content = {'home': home_content}
        
        # Get important pages
        important_pages = self.find_important_pages(base_url, soup)
        
        # Limit to max 6 additional pages for time efficiency
        page_count = 0
        for page_type, page_url in important_pages.items():
            if page_count >= 6:
                break
                
            # Avoid duplicate URLs
            if page_url in pages_content.values():
                continue
                
            content = self.extract_page_content(page_url)
            if content:
                pages_content[page_type] = content
                page_count += 1
                
            # Be gentle to the server
            time.sleep(0.5)
                
        return base_url, pages_content