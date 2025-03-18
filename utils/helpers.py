import re

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