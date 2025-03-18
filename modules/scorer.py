class AIReadinessScorer:
    def __init__(self):
        # Category weights for scoring
        self.category_weights = {
            'ai_ml': 3.0,       # AI/ML technologies are most important
            'data': 2.5,        # Data infrastructure is critical
            'cloud': 2.0,       # Cloud adoption indicates technical maturity
            'integration': 1.5, # Integration capabilities are important
            'automation': 2.0   # Automation shows process maturity
        }
        
        # Leadership score factors
        self.tech_leadership_titles = [
            'cto', 'chief technology', 'vp of engineering', 'chief information',
            'chief digital', 'chief data', 'head of it', 'director of technology',
            'chief innovation', 'chief ai', 'technology director', 'cio'
        ]
        
    def calculate_tech_score(self, tech_indicators):
        """Calculate technology score based on indicators"""
        tech_score = 0
        
        for category, data in tech_indicators.items():
            # Get the weight for this category
            weight = self.category_weights.get(category, 1.0)
            
            # Calculate score based on total mentions with diminishing returns
            # We use log scaling to prevent overly high scores from repeated mentions
            # Formula: weight * log(1 + total_mentions)
            import math
            category_score = weight * math.log(1 + data['total'])
            tech_score += category_score
        
        return tech_score
    
    def calculate_leadership_score(self, leadership_team):
        """Calculate leadership score based on technical leadership presence"""
        if not leadership_team:
            return 0
            
        leadership_score = 0
        
        # Check for technical leadership roles
        for person in leadership_team:
            title = person['title'].lower()
            if any(tech_title in title for tech_title in self.tech_leadership_titles):
                leadership_score += 2  # Strong indicator
            elif 'tech' in title or 'digital' in title or 'data' in title or 'it' in title:
                leadership_score += 1  # Moderate indicator
        
        # Cap leadership score
        return min(leadership_score, 5)
    
    def calculate_growth_score(self, growth_indicators, company_size):
        """Calculate growth score based on indicators and company size"""
        growth_score = len(growth_indicators) * 0.5  # 0.5 points per growth indicator
        
        # Company size factor
        if company_size == 'Small Company/Startup':
            growth_score *= 1.2  # Startups with growth indicators are good candidates
        elif company_size == 'Mid-size Company':
            growth_score *= 1.0  # Neutral
        else:  # Large Enterprise
            growth_score *= 0.8  # Large companies may be harder to transform
        
        # Cap growth score
        return min(growth_score, 2)
    
    def identify_opportunities(self, analysis_results, ai_readiness_score):
        """Identify potential AI transformation opportunities"""
        opportunities = []
        tech_indicators = analysis_results['tech_indicators']
        
        # Basic opportunities based on readiness score
        if ai_readiness_score <= 3:
            opportunities.append({
                "title": "Basic Data Infrastructure Implementation",
                "description": "Establish foundational data collection and storage systems to prepare for AI initiatives."
            })
            opportunities.append({
                "title": "AI Readiness Assessment",
                "description": "Conduct a detailed analysis of current systems and processes to identify initial AI opportunities."
            })
        elif ai_readiness_score <= 6:
            opportunities.append({
                "title": "Process Automation Integration",
                "description": "Implement automated workflows for routine business processes to improve efficiency."
            })
            opportunities.append({
                "title": "Data Analytics Implementation",
                "description": "Deploy analytics solutions to extract business insights from existing data assets."
            })
        else:
            opportunities.append({
                "title": "Advanced AI Solution Deployment",
                "description": "Implement sophisticated AI models to enhance decision-making and create competitive advantages."
            })
            opportunities.append({
                "title": "Predictive Analytics Enhancement",
                "description": "Leverage existing data infrastructure for forecasting and predictive business intelligence."
            })
        
        # Check for specific opportunities based on missing or present indicators
        categories = tech_indicators.keys()
        
        if 'data' in categories and 'ai_ml' not in categories:
            opportunities.append({
                "title": "AI Model Implementation",
                "description": "Leverage existing data assets by implementing machine learning models for predictive capabilities."
            })
        
        if 'cloud' in categories and 'integration' not in categories:
            opportunities.append({
                "title": "API Development for System Integration",
                "description": "Create APIs to connect cloud systems with other business applications for improved data flow."
            })
        
        if 'automation' in categories and 'ai_ml' not in categories:
            opportunities.append({
                "title": "Intelligent Automation Upgrade",
                "description": "Enhance existing automation with AI capabilities for more adaptive and intelligent processes."
            })
        
        if 'ai_ml' in categories and 'data' not in categories:
            opportunities.append({
                "title": "Robust Data Infrastructure Development",
                "description": "Build comprehensive data pipeline to fully leverage existing AI capabilities."
            })
        
        # Return top 3 opportunities
        return opportunities[:3]
    
    def calculate_score(self, analysis_results):
        """Calculate overall AI readiness score and identify opportunities"""
        # Get individual component scores
        tech_score = self.calculate_tech_score(analysis_results.get('tech_indicators', {}))
        leadership_score = self.calculate_leadership_score(analysis_results.get('leadership_team', []))
        growth_score = self.calculate_growth_score(
            analysis_results.get('growth_indicators', []),
            analysis_results.get('company_size_indicator', 'Unknown')
        )
        
        # Calculate raw score (max theoretical value around 20)
        raw_score = tech_score + leadership_score + growth_score
        
        # Normalize to 1-10 scale
        ai_readiness_score = max(1, min(10, round(raw_score / 2)))
        
        # Create final results
        final_results = {
            'ai_readiness_score': ai_readiness_score,
            'score_components': {
                'technology_score': round(tech_score, 1),
                'leadership_score': round(leadership_score, 1),
                'growth_score': round(growth_score, 1)
            },
            'tech_indicators': analysis_results.get('tech_indicators', {}),
            'leadership_team': analysis_results.get('leadership_team', []),
            'contact_info': analysis_results.get('contact_info', {}),
            'growth_indicators': analysis_results.get('growth_indicators', []),
            'company_size_indicator': analysis_results.get('company_size_indicator', 'Unknown'),
        }
        
        # Identify transformation opportunities
        final_results['transformation_opportunities'] = self.identify_opportunities(analysis_results, ai_readiness_score)
        
        return final_results