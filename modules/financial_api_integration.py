import logging
from .yahoo_finance_handler import YahooFinanceHandler
from .financial_analyzer import FinancialAnalyzer

logger = logging.getLogger(__name__)

class FinancialAPIIntegration:
    """
    Integration point for financial APIs and data analysis
    Combines Yahoo Finance API and ML-powered analysis
    """
    
    def __init__(self):
        """Initialize the financial API integration module"""
        self.yahoo_handler = YahooFinanceHandler()
        self.financial_analyzer = FinancialAnalyzer()
    
    def get_company_financials(self, company_name=None, ticker=None):
        """Get comprehensive financial data for a company"""
        try:
            logger.debug(f"Getting financial data for company: {company_name}, ticker: {ticker}")
            # First try Yahoo Finance
            financials = self.yahoo_handler.get_company_financials(company_name, ticker)
            
            if not financials or not financials.get('annual_revenue'):
                # If Yahoo Finance fails, try financial analyzer 
                # (which may use alternative APIs or ML predictions)
                financials = self.financial_analyzer.find_ticker(company_name)
                if financials:
                    return financials
            
            return financials
            
        except Exception as e:
            logger.error(f"Error getting financial data: {str(e)}")
            return None
    
    def analyze_investment_fit(self, company_data, financials=None):
        """
        Analyze how well a company fits the investment criteria
        Using advanced ML models for prediction and analysis
        """
        try:
            # Get financials if not provided
            if not financials and company_data.get('company_name'):
                financials = self.get_company_financials(company_data.get('company_name'))
            
            # Use the financial analyzer to predict investment fit
            investment_fit = self.financial_analyzer.predict_investment_fit(
                company_data, 
                financials
            )
            
            # Also get a second analysis from Yahoo Finance for validation
            if financials:
                yahoo_analysis = self.yahoo_handler.analyze_for_investment_criteria(financials)
                
                # Combine the analyses (weighted average)
                if yahoo_analysis:
                    # Calculate weighted score (ML model has higher weight)
                    combined_score = (
                        investment_fit.get('score', 0) * 0.7 + 
                        yahoo_analysis.get('match_score', 0) * 0.3
                    )
                    
                    # Create combined list of criteria met/missed
                    criteria_met = list(set(
                        investment_fit.get('criteria_met', []) + 
                        yahoo_analysis.get('criteria_met', [])
                    ))
                    
                    criteria_missed = list(set(
                        investment_fit.get('missing_data', []) + 
                        yahoo_analysis.get('criteria_missed', [])
                    ))
                    
                    # Update the investment fit
                    investment_fit['score'] = combined_score
                    investment_fit['criteria_met'] = criteria_met
                    investment_fit['missing_data'] = criteria_missed
                    
                    # Add additional data points
                    investment_fit['yahoo_analysis'] = yahoo_analysis
            
            return investment_fit
            
        except Exception as e:
            logger.error(f"Error analyzing investment fit: {str(e)}")
            return {
                'score': 0, 
                'financials_match': 0, 
                'criteria_met': [], 
                'missing_data': ["Error analyzing investment fit"]
            }
    
    def estimate_recurring_revenue(self, company_data, financials=None):
        """
        Estimate the recurring revenue percentage for a company
        Using ML models to analyze business model and financials
        """
        try:
            # Get financials if not provided
            if not financials and company_data.get('company_name'):
                financials = self.get_company_financials(company_data.get('company_name'))
            
            # Use the financial analyzer to estimate recurring revenue
            return self.financial_analyzer.estimate_recurring_revenue(company_data, financials or {})
            
        except Exception as e:
            logger.error(f"Error estimating recurring revenue: {str(e)}")
            return None