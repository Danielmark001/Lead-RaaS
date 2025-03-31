import re
import os
import json
from datetime import datetime

# Path to leads data file
LEADS_FILE = os.path.join(os.path.dirname(__file__), 'data', 'leads.json')

def get_leads():
    """Read leads from JSON file"""
    if not os.path.exists(LEADS_FILE):
        return []
    
    try:
        with open(LEADS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading leads: {e}")
        return []

def save_lead(lead_data):
    """Save or update a lead in the leads file"""
    try:
        # Ensure lead has required fields
        required_fields = ['company_name', 'url']
        for field in required_fields:
            if not lead_data.get(field):
                return False, f"Missing required field: {field}"
        
        # Ensure lead has an ID
        if not lead_data.get('id'):
            lead_data['id'] = f"lead_{int(datetime.now().timestamp() * 1000)}"
        
        # Add timestamp if not provided
        if not lead_data.get('date_added'):
            lead_data['date_added'] = datetime.now().isoformat()
        
        # Get existing leads
        leads = get_leads()
        
        # Check if lead already exists
        existing_idx = -1
        for idx, lead in enumerate(leads):
            if lead.get('id') == lead_data.get('id') or lead.get('url') == lead_data.get('url'):
                existing_idx = idx
                break
        
        if existing_idx >= 0:
            # Update existing lead
            leads[existing_idx].update(lead_data)
            leads[existing_idx]['last_updated'] = datetime.now().isoformat()
        else:
            # Add new lead
            leads.append(lead_data)
        
        # Save updated leads
        os.makedirs(os.path.dirname(LEADS_FILE), exist_ok=True)
        with open(LEADS_FILE, 'w') as f:
            json.dump(leads, f, indent=2)
        
        return True, "Lead saved successfully"
    except Exception as e:
        print(f"Error saving lead: {e}")
        return False, f"Error saving lead: {str(e)}"
    
def clean_text(text):
    """Clean and normalize text for analysis"""
    if not text:
        return ""
    
    # Replace newlines, tabs, and excessive spaces with single space
    text = re.sub(r'\s+', ' ', text)
    
    # Remove non-alphanumeric characters except spaces, periods, commas, etc.
    text = re.sub(r'[^\w\s.,;:?!@-]', '', text)
    
    # Trim leading/trailing whitespace
    text = text.strip()
    
    return text

def is_valid_url(url):
    """Simple URL validation"""
    pattern = re.compile(
        r'^(?:http|https)://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ipv4
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    return bool(pattern.match(url))

def format_phone_number(phone):
    """Format phone numbers consistently"""
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # Format based on length
    if len(digits) == 10:  # US number without country code
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits[0] == '1':  # US number with country code
        return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
    else:
        return phone  # Return original if format is unclear
    
