import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
import logging
import re
import torch
import json

logger = logging.getLogger(__name__)

class InvestmentCriteriaValidator:
    """
    Validates company leads against Caprae Capital's investment criteria
    using advanced machine learning models
    """
    
    def __init__(self):
        """Initialize the investment criteria validator with ML models"""
        # Initialize traditional ML models
        self.rf_model = RandomForestClassifier(n_estimators=200, random_state=42)
        self.mlp_model = MLPClassifier(hidden_layer_sizes=(100, 50), random_state=42)
        
        # Initialize BERT for text analysis if available
        self.has_bert = False
        try:
            # Import BERT components only if available
            from transformers import BertTokenizer, BertModel
            self.bert_tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
            self.bert_model = BertModel.from_pretrained('bert-base-uncased')
            self.has_bert = True
        except (ImportError, ModuleNotFoundError) as e:
            logger.warning(f"BERT not available: {str(e)}. Falling back to rule-based analysis.")
            
        # Define investment criteria thresholds
        self.criteria = {
            'revenue': {
                'min': 5000000,  # $5 million
                'max': 50000000  # $50 million
            },
            'cash_flow': {
                'min': 1000000,  # $1 million
                'max': 5000000   # $5 million
            },
            'ebitda_margin': {
                'min': 15        # 15%
            },
            'recurring_revenue': {
                'min': 50        # 50%
            },
            'profitability_years': {
                'min': 3         # 3+ years
            },
            'market_size': {
                'min': 1000000000  # $1 billion
            }
        }
    
    def get_text_from_data(self, company_data, key='text_data'):
        """Helper method to safely extract text from company_data"""
        # Handle string input (JSON)
        if isinstance(company_data, str):
            try:
                company_data = json.loads(company_data)
            except json.JSONDecodeError:
                return None
        
        # If we have a dictionary, extract the requested key
        if isinstance(company_data, dict):
            text_data = company_data.get(key)
            return text_data
            
        return None
    
    def validate(self, analysis_results, sales_insights, financials=None, business_details=None, industry_details=None):
        """
        Validates if a company meets Caprae Capital's investment criteria
        Returns a detailed assessment of criteria match
        """
        # Safely handle input data
        company_data = {}
        
        # Handle analysis_results - ensure it's a dictionary
        if isinstance(analysis_results, str):
            try:
                analysis_results = json.loads(analysis_results)
            except json.JSONDecodeError:
                logger.error("Failed to parse analysis_results as JSON")
                analysis_results = {}
        
        # Handle sales_insights - ensure it's a dictionary
        if isinstance(sales_insights, str):
            try:
                sales_insights = json.loads(sales_insights)
            except json.JSONDecodeError:
                logger.error("Failed to parse sales_insights as JSON")
                sales_insights = {}
        
        # Combine all available data
        if isinstance(analysis_results, dict):
            company_data.update(analysis_results)
        
        if isinstance(sales_insights, dict):
            company_data['sales_insights'] = sales_insights
        
        if financials and isinstance(financials, dict):
            company_data['financials'] = financials
            
        if business_details and isinstance(business_details, dict):
            company_data['business_details'] = business_details
            
        if industry_details and isinstance(industry_details, dict):
            company_data['industry_details'] = industry_details
        
        # Evaluate each criterion category
        business_match = self._evaluate_business_criteria(company_data)
        industry_match = self._evaluate_industry_criteria(company_data)
        financial_match = self._evaluate_financial_criteria(company_data)
        
        # Calculate overall match score (weighted average)
        overall_match = (
            business_match['score'] * 0.35 +
            industry_match['score'] * 0.25 +
            financial_match['score'] * 0.40
        )
        
        # Determine match tier
        if overall_match >= 80:
            match_tier = "Strong Match"
        elif overall_match >= 60:
            match_tier = "Potential Match"
        elif overall_match >= 40:
            match_tier = "Partial Match"
        else:
            match_tier = "Weak Match"
            
        # Calculate confidence level based on data completeness
        confidence = self._calculate_confidence(company_data)
        
        # Combine results
        result = {
            'overall_match': overall_match,
            'match_tier': match_tier,
            'confidence': confidence,
            'business_criteria': business_match,
            'industry_criteria': industry_match,
            'financial_criteria': financial_match,
            'key_strengths': self._identify_key_strengths(company_data, business_match, industry_match, financial_match),
            'key_concerns': self._identify_key_concerns(company_data, business_match, industry_match, financial_match),
            'data_completeness': self._get_data_completeness(company_data)
        }
        
        return result
    
    def _evaluate_business_criteria(self, company_data):
        """Evaluates business-related investment criteria"""
        score = 0
        max_score = 0
        criteria_met = []
        criteria_missed = []
        
        # Market position assessment
        max_score += 20
        market_position = self._extract_market_position(company_data)
        if market_position == 'strong':
            score += 20
            criteria_met.append("Distinctive and defensible market position")
        elif market_position == 'moderate':
            score += 12
            criteria_met.append("Moderate market position")
        else:
            criteria_missed.append("Distinctive and defensible market position")
        
        # Customer base assessment
        max_score += 20
        customer_diversity = self._extract_customer_diversity(company_data)
        if customer_diversity == 'diverse':
            score += 20
            criteria_met.append("Strong and diverse customer base")
        elif customer_diversity == 'moderate':
            score += 12
            criteria_met.append("Moderately diverse customer base")
        else:
            criteria_missed.append("Strong and diverse customer base")
        
        # Operations complexity
        max_score += 20
        operations = self._extract_operations_complexity(company_data)
        if operations == 'straightforward':
            score += 20
            criteria_met.append("Straightforward operations")
        elif operations == 'moderate':
            score += 12
            criteria_met.append("Moderately complex operations")
        else:
            criteria_missed.append("Straightforward operations")
        
        # Middle management assessment
        max_score += 20
        management = self._extract_management_strength(company_data)
        if management == 'strong':
            score += 20
            criteria_met.append("Strong middle-management team")
        elif management == 'moderate':
            score += 12
            criteria_met.append("Adequate management team")
        else:
            criteria_missed.append("Strong middle-management team")
        
        # Owner status assessment
        max_score += 20
        owner_status = self._extract_owner_status(company_data)
        if owner_status == 'exit':
            score += 20
            criteria_met.append("Owner seeking exit")
        elif owner_status == 'reduced_role':
            score += 15
            criteria_met.append("Owner seeking reduced role")
        else:
            criteria_missed.append("Owner seeking reduced role or exit")
        
        # Normalize score
        final_score = (score / max_score * 100) if max_score > 0 else 0
        
        return {
            'score': final_score,
            'criteria_met': criteria_met,
            'criteria_missed': criteria_missed,
            'details': {
                'market_position': market_position,
                'customer_diversity': customer_diversity,
                'operations_complexity': operations,
                'management_strength': management,
                'owner_status': owner_status
            }
        }
    
    def _evaluate_industry_criteria(self, company_data):
        """Evaluates industry-related investment criteria"""
        score = 0
        max_score = 0
        criteria_met = []
        criteria_missed = []
        
        # Service-based assessment
        max_score += 20
        service_based = self._extract_service_based(company_data)
        if service_based == 'service':
            score += 20
            criteria_met.append("Service-based industry")
        elif service_based == 'hybrid':
            score += 10
            criteria_met.append("Hybrid product/service model")
        else:
            criteria_missed.append("Service-based industry")
        
        # Recurring revenue model
        max_score += 20
        recurring_model = self._extract_recurring_revenue_model(company_data)
        if recurring_model == 'strong':
            score += 20
            criteria_met.append("Strong recurring revenue model")
        elif recurring_model == 'moderate':
            score += 12
            criteria_met.append("Moderate recurring revenue")
        else:
            criteria_missed.append("Strong recurring revenue")
        
        # B2B focus
        max_score += 15
        b2b_focus = self._extract_b2b_focus(company_data)
        if b2b_focus == 'b2b':
            score += 15
            criteria_met.append("B2B focus")
        elif b2b_focus == 'mixed':
            score += 8
            criteria_met.append("Mixed B2B/B2C model")
        else:
            criteria_missed.append("B2B focus")
        
        # Competitive landscape
        max_score += 15
        competitive = self._extract_competitive_landscape(company_data)
        if competitive == 'fragmented':
            score += 15
            criteria_met.append("Fragmented competitive landscape")
        elif competitive == 'moderate':
            score += 8
            criteria_met.append("Moderately competitive landscape")
        else:
            criteria_missed.append("Fragmented competitive landscape")
        
        # Market size
        max_score += 15
        market_size = self._extract_market_size(company_data)
        if market_size and market_size >= self.criteria['market_size']['min']:
            score += 15
            criteria_met.append("Large total market (>$1B)")
        else:
            criteria_missed.append("Large total market (>$1B)")
        
        # Industry growth
        max_score += 15
        growth_rate = self._extract_industry_growth(company_data)
        if growth_rate and growth_rate > 5:  # >5% growth
            score += 15
            criteria_met.append("Growing industry")
        elif growth_rate and growth_rate > 2:  # 2-5% growth
            score += 8
            criteria_met.append("Stable industry with modest growth")
        else:
            criteria_missed.append("Growing industry")
        
        # Normalize score
        final_score = (score / max_score * 100) if max_score > 0 else 0
        
        return {
            'score': final_score,
            'criteria_met': criteria_met,
            'criteria_missed': criteria_missed,
            'details': {
                'service_based': service_based,
                'recurring_model': recurring_model,
                'b2b_focus': b2b_focus,
                'competitive_landscape': competitive,
                'market_size': market_size,
                'growth_rate': growth_rate
            }
        }
    
    def _evaluate_financial_criteria(self, company_data):
        """Evaluates financial-related investment criteria"""
        score = 0
        max_score = 0
        criteria_met = []
        criteria_missed = []
        
        # Revenue range assessment
        max_score += 20
        revenue = self._extract_revenue(company_data)
        if revenue:
            if self.criteria['revenue']['min'] <= revenue <= self.criteria['revenue']['max']:
                score += 20
                criteria_met.append(f"Revenue in target range ($5-50M)")
            elif revenue < self.criteria['revenue']['min']:
                score += 10 * (revenue / self.criteria['revenue']['min'])
                criteria_missed.append(f"Revenue in target range ($5-50M)")
            else:
                score += 10 * (self.criteria['revenue']['max'] / revenue)
                criteria_missed.append(f"Revenue in target range ($5-50M)")
        else:
            criteria_missed.append(f"Revenue in target range ($5-50M)")
        
        # Cash flow assessment
        max_score += 20
        cash_flow = self._extract_cash_flow(company_data)
        if cash_flow:
            if self.criteria['cash_flow']['min'] <= cash_flow <= self.criteria['cash_flow']['max']:
                score += 20
                criteria_met.append(f"Cash flow in target range ($1-5M)")
            elif cash_flow < self.criteria['cash_flow']['min']:
                score += 10 * (cash_flow / self.criteria['cash_flow']['min'])
                criteria_missed.append(f"Cash flow in target range ($1-5M)")
            else:
                score += 10 * (self.criteria['cash_flow']['max'] / cash_flow)
                criteria_missed.append(f"Cash flow in target range ($1-5M)")
        else:
            criteria_missed.append(f"Cash flow in target range ($1-5M)")
        
        # Profitability years
        max_score += 15
        profit_years = self._extract_profitability_years(company_data)
        if profit_years and profit_years >= self.criteria['profitability_years']['min']:
            score += 15
            criteria_met.append(f"3+ years of profitability")
        elif profit_years:
            score += 15 * (profit_years / self.criteria['profitability_years']['min'])
            criteria_missed.append(f"3+ years of profitability")
        else:
            criteria_missed.append(f"3+ years of profitability")
        
        # EBITDA margin
        max_score += 20
        ebitda = self._extract_ebitda_margin(company_data)
        if ebitda and ebitda >= self.criteria['ebitda_margin']['min']:
            score += 20
            criteria_met.append(f"EBITDA margin >15%")
        elif ebitda:
            score += 20 * (ebitda / self.criteria['ebitda_margin']['min'])
            criteria_missed.append(f"EBITDA margin >15%")
        else:
            criteria_missed.append(f"EBITDA margin >15%")
        
        # Capital expenditure
        max_score += 15
        capex = self._extract_capex(company_data)
        if capex == 'low':
            score += 15
            criteria_met.append("Low capital expenditure requirements")
        elif capex == 'moderate':
            score += 8
            criteria_met.append("Moderate capital expenditure requirements")
        else:
            criteria_missed.append("Low capital expenditure requirements")
        
        # Recurring revenue percentage
        max_score += 10
        recurring_pct = self._extract_recurring_revenue_pct(company_data)
        if recurring_pct and recurring_pct >= self.criteria['recurring_revenue']['min']:
            score += 10
            criteria_met.append(f"Strong recurring revenue component (>50%)")
        elif recurring_pct:
            score += 10 * (recurring_pct / self.criteria['recurring_revenue']['min'])
            criteria_missed.append(f"Strong recurring revenue component (>50%)")
        else:
            criteria_missed.append(f"Strong recurring revenue component (>50%)")
        
        # Normalize score
        final_score = (score / max_score * 100) if max_score > 0 else 0
        
        return {
            'score': final_score,
            'criteria_met': criteria_met,
            'criteria_missed': criteria_missed,
            'details': {
                'revenue': revenue,
                'cash_flow': cash_flow,
                'profit_years': profit_years,
                'ebitda_margin': ebitda,
                'capex': capex,
                'recurring_revenue_pct': recurring_pct
            }
        }
    
    def _identify_key_strengths(self, company_data, business_match, industry_match, financial_match):
        """Identifies key strengths of the company relative to investment criteria"""
        strengths = []
        
        # Get top criteria met from each category
        all_criteria_met = (
            business_match['criteria_met'] + 
            industry_match['criteria_met'] + 
            financial_match['criteria_met']
        )
        
        # Prioritize financial criteria
        financial_criteria = [c for c in financial_match['criteria_met']]
        if financial_criteria:
            strengths.extend(financial_criteria[:2])  # Add top 2 financial strengths
        
        # Add other top criteria to get to 5 total strengths
        remaining_criteria = [c for c in all_criteria_met if c not in strengths]
        strengths.extend(remaining_criteria[:5 - len(strengths)])
        
        return strengths
    
    def _identify_key_concerns(self, company_data, business_match, industry_match, financial_match):
        """Identifies key concerns or risks relative to investment criteria"""
        concerns = []
        
        # Get all criteria missed from each category
        all_criteria_missed = (
            business_match['criteria_missed'] + 
            industry_match['criteria_missed'] + 
            financial_match['criteria_missed']
        )
        
        # Prioritize financial criteria misses
        financial_concerns = [c for c in financial_match['criteria_missed']]
        if financial_concerns:
            concerns.extend(financial_concerns[:2])  # Add top 2 financial concerns
        
        # Add other top concerns to get to 5 total concerns
        remaining_concerns = [c for c in all_criteria_missed if c not in concerns]
        concerns.extend(remaining_concerns[:5 - len(concerns)])
        
        return concerns
    
    def _calculate_confidence(self, company_data):
        """Calculates confidence level in the assessment based on data completeness"""
        # Count available data points
        available_data = 0
        total_data_points = 14  # Total number of key data points we look for
        
        # Financial data
        if self._extract_revenue(company_data) is not None:
            available_data += 1
        if self._extract_cash_flow(company_data) is not None:
            available_data += 1
        if self._extract_ebitda_margin(company_data) is not None:
            available_data += 1
        if self._extract_profitability_years(company_data) is not None:
            available_data += 1
        if self._extract_capex(company_data) is not None:
            available_data += 1
        if self._extract_recurring_revenue_pct(company_data) is not None:
            available_data += 1
            
        # Business data
        if self._extract_market_position(company_data) is not None:
            available_data += 1
        if self._extract_customer_diversity(company_data) is not None:
            available_data += 1
        if self._extract_operations_complexity(company_data) is not None:
            available_data += 1
        if self._extract_management_strength(company_data) is not None:
            available_data += 1
        if self._extract_owner_status(company_data) is not None:
            available_data += 1
            
        # Industry data
        if self._extract_service_based(company_data) is not None:
            available_data += 1
        if self._extract_market_size(company_data) is not None:
            available_data += 1
        if self._extract_industry_growth(company_data) is not None:
            available_data += 1
            
        # Calculate confidence percentage
        confidence = (available_data / total_data_points) * 100
        
        # Add a bonus for verified data
        if company_data.get('verification', {}).get('status') == 'Verified':
            confidence = min(100, confidence + 15)
            
        return confidence
    
    def _get_data_completeness(self, company_data):
        """Returns a breakdown of data completeness by category"""
        completeness = {
            'financial': 0,
            'business': 0,
            'industry': 0
        }
        
        # Financial data (6 data points)
        financial_available = 0
        if self._extract_revenue(company_data) is not None:
            financial_available += 1
        if self._extract_cash_flow(company_data) is not None:
            financial_available += 1
        if self._extract_ebitda_margin(company_data) is not None:
            financial_available += 1
        if self._extract_profitability_years(company_data) is not None:
            financial_available += 1
        if self._extract_capex(company_data) is not None:
            financial_available += 1
        if self._extract_recurring_revenue_pct(company_data) is not None:
            financial_available += 1
        completeness['financial'] = (financial_available / 6) * 100
        
        # Business data (5 data points)
        business_available = 0
        if self._extract_market_position(company_data) is not None:
            business_available += 1
        if self._extract_customer_diversity(company_data) is not None:
            business_available += 1
        if self._extract_operations_complexity(company_data) is not None:
            business_available += 1
        if self._extract_management_strength(company_data) is not None:
            business_available += 1
        if self._extract_owner_status(company_data) is not None:
            business_available += 1
        completeness['business'] = (business_available / 5) * 100
        
        # Industry data (4 data points)
        industry_available = 0
        if self._extract_service_based(company_data) is not None:
            industry_available += 1
        if self._extract_b2b_focus(company_data) is not None:
            industry_available += 1
        if self._extract_market_size(company_data) is not None:
            industry_available += 1
        if self._extract_industry_growth(company_data) is not None:
            industry_available += 1
        completeness['industry'] = (industry_available / 4) * 100
        
        return completeness
    
    # Data extraction methods
    
    def _extract_revenue(self, company_data):
        """Extracts revenue from company data"""
        # First, check if we have verified financial data
        if company_data.get('financials', {}).get('estimated_revenue') is not None:
            return company_data['financials']['estimated_revenue']
        
        # Otherwise check for sales insights data
        sales = company_data.get('sales_insights', {})
        if sales.get('crm_ready', {}).get('company', {}).get('annual_revenue'):
            return sales['crm_ready']['company']['annual_revenue']
        
        return None
    
    def _extract_cash_flow(self, company_data):
        """Extracts annual cash flow from company data"""
        # First, check if we have verified financial data
        if company_data.get('financials', {}).get('estimated_annual_cash_flow') is not None:
            return company_data['financials']['estimated_annual_cash_flow']
        
        # Otherwise, try to estimate from revenue and margins
        revenue = self._extract_revenue(company_data)
        ebitda = self._extract_ebitda_margin(company_data)
        
        if revenue and ebitda:
            # Very rough approximation: EBITDA as percentage of revenue → cash flow
            estimated_cf = revenue * (ebitda / 100) * 0.8  # 80% of EBITDA as proxy for FCF
            return estimated_cf
        
        return None
    
    def _extract_ebitda_margin(self, company_data):
        """Extracts EBITDA margin from company data"""
        # First, check if we have verified financial data
        if company_data.get('financials', {}).get('ebitda_margin') is not None:
            return company_data['financials']['ebitda_margin']
        
        return None
    
    def _extract_profitability_years(self, company_data):
        """Extracts years of profitability from company data"""
        # Check if we have verified financial data
        if company_data.get('financials', {}).get('profitability_years') is not None:
            return company_data['financials']['profitability_years']
        
        return None
    
    def _extract_capex(self, company_data):
        """Extracts capital expenditure requirements from company data"""
        # Check if we have verified financial data
        if company_data.get('financials', {}).get('capex_requirements') is not None:
            return company_data['financials']['capex_requirements']
        
        # Try to infer from industry type
        industry = self._extract_industry_type(company_data)
        if industry:
            low_capex_industries = ['software', 'consulting', 'professional services', 
                                  'financial services', 'marketing', 'digital']
            high_capex_industries = ['manufacturing', 'construction', 'transportation', 
                                   'logistics', 'energy', 'healthcare']
            
            for low_ind in low_capex_industries:
                if low_ind in industry.lower():
                    return 'low'
            
            for high_ind in high_capex_industries:
                if high_ind in industry.lower():
                    return 'high'
            
            # Default to moderate if industry is known but not in our lists
            return 'moderate'
        
        return None
    
    def _extract_recurring_revenue_pct(self, company_data):
        """Extracts recurring revenue percentage from company data"""
        financials = company_data.get('financials', {})
        
        # Check if it's a dictionary to avoid errors
        if not isinstance(financials, dict):
            return None

        # Extract recurring revenue percentage
        if financials.get('recurring_revenue_percentage') is not None:
            recurring_pct = financials['recurring_revenue_percentage']
            return recurring_pct
        
        # Try to infer from business model
        business_model = self._extract_business_model(company_data)
        if business_model:
            if 'subscription' in business_model.lower():
                return 80  # Subscription businesses typically have high recurring revenue
            elif 'saas' in business_model.lower():
                return 90  # SaaS businesses typically have very high recurring revenue
            elif 'service' in business_model.lower():
                return 60  # Service businesses often have moderate-high recurring revenue
            elif 'consulting' in business_model.lower():
                return 40  # Consulting can have moderate recurring revenue
        return None
    
    def _extract_market_position(self, company_data):
        """Extracts market position from company data"""
        # Check if we have verified business details
        if company_data.get('business_details', {}).get('market_position') is not None:
            return company_data['business_details']['market_position']
        
        # Try to infer from text data using BERT if available
        if self.has_bert:
            text_data = self.get_text_from_data(company_data)
            if text_data:
                try:
                    # Process text with BERT
                    inputs = self.bert_tokenizer(text_data, return_tensors="pt", truncation=True, max_length=512)
                    outputs = self.bert_model(**inputs)
                    # Further processing would be done here in a real implementation
                    # For now, return a default value
                    return 'moderate'
                except Exception as e:
                    logger.error(f"Error processing text with BERT: {str(e)}")
        
        return None
    
    def _extract_customer_diversity(self, company_data):
        """Extracts customer diversity from company data"""
        # Check if we have verified business details
        if company_data.get('business_details', {}).get('customer_diversity') is not None:
            return company_data['business_details']['customer_diversity']
        
        return None
    
    def _extract_operations_complexity(self, company_data):
        """Extracts operations complexity from company data"""
        # Check if we have verified business details
        if company_data.get('business_details', {}).get('operations_complexity') is not None:
            return company_data['business_details']['operations_complexity']
        
        # Try to infer from industry type
        industry = self._extract_industry_type(company_data)
        if industry:
            simple_ops_industries = ['software', 'digital services', 'consulting']
            complex_ops_industries = ['manufacturing', 'logistics', 'healthcare']
            
            for simple in simple_ops_industries:
                if simple in industry.lower():
                    return 'straightforward'
            
            for complex in complex_ops_industries:
                if complex in industry.lower():
                    return 'complex'
            
            # Default to moderate
            return 'moderate'
        
        return None
    
    def _extract_management_strength(self, company_data):
        """Extracts management team strength from company data"""
        # Check if we have verified business details
        if company_data.get('business_details', {}).get('middle_management_strength') is not None:
            return company_data['business_details']['middle_management_strength']
        
        # Check if we have leadership team data
        leadership = company_data.get('leadership_team', [])
        if leadership:
            if len(leadership) >= 5:
                return 'strong'
            elif len(leadership) >= 3:
                return 'moderate'
            else:
                return 'limited'
        
        return None
    
    def _extract_owner_status(self, company_data):
        """Extracts owner's status regarding exit/reduced role"""
        # Check if we have verified business details
        if company_data.get('business_details', {}).get('owner_status') is not None:
            return company_data['business_details']['owner_status']
        
        return None
    
    def _extract_service_based(self, company_data):
        """Determines if company is service-based"""
        # Check if we have verified industry details
        if company_data.get('industry_details', {}).get('industry_type') is not None:
            industry = company_data['industry_details']['industry_type'].lower()
            if 'service' in industry:
                return 'service'
            elif 'product' in industry and 'service' in industry:
                return 'hybrid'
            else:
                return 'product'
        
        # Try to infer from other data
        industry = self._extract_industry_type(company_data)
        if industry:
            service_industries = ['consulting', 'professional services', 'software as a service',
                                'managed services', 'outsourcing', 'support']
            
            for svc in service_industries:
                if svc in industry.lower():
                    return 'service'
            
            hybrid_industries = ['software', 'technology', 'analytics']
            for hyb in hybrid_industries:
                if hyb in industry.lower():
                    return 'hybrid'
            
            return 'product'
        
        return None
    
    def _extract_recurring_revenue_model(self, company_data):
        """Evaluates strength of recurring revenue model"""
        # Check recurring revenue percentage
        recurring_pct = self._extract_recurring_revenue_pct(company_data)
        if recurring_pct:
            if recurring_pct >= 70:
                return 'strong'
            elif recurring_pct >= 40:
                return 'moderate'
            else:
                return 'weak'
        
        # Try to infer from business model
        business_model = self._extract_business_model(company_data)
        if business_model:
            strong_recurring = ['subscription', 'saas', 'retainer']
            moderate_recurring = ['services', 'maintenance', 'support']
            
            for strong in strong_recurring:
                if strong in business_model.lower():
                    return 'strong'
            
            for moderate in moderate_recurring:
                if moderate in business_model.lower():
                    return 'moderate'
        
        return None
    
    def _extract_b2b_focus(self, company_data):
        """Determines if company is B2B focused"""
        # Check if we have verified industry details
        if company_data.get('industry_details', {}).get('b2b_percentage') is not None:
            b2b_pct = company_data['industry_details']['b2b_percentage']
            if b2b_pct >= 70:
                return 'b2b'
            elif b2b_pct >= 30:
                return 'mixed'
            else:
                return 'b2c'
        
        # Try simple text analysis if BERT is not available
        data_str = str(company_data).lower()
        b2b_indicators = ['enterprise', 'business customer', 'corporate', 'client', 
                       'organization', 'solution', 'platform']
        b2c_indicators = ['consumer', 'personal', 'individual', 'user', 'customer']
        
        b2b_count = sum(1 for ind in b2b_indicators if ind in data_str)
        b2c_count = sum(1 for ind in b2c_indicators if ind in data_str)
        
        if b2b_count > b2c_count * 2:
            return 'b2b'
        elif b2b_count > b2c_count:
            return 'mixed'
        else:
            return 'b2c'
    
    def _extract_competitive_landscape(self, company_data):
        """Evaluates the competitive landscape"""
        # Check if we have verified industry details
        if company_data.get('industry_details', {}).get('competitive_landscape') is not None:
            return company_data['industry_details']['competitive_landscape']
        
        return None
    
    def _extract_market_size(self, company_data):
        """Extracts total market size"""
        # Check if we have verified industry details
        if company_data.get('industry_details', {}).get('total_market_size') is not None:
            return company_data['industry_details']['total_market_size']
        
        return None
    
    def _extract_industry_growth(self, company_data):
        """Extracts industry growth rate"""
        # Check if we have verified industry details
        if company_data.get('industry_details', {}).get('market_growth_rate') is not None:
            return company_data['industry_details']['market_growth_rate']
        
        return None
    
    def _extract_industry_type(self, company_data):
        """Helper method to extract industry type"""
        # Check verified data first
        if company_data.get('industry_details', {}).get('industry_type'):
            return company_data['industry_details']['industry_type']
        
        # Check sales insights
        if company_data.get('sales_insights', {}).get('crm_ready', {}).get('company', {}).get('industry'):
            return company_data['sales_insights']['crm_ready']['company']['industry']
        
        return None
    
    def _extract_business_model(self, company_data):
        """Helper method to extract business model"""
        # This would normally use NLP to extract from text content
        # Simplified version checks for keywords in the data
        data_str = str(company_data).lower()
        
        if 'subscription' in data_str:
            return 'subscription'
        elif 'saas' in data_str:
            return 'saas'
        elif 'service' in data_str:
            return 'service'
        elif 'consulting' in data_str:
            return 'consulting'
        
        return None