  # AI-Readiness Assessment Tool

  A web-based tool that analyzes company websites to assess their AI readiness potential and identify transformation opportunities. Built for Caprae Capital Partners' AI-RaaS (AI Readiness as a Service) offering.

  ## Overview

  This tool helps private equity firms and investment professionals quickly evaluate a company's AI readiness by analyzing their public web presence. It extracts technology indicators, leadership information, and growth signals to provide an overall AI readiness score.

  ## Features

  - **Website Analysis**: Automatically crawls and analyzes company websites
  - **AI Readiness Scoring**: Calculates a 1-10 score based on technology indicators, leadership, and growth potential
  - **Technology Detection**: Identifies AI, data, cloud, and automation technologies
  - **Leadership Assessment**: Extracts information about the company's leadership team
  - **Opportunity Identification**: Suggests potential AI transformation opportunities based on the analysis

  ## Target Market:
1. **Private Equity Firms:**

- AI-Readiness Assessment Tool helps investors identify companies with high potential for AI adoption and transformation, enabling better-informed investment decisions.
2. **Venture Capitalists:**

- The tool supports venture capitalists in finding early-stage companies that are ready to integrate AI technologies, allowing them to target startups with high growth potential.
3. **Corporate Investors:**

- Companies looking to invest in or acquire businesses for digital transformation can leverage this tool to assess the AI readiness of potential targets.
4. **Consulting Firms:**

- Consulting firms focused on digital transformation can use the tool to assist clients in determining their AI readiness and uncover opportunities for improvement.

  ## Installation

  1. Clone this repository
  ```bash
  git clone https://github.com/yourusername/ai-readiness-assessment.git
  cd ai-readiness-assessment
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

  ## Usage

  1. Start the Flask application
  ```bash
  python app.py
  ```

  2. Open your browser and navigate to `http://127.0.0.1:5000/`

  3. Enter a company URL (e.g., company.com) and click "Analyze"

  4. View the AI readiness assessment results

  ## Project Structure

  - `app.py`: Main Flask application file
  - `modules/`: Core functionality modules
    - `scraper.py`: Website scraping functionality
    - `analyzer.py`: Content analysis logic
    - `scorer.py`: AI readiness scoring algorithm
  - `static/`: Static files (CSS, JavaScript)
  - `templates/`: HTML templates
  - `utils/`: Helper functions

  ## Development Notes

  This project was developed as part of the Caprae Capital Partners AI-Readiness Pre-Screening Challenge, with a 5-hour development constraint. It focuses on delivering a high-impact tool that aligns with the business needs of a private equity firm specializing in AI transformation.

  ## Future Enhancements

  - Integration with company databases for additional information
  - Machine learning model to improve scoring accuracy
  - Industry-specific assessment criteria
  - Email validation and enhanced contact discovery
  - CRM integration for lead management

  ## License

  This project is proprietary and confidential.