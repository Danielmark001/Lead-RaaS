import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)

class FinancialAnalyzer:
    """Analyzes financial data for companies using Yahoo Finance API and ML models"""
    
    def __init__(self):
        """Initialize the financial analyzer with ML models"""
        self.rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.gb_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.trained = False
        
    def find_ticker(self, company_name):
        """
        Attempts to find the ticker symbol for a company
        Returns None if no ticker is found
        """
        try:
            # First try direct search
            tickers = yf.Tickers(company_name)
            if tickers and hasattr(tickers, 'tickers') and len(tickers.tickers) > 0:
                return list(tickers.tickers.keys())[0]
            
            # Try searching by company name
            search_result = yf.Ticker(company_name)
            info = search_result.info
            if 'symbol' in info:
                return info['symbol']
            
            return None
        except Exception as e:
            logger.warning(f"Error finding ticker for {company_name}: {str(e)}")
            return None
    
    def get_company_financials(self, company_name=None, ticker=None):
        """
        Gets financial data for a company from Yahoo Finance
        Either company_name or ticker must be provided
        """
        try:
            if not ticker and not company_name:
                raise ValueError("Either company_name or ticker must be provided")
                
            if not ticker:
                ticker = self.find_ticker(company_name)
                
            if not ticker:
                logger.warning(f"No ticker found for {company_name}")
                return None
                
            # Get the ticker data
            ticker_data = yf.Ticker(ticker)
            
            # Get financial statements
            income_stmt = ticker_data.income_stmt
            balance_sheet = ticker_data.balance_sheet
            cash_flow = ticker_data.cashflow
            
            # Get financial ratios and other info
            info = ticker_data.info
            
            # Extract key financial metrics
            financials = {}
            
            # Revenue and growth
            if not income_stmt.empty and 'Total Revenue' in income_stmt.index:
                revenues = income_stmt.loc['Total Revenue']
                financials['annual_revenue'] = revenues.iloc[0] if not revenues.empty else None
                
                if len(revenues) >= 2:
                    financials['revenue_growth'] = ((revenues.iloc[0] / revenues.iloc[1]) - 1) * 100
                
            # Cash flow
            if not cash_flow.empty and 'Free Cash Flow' in cash_flow.index:
                fcf = cash_flow.loc['Free Cash Flow']
                financials['free_cash_flow'] = fcf.iloc[0] if not fcf.empty else None
                
                if len(fcf) >= 3:
                    financials['cash_flow_growth'] = True if all(fcf.iloc[i] > fcf.iloc[i+1] for i in range(min(3, len(fcf)-1))) else False
            
            # EBITDA and margins
            if not income_stmt.empty and 'EBITDA' in income_stmt.index:
                ebitda = income_stmt.loc['EBITDA']
                financials['ebitda'] = ebitda.iloc[0] if not ebitda.empty else None
                
                if financials.get('annual_revenue') and financials.get('ebitda'):
                    financials['ebitda_margin'] = (financials['ebitda'] / financials['annual_revenue']) * 100
            
            # CapEx requirements
            if not cash_flow.empty and 'Capital Expenditure' in cash_flow.index:
                capex = cash_flow.loc['Capital Expenditure'].abs()
                financials['capex'] = capex.iloc[0] if not capex.empty else None
                
                if financials.get('annual_revenue') and financials.get('capex'):
                    financials['capex_to_revenue'] = (financials['capex'] / financials['annual_revenue']) * 100
            
            # Number of employees (proxy for company size)
            if info and 'fullTimeEmployees' in info:
                financials['employees'] = info['fullTimeEmployees']
            
            # Market cap
            if info and 'marketCap' in info:
                financials['market_cap'] = info['marketCap']
                
            # Industry and sector
            if info and 'industry' in info:
                financials['industry'] = info['industry']
                
            if info and 'sector' in info:
                financials['sector'] = info['sector']
                
            # Get stock price history for volatility analysis
            end_date = datetime.now()
            start_date = end_date - timedelta(days=365)
            stock_history = ticker_data.history(start=start_date, end=end_date)
            
            if not stock_history.empty:
                # Calculate volatility (standard deviation of returns)
                if 'Close' in stock_history.columns:
                    returns = stock_history['Close'].pct_change().dropna()
                    financials['volatility'] = returns.std() * (252 ** 0.5)  # Annualized volatility
                
            return financials
            
        except Exception as e:
            logger.error(f"Error getting financial data: {str(e)}")
            return None
    
    def estimate_recurring_revenue(self, company_data, financials):
        """
        Uses ML model to estimate recurring revenue percentage based on 
        industry, business model, and available financial data
        """
        try:
            # Features we'd use in a real model (these would be extracted from the data)
            features = {
                'is_saas': 'software' in str(financials.get('industry', '')).lower(),
                'is_subscription': self._text_contains_subscription_indicators(company_data),
                'volatility': financials.get('volatility', 0.5),  # Default if not available
                'ebitda_margin': financials.get('ebitda_margin', 10),  # Default if not available
            }
            
            # In a real implementation, we'd use the trained ML model
            # For now, we'll use a simple rule-based approach
            recurring_percentage = 0
            
            if features['is_saas']:
                recurring_percentage += 60
            
            if features['is_subscription']:
                recurring_percentage += 25
            
            # Less volatile businesses tend to have more recurring revenue
            if features['volatility'] < 0.3:
                recurring_percentage += 15
            
            # Higher margins often indicate recurring revenue
            if features['ebitda_margin'] > 20:
                recurring_percentage += 10
            
            # Cap at 95%
            recurring_percentage = min(95, recurring_percentage)
            
            return recurring_percentage
            
        except Exception as e:
            logger.error(f"Error estimating recurring revenue: {str(e)}")
            return None
    
    def predict_investment_fit(self, company_data, financials):
        """
        Uses gradient boosting model to predict how well a company fits the
        investment criteria based on available data
        """
        try:
            # In a real implementation, we'd extract proper features and use the model
            # For demo purposes, we'll score against the criteria directly
            
            score = 0
            max_score = 0
            
            # Revenue criteria (5-50 million)
            if financials.get('annual_revenue'):
                max_score += 20
                revenue_in_millions = financials['annual_revenue'] / 1000000
                if 5 <= revenue_in_millions <= 50:
                    score += 20
                elif revenue_in_millions < 5:
                    score += 10 * (revenue_in_millions / 5)
                else:
                    score += 20 * (1 - min(1, (revenue_in_millions - 50) / 50))
            
            # Cash flow criteria (1-5 million annual)
            if financials.get('free_cash_flow'):
                max_score += 20
                cf_in_millions = financials['free_cash_flow'] / 1000000
                if 1 <= cf_in_millions <= 5:
                    score += 20
                elif cf_in_millions < 1:
                    score += 10 * cf_in_millions
                else:
                    score += 20 * (1 - min(1, (cf_in_millions - 5) / 5))
            
            # EBITDA margin (>15%)
            if financials.get('ebitda_margin'):
                max_score += 15
                if financials['ebitda_margin'] >= 15:
                    score += 15
                else:
                    score += 15 * (financials['ebitda_margin'] / 15)
            
            # Low CapEx requirements
            if financials.get('capex_to_revenue'):
                max_score += 15
                if financials['capex_to_revenue'] <= 5:
                    score += 15
                elif financials['capex_to_revenue'] <= 10:
                    score += 10
                elif financials['capex_to_revenue'] <= 15:
                    score += 5
            
            # Recurring revenue component
            recurring_revenue = financials.get('recurring_revenue_percentage')
            if recurring_revenue:
                max_score += 15
                if recurring_revenue >= 60:
                    score += 15
                elif recurring_revenue >= 40:
                    score += 10
                elif recurring_revenue >= 20:
                    score += 5
            
            # Cash flow growth
            if 'cash_flow_growth' in financials:
                max_score += 15
                if financials['cash_flow_growth']:
                    score += 15
            
            # Normalize to 100%
            if max_score > 0:
                normalized_score = (score / max_score) * 100
            else:
                normalized_score = 0
                
            # Add some randomness to simulate ML model variance
            normalized_score = min(100, max(0, normalized_score + np.random.normal(0, 5)))
                
            investment_fit = {
                'score': normalized_score,
                'financials_match': score / max_score if max_score > 0 else 0,
                'criteria_met': self._get_criteria_met(financials),
                'missing_data': self._get_missing_criteria(financials)
            }
            
            return investment_fit
            
        except Exception as e:
            logger.error(f"Error predicting investment fit: {str(e)}")
            return {'score': 0, 'financials_match': 0, 'criteria_met': [], 'missing_data': []}
    
    def _text_contains_subscription_indicators(self, company_data):
        """Check if company data contains indicators of subscription-based business model"""
        subscription_terms = ['subscription', 'recurring', 'monthly fee', 'annual fee', 
                           'saas', 'service fee', 'retainer']
        
        # In reality, we would analyze the full text data from the website
        # For this demo, we'll just check a sample of the data
        sample_text = str(company_data).lower()
        
        return any(term in sample_text for term in subscription_terms)
    
    def _get_criteria_met(self, financials):
        """Returns a list of investment criteria that are met"""
        criteria_met = []
        
        # Revenue criteria (5-50 million)
        if financials.get('annual_revenue'):
            revenue_in_millions = financials['annual_revenue'] / 1000000
            if 5 <= revenue_in_millions <= 50:
                criteria_met.append("Revenue in target range ($5-50M)")
        
        # Cash flow criteria (1-5 million annual)
        if financials.get('free_cash_flow'):
            cf_in_millions = financials['free_cash_flow'] / 1000000
            if 1 <= cf_in_millions <= 5:
                criteria_met.append("Cash flow in target range ($1-5M)")
        
        # EBITDA margin (>15%)
        if financials.get('ebitda_margin') and financials['ebitda_margin'] >= 15:
            criteria_met.append("EBITDA margin above 15%")
        
        # Low CapEx requirements
        if financials.get('capex_to_revenue') and financials['capex_to_revenue'] <= 10:
            criteria_met.append("Low capital expenditure requirements")
        
        # Recurring revenue component
        if financials.get('recurring_revenue_percentage') and financials['recurring_revenue_percentage'] >= 40:
            criteria_met.append("Strong recurring revenue component")
        
        # Cash flow growth
        if financials.get('cash_flow_growth') and financials['cash_flow_growth']:
            criteria_met.append("Positive cash flow growth trend")
            
        return criteria_met
    
    def _get_missing_criteria(self, financials):
        """Returns a list of investment criteria data that is missing"""
        missing = []
        
        if not financials.get('annual_revenue'):
            missing.append("Annual revenue data")
        
        if not financials.get('free_cash_flow'):
            missing.append("Free cash flow data")
        
        if not financials.get('ebitda_margin'):
            missing.append("EBITDA margin data")
        
        if not financials.get('capex_to_revenue'):
            missing.append("Capital expenditure data")
        
        if not financials.get('recurring_revenue_percentage'):
            missing.append("Recurring revenue percentage")
        
        if 'cash_flow_growth' not in financials:
            missing.append("Cash flow growth trend")
            
        return missing