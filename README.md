# AI-Readiness Assessment Tool
A web-based tool that analyzes company websites to assess their AI readiness potential and identify transformation opportunities. Built for Caprae Capital Partners' AI-RaaS (AI Readiness as a Service) offering.

## Overview
This tool helps private equity firms and investment professionals quickly evaluate a company's AI readiness by analyzing their public web presence. It extracts technology indicators, leadership information, and growth signals to provide an overall AI readiness score, now with enhanced features for security, contact management, and lead qualification.


https://github.com/user-attachments/assets/d0e5f553-1e3c-4b74-a571-a058f9306c91


## Installation
1. Clone this repository
```bash
git clone https://github.com/yourusername/caprae-ai-readiness.git
cd caprae-ai-readiness
```

2. Create a virtual environment and install dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
pip install -r requirements.txt
```

3. Download NLTK data (required for text analysis)
```bash
python -c "import nltk; nltk.download('punkt')"
```
## Setting Up Gmail for Application Use

The most straightforward email provider to use is Gmail. Follow these steps to set up a Gmail account for use with the Lead Generation Tool:

### Step 1: Create or Select a Gmail Account

You can either:
- Use an existing Gmail account (personal or work)
- Create a new Gmail account specifically for sending lead generation emails (recommended)

### Step 2: Enable 2-Step Verification

Google requires 2-Step Verification to be enabled before you can create app passwords:

1. Sign in to your Google Account at [myaccount.google.com](https://myaccount.google.com/)
2. In the navigation panel, select **Security**
3. Under "Signing in to Google," select **2-Step Verification**
4. Follow the on-screen steps to turn on 2-Step Verification

### Step 3: Generate an App Password

App passwords are special 16-character codes that allow applications to access your Gmail account:

1. Go to your Google Account again
2. Select **Security** in the navigation panel
3. Under "Signing in to Google," select **App passwords**
   - Note: This option only appears if 2-Step Verification is enabled
4. At the bottom, select **Select app** and choose **Mail**
5. For "Select device," choose **Other (Custom name)** and enter "Lead Generation Tool"
6. Click **Generate**
7. Copy the 16-character app password (it will look like: "hgdk eegt jvrw xyzp")
8. **Important**: For use in the application, remove all spaces from this password

## Configuring the Application

There are two ways to customize email settings in the Lead Generation Tool:

### Option 1: Using Environment Variables (Recommended)

Set the following environment variables before starting the application:

```bash
# Required settings
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your.email@gmail.com"
export SMTP_PASSWORD="yourapppasswordwithoutspaces"

# Optional customization
export DEFAULT_SENDER="Your Name <your.email@gmail.com>"
export EMAIL_SUBJECT_PREFIX="[Your Company] "
```

#### For Windows Users:

```cmd
set SMTP_SERVER=smtp.gmail.com
set SMTP_PORT=587
set SMTP_USER=your.email@gmail.com
set SMTP_PASSWORD=yourapppasswordwithoutspaces
set DEFAULT_SENDER=Your Name <your.email@gmail.com>
set EMAIL_SUBJECT_PREFIX=[Your Company] 
```

### Option 2: Modifying the Code Directly

If you prefer, you can modify the application code to include your settings:

1. Open `app.py` in your editor
2. Find the section where the email manager is configured (usually after it's initialized)
3. Update the configuration with your own settings:

```python
# Configure email manager with your settings
email_mgr.configure({
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'smtp_user': 'your.email@gmail.com',
    'smtp_password': 'yourapppasswordwithoutspaces',
    'default_sender': 'Your Name <your.email@gmail.com>',
    'default_subject_prefix': '[Your Company] ',
})
```

## Using Other Email Providers

While Gmail is recommended for simplicity, you can use other email providers:

### Microsoft 365 / Outlook
```
SMTP_SERVER=smtp.office365.com
SMTP_PORT=587
```

## Features
- **Website Analysis**: Automatically crawls and analyzes company websites
- **AI Readiness Scoring**: Calculates a 1-10 score based on technology indicators, leadership, and growth potential
- **Technology Detection**: Identifies AI, data, cloud, and automation technologies
- **Leadership Assessment**: Extracts information about the company's leadership team
- **Opportunity Identification**: Suggests potential AI transformation opportunities based on the analysis
- **Advanced Security**: Integrated multi-factor CAPTCHA system to prevent automated scraping and ensure secure access
- **Email Management**: Comprehensive email validation and enrichment module
- **Lead Validation**: Sophisticated lead scoring and qualification system

## Enhanced Feature Details

### CAPTCHA Integration
- **Multi-Layer Security**: Implements advanced CAPTCHA technologies to:
  - Prevent automated scraping and bot attacks
  - Protect sensitive analysis data
  - Ensure genuine user interactions
- **Adaptive Challenge Mechanisms**: 
  - Dynamic difficulty adjustment based on user behavior
  - Multiple challenge types (image recognition, audio challenges, interactive puzzles)
  - Machine learning-powered bot detection
- **Compliance**: Adheres to WCAG accessibility guidelines for inclusive user experience

### Email Manager Module
- **Email Validation Capabilities**:
  - Real-time email syntax and domain verification
  - MX record checking
  - Disposable email detection
  - Catch-all email identification
- **Email Enrichment**:
  - Connects to professional databases to supplement contact information
  - Extracts additional professional details from verified email domains
  - Identifies corporate email vs. personal email accounts
- **Data Privacy**:
  - GDPR and CCPA compliant email handling
  - Secure data storage and processing
  - Optional data anonymization features

### Lead Validation System
- **Comprehensive Lead Scoring**:
  - Multi-dimensional scoring algorithm
  - Factors include:
    * Website technology indicators
    * Leadership profile strength
    * AI readiness score
    * Company size and industry
    * Digital transformation signals
- **Qualification Workflow**:
  - Automated lead categorization
  - Prioritization based on AI transformation potential
  - Integration-ready lead management formats
- **Intelligence Gathering**:
  - Cross-references multiple data sources
  - Generates detailed lead profiles
  - Provides investment readiness recommendations

## Target Market
1. **Private Equity Firms:**
- AI-Readiness Assessment Tool helps investors identify companies with high potential for AI adoption and transformation, enabling better-informed investment decisions.
2. **Venture Capitalists:**
- The tool supports venture capitalists in finding early-stage companies that are ready to integrate AI technologies, allowing them to target startups with high growth potential.
3. **Corporate Investors:**
- Companies looking to invest in or acquire businesses for digital transformation can leverage this tool to assess the AI readiness of potential targets.
4. **Consulting Firms:**
- Consulting firms focused on digital transformation can use the tool to assist clients in determining their AI readiness and uncover opportunities for improvement.

## Project Structure
- `app.py`: Main Flask application file
- `modules/`: Core functionality modules
    - `scraper.py`: Website scraping functionality
    - `analyzer.py`: Content analysis logic
    - `scorer.py`: AI readiness scoring algorithm
    - `captcha.py`: CAPTCHA management module
    - `email_validator.py`: Email validation and enrichment
    - `lead_scoring.py`: Lead qualification system
- `static/`: Static files (CSS, JavaScript)
- `templates/`: HTML templates
- `utils/`: Helper functions

## Development Notes
This project was developed as part of the Caprae Capital Partners AI-Readiness Pre-Screening Challenge, with a 5-hour development constraint. The recent enhancements focus on adding robust security, comprehensive contact management, and intelligent lead validation capabilities.

## Future Enhancements
- Advanced machine learning models for more nuanced scoring
- Expanded industry-specific assessment criteria
- Enhanced CRM integration capabilities
- Real-time AI technology trend tracking
- Global market expansion features

## License
This project is proprietary and confidential. All rights reserved by Caprae Capital Partners.

## Security and Compliance
- GDPR compliant data handling
- Advanced encryption for sensitive information
- Regular security audits and penetration testing
- Continuous monitoring and threat detection
