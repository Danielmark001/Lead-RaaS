"""
Lead scoring and qualification module for the AI-Readiness Assessment Tool.
This module adds sales-focused lead qualification capabilities on top of the AI readiness assessment.
"""

class LeadScorer:
    def __init__(self):
        # Decision maker role weights - higher weight for more influential roles
        self.role_weights = {
            'ceo': 10,
            'cto': 9,
            'chief technology': 9,
            'chief digital': 8,
            'chief information': 8,
            'vp': 7,
            'director': 6,
            'head': 6,
            'manager': 4,
            'lead': 3
        }
        
        # Technology investment signals
        self.tech_categories = {
            'ai_ml': 5,       # AI/ML tech is highest priority
            'data': 4,        # Data infrastructure is very important
            'cloud': 3,       # Cloud adoption shows technical maturity
            'integration': 2, # Integration capabilities matter
            'automation': 3   # Automation shows process maturity
        }
        
        # Pain point keywords that indicate sales opportunities
        self.pain_point_indicators = [
            'challenge', 'improve', 'increase', 'reduce', 'optimize', 
            'streamline', 'efficiency', 'productivity', 'cost', 'revenue',
            'growth', 'scale', 'transform', 'innovate', 'modernize',
            'legacy', 'manual', 'slow', 'complex', 'difficult'
        ]
        
        # Company size impact on sales approach (multipliers)
        self.company_size_factors = {
            'Small Company/Startup': 1.2,      # Startups may be more agile but have smaller budgets
            'Mid-size Company': 1.5,           # Sweet spot for Caprae's solutions
            'Large Enterprise': 1.0            # Larger deal potential but longer sales cycles
        }
        
        # Growth signals impact on timing
        self.growth_indicators_value = {
            'hiring': 2,
            'expansion': 3,
            'funding': 4,
            'growing': 2,
            'scaling': 3,
            'investment': 3,
            'launch': 2,
            'new office': 2,
            'venture capital': 3,
            'series': 3
        }
    
    def calculate_decision_maker_score(self, leadership_team):
        """
        Calculate a score based on the presence of decision makers in the leadership team.
        
        Args:
            leadership_team (list): List of dictionaries containing leadership information
            
        Returns:
            tuple: (score, primary_contact)
        """
        if not leadership_team:
            return 0, None
        
        score = 0
        primary_contact = None
        max_role_score = 0
        
        for person in leadership_team:
            title = person['title'].lower()
            
            # Calculate role score based on title keywords
            role_score = 0
            for role, weight in self.role_weights.items():
                if role in title:
                    role_score = max(role_score, weight)
            
            # Keep track of the highest-ranking person as primary contact
            if role_score > max_role_score:
                max_role_score = role_score
                primary_contact = person
            
            # Add to overall score
            score += role_score
        
        # Normalize score to a 0-10 scale
        normalized_score = min(10, score / max(1, len(leadership_team)))
        
        return normalized_score, primary_contact
    
    def calculate_tech_investment_score(self, tech_indicators):
        """
        Calculate a score based on technology investments evident from the website.
        
        Args:
            tech_indicators (dict): Dictionary of technology indicators by category
            
        Returns:
            float: Score representing technology investment level
        """
        if not tech_indicators:
            return 0
        
        score = 0
        category_count = 0
        
        for category, data in tech_indicators.items():
            if category in self.tech_categories:
                # Weighted score based on category importance
                category_weight = self.tech_categories.get(category, 1)
                # Adjust for diminishing returns with log scaling
                import math
                category_score = category_weight * math.log(1 + data['total'])
                score += category_score
                category_count += 1
        
        # Bonus for diverse technology adoption
        diversity_bonus = min(3, category_count)
        score += diversity_bonus
        
        # Normalize to 0-10 scale
        normalized_score = min(10, score / 2)
        
        return normalized_score
    
    def extract_pain_points(self, text):
        """
        Extract potential pain points from website text.
        
        Args:
            text (str): Combined text content from the website
            
        Returns:
            list: Extracted pain points with context
        """
        if not text:
            return []
        
        pain_points = []
        text_lower = text.lower()
        sentences = text.split('.')
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Check if sentence contains pain point indicators
            if any(indicator in sentence.lower() for indicator in self.pain_point_indicators):
                # Don't add duplicate sentences
                if sentence not in pain_points and len(sentence.split()) > 5:
                    pain_points.append(sentence)
        
        # Limit to top 5 most relevant pain points
        return pain_points[:5]
    
    def calculate_growth_score(self, growth_indicators, company_size):
        """
        Calculate a score based on growth indicators.
        
        Args:
            growth_indicators (list): List of growth signal keywords found
            company_size (str): Company size indicator
            
        Returns:
            tuple: (score, suggested_timing)
        """
        if not growth_indicators:
            return 0, "Standard"
        
        score = 0
        
        # Calculate raw score based on growth indicators
        for indicator in growth_indicators:
            score += self.growth_indicators_value.get(indicator, 1)
        
        # Apply company size factor
        size_factor = self.company_size_factors.get(company_size, 1.0)
        score = score * size_factor
        
        # Determine suggested timing based on score
        if score > 10:
            timing = "Immediate"
        elif score > 5:
            timing = "Near-term"
        else:
            timing = "Medium-term"
        
        # Normalize to 0-10 scale
        normalized_score = min(10, score / 2)
        
        return normalized_score, timing
    
    def determine_outreach_approach(self, readiness_score, pain_points):
        """
        Determine the best sales outreach approach based on AI readiness and pain points.
        
        Args:
            readiness_score (float): AI readiness score
            pain_points (list): Extracted pain points
            
        Returns:
            dict: Recommended outreach approach
        """
        approach = {}
        
        # Determine messaging focus based on readiness score
        if readiness_score <= 3:
            approach["focus"] = "Educational"
            approach["message"] = "Introduce AI readiness concepts and assessment services"
        elif readiness_score <= 6:
            approach["focus"] = "Consultative"
            approach["message"] = "Discuss specific AI transformation opportunities"
        else:
            approach["focus"] = "Partnership"
            approach["message"] = "Explore advanced AI implementation and optimization"
        
        # Add conversation starters based on pain points
        if pain_points:
            approach["conversation_starters"] = pain_points[:2]
        else:
            approach["conversation_starters"] = ["Discuss industry AI adoption trends",
                                              "Explore potential efficiency gains"]
        
        return approach
    
    def calculate_lead_score(self, analysis_results, ai_readiness_score):
        """
        Calculate overall lead score and generate sales-focused insights.
        
        Args:
            analysis_results (dict): Results from website analysis
            ai_readiness_score (float): AI readiness score
            
        Returns:
            dict: Lead scoring and sales insights
        """
        # Extract required data
        leadership_team = analysis_results.get('leadership_team', [])
        tech_indicators = analysis_results.get('tech_indicators', {})
        growth_indicators = analysis_results.get('growth_indicators', [])
        company_size = analysis_results.get('company_size_indicator', 'Unknown')
        
        # Get text content for pain point extraction
        # In a real implementation, this would come from the website content
        # Here we'll synthesize from available data
        text_content = ' '.join([
            f"Company size: {company_size}",
            f"Growth indicators: {', '.join(growth_indicators)}",
            # Add some fabricated content for demonstration
            "Our company is focused on improving efficiency and reducing costs.",
            "We're challenged by legacy systems and manual processes.",
            "Our team is committed to innovation and transformation."
        ])
        
        # Calculate component scores
        decision_maker_score, primary_contact = self.calculate_decision_maker_score(leadership_team)
        tech_investment_score = self.calculate_tech_investment_score(tech_indicators)
        pain_points = self.extract_pain_points(text_content)
        growth_score, suggested_timing = self.calculate_growth_score(growth_indicators, company_size)
        
        # Calculate overall lead score (weighted average)
        lead_score = (
            decision_maker_score * 0.3 +
            tech_investment_score * 0.25 +
            growth_score * 0.25 +
            ai_readiness_score * 0.2
        )
        
        # Determine lead quality tier
        if lead_score >= 8:
            lead_tier = "Hot"
        elif lead_score >= 6:
            lead_tier = "Warm"
        else:
            lead_tier = "Nurture"
        
        # Generate outreach recommendations
        outreach_approach = self.determine_outreach_approach(ai_readiness_score, pain_points)
        
        # Create sales insights object
        sales_insights = {
            'lead_score': round(lead_score, 1),
            'lead_tier': lead_tier,
            'score_components': {
                'decision_maker_score': round(decision_maker_score, 1),
                'tech_investment_score': round(tech_investment_score, 1),
                'growth_score': round(growth_score, 1),
                'ai_readiness_factor': round(ai_readiness_score * 0.2, 1)
            },
            'primary_contact': primary_contact,
            'pain_points': pain_points,
            'outreach_recommendation': {
                'timing': suggested_timing,
                'approach': outreach_approach
            },
            'crm_ready': self.prepare_crm_data(
                analysis_results, 
                lead_score, 
                lead_tier, 
                primary_contact, 
                suggested_timing
            )
        }
        
        return sales_insights
    
    def prepare_crm_data(self, analysis_results, lead_score, lead_tier, primary_contact, timing):
        """
        Prepare data in a format ready for CRM import.
        
        Args:
            analysis_results (dict): Analysis results
            lead_score (float): Overall lead score
            lead_tier (str): Lead quality tier
            primary_contact (dict): Primary contact information
            timing (str): Suggested outreach timing
            
        Returns:
            dict: CRM-ready data object
        """
        contact_info = analysis_results.get('contact_info', {})
        
        # Extract company name from domain
        domain = analysis_results.get('base_url', '')
        company_name = domain.replace('https://', '').replace('http://', '').replace('www.', '').split('.')[0]
        company_name = company_name.title()  # Capitalize first letter of each word
        
        # Format contact name
        contact_name = ""
        contact_title = ""
        if primary_contact:
            contact_name = primary_contact.get('name', '')
            contact_title = primary_contact.get('title', '')
        
        # Prepare CRM data
        crm_data = {
            'company': {
                'name': company_name,
                'website': analysis_results.get('base_url', ''),
                'size': analysis_results.get('company_size_indicator', 'Unknown'),
                'lead_score': lead_score,
                'lead_tier': lead_tier,
                'ai_readiness_score': analysis_results.get('ai_readiness_score', 0),
                'industry': 'Technology',  # Default, in a real implementation we would detect this
                'outreach_timing': timing
            },
            'contact': {
                'name': contact_name,
                'title': contact_title,
                'email': contact_info.get('emails', [''])[0] if contact_info.get('emails') else '',
                'phone': contact_info.get('phones', [''])[0] if contact_info.get('phones') else ''
            }
        }
        
        return crm_data