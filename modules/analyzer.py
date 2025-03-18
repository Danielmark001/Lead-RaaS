from bs4 import BeautifulSoup
import re
from nltk.tokenize import word_tokenize
from utils.helpers import clean_text

class ContentAnalyzer:
    def __init__(self):
        # AI and technology readiness indicators (keywords and phrases)
        self.tech_indicators = {
            'ai_ml': ['machine learning', 'artificial intelligence', 'ai', 'ml', 'deep learning', 
                      'neural network', 'computer vision', 'nlp', 'natural language processing'],
            'data': ['data analytics', 'big data', 'data science', 'data lake', 'data warehouse',
                    'business intelligence', 'predictive analytics', 'data-driven'],
            'cloud': ['cloud', 'aws', 'azure', 'google cloud', 'saas', 'iaas', 'paas',
                     'serverless', 'microservices', 'containerization', 'docker', 'kubernetes'],
            'integration': ['api', 'integration', 'webhook', 'rest api', 'graphql', 'middleware',
                           'interoperability', 'connected systems'],
            'automation': ['automation', 'workflow', 'robotic process automation', 'rpa',
                          'business process automation', 'intelligent automation']
        }
        
        # Leadership indicators
        self.leadership_titles = ['CEO', 'CTO', 'Chief Technology', 'Chief Digital', 'Chief Information',
                                 'VP of Engineering', 'VP of Technology', 'Chief Data', 'Head of IT', 
                                 'Director of Technology', 'Chief Innovation', 'Chief AI', 'CIO']
        
        # Growth indicators
        self.growth_phrases = ['growing', 'expansion', 'hiring', 'new office', 'funding', 
                              'venture capital', 'investment', 'series', 'launch', 'scaling',
                              'accelerating', 'growth']
    
    def extract_leadership_team(self, soups):
        """Extract leadership team information from page soups"""
        leadership_team = []
        
        for page_type, soup in soups.items():
            # Priority for team and about pages
            priority = 1 if page_type in ['team', 'leadership', 'about'] else 0
            
            # Look for common team member containers
            team_sections = soup.find_all(['div', 'section'], class_=lambda c: c and any(term in str(c).lower() 
                                                                for term in ['team', 'leadership', 'people', 'staff']))
            
            # If no specific containers found, check the whole page
            if not team_sections and priority:
                team_sections = [soup]
            
            for section in team_sections:
                # Look for name elements
                name_elements = section.find_all(['h2', 'h3', 'h4', 'h5', 'strong'])
                
                for name_elem in name_elements:
                    name_text = name_elem.get_text().strip()
                    # Check if it looks like a name (First Last format)
                    if re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$', name_text):
                        # Try to find title near the name
                        title = "Unknown"
                        
                        # Check next siblings for title
                        next_elems = list(name_elem.next_siblings)[:3]  # Check next 3 elements
                        for elem in next_elems:
                            if hasattr(elem, 'get_text'):
                                text = elem.get_text().strip()
                                if any(title_word in text.lower() for title_word in ['ceo', 'cto', 'chief', 'vp', 'head', 'director']):
                                    title = text
                                    break
                        
                        # If we haven't found a title, look at parent container
                        if title == "Unknown":
                            parent = name_elem.parent
                            if parent:
                                parent_text = parent.get_text().strip()
                                title_match = re.search(r'(?:CEO|CTO|Chief|VP|Head|Director|Manager)[^\n\.]*', parent_text)
                                if title_match:
                                    title = title_match.group(0)
                        
                        # Add to leadership team if not already present
                        if not any(leader['name'] == name_text for leader in leadership_team):
                            leadership_team.append({
                                'name': name_text,
                                'title': title,
                                'priority': priority
                            })
        
        # Sort by priority and return
        return sorted(leadership_team, key=lambda x: x.pop('priority', 0), reverse=True)
    
    def extract_contact_info(self, texts):
        """Extract contact information from texts"""
        contact_info = {
            'emails': [],
            'phones': []
        }
        
        # Email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        
        # Phone pattern - various formats
        phone_pattern = r'\b(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b'
        
        for text in texts.values():
            # Find emails
            emails = re.findall(email_pattern, text)
            contact_info['emails'].extend(emails)
            
            # Find phones
            phones = re.findall(phone_pattern, text)
            contact_info['phones'].extend(phones)
        
        # Remove duplicates
        contact_info['emails'] = list(set(contact_info['emails']))
        contact_info['phones'] = list(set(contact_info['phones']))
        
        return contact_info
    
    def analyze_content(self, pages_content, base_url):
        """Analyze website content for AI readiness indicators"""
        # Convert HTML to soup objects
        soups = {page_type: BeautifulSoup(content, 'html.parser') for page_type, content in pages_content.items()}
        
        # Extract text from each page
        texts = {page_type: clean_text(soup.get_text()) for page_type, soup in soups.items()}
        
        # Combined text for overall analysis
        combined_text = ' '.join(texts.values()).lower()
        
        # Initialize results
        results = {
            'tech_indicators': {},
            'leadership_team': [],
            'contact_info': {},
            'growth_indicators': [],
            'company_size_indicator': 'Unknown',
            'base_url': base_url
        }
        
        # Check for tech indicators
        for category, indicators in self.tech_indicators.items():
            category_count = 0
            category_indicators = {}
            
            for indicator in indicators:
                count = combined_text.count(indicator.lower())
                if count > 0:
                    category_indicators[indicator] = count
                    category_count += count
            
            if category_indicators:
                results['tech_indicators'][category] = {
                    'total': category_count,
                    'indicators': category_indicators
                }
        
        # Extract leadership team
        results['leadership_team'] = self.extract_leadership_team(soups)
        
        # Extract contact information
        results['contact_info'] = self.extract_contact_info(texts)
        
        # Check for growth indicators
        for phrase in self.growth_phrases:
            if phrase in combined_text:
                results['growth_indicators'].append(phrase)
        
        # Estimate company size
        if any(term in combined_text for term in ['fortune 500', 'enterprise', 'global company']):
            results['company_size_indicator'] = 'Large Enterprise'
        elif any(term in combined_text for term in ['mid-size', 'medium business', 'growing company']):
            results['company_size_indicator'] = 'Mid-size Company'
        elif any(term in combined_text for term in ['startup', 'small business', 'small team']):
            results['company_size_indicator'] = 'Small Company/Startup'
        
        return results