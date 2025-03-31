import requests
import pandas as pd
import numpy as np
import json
import re
import logging
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from contextlib import suppress

logger = logging.getLogger(__name__)

class YahooFinanceHandler:
    """Handles integration with Yahoo Finance API to get financial data for companies"""
    
    def __init__(self):
        """Initialize the Yahoo Finance handler with required headers and URLs"""
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.base_url = "https://finance.yahoo.com"
        self.search_url = "https://query1.finance.yahoo.com/v1/finance/search"
        self.quote_url = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
        self.company_url = "https://finance.yahoo.com/quote/{symbol}/profile"
        self.financials_url = "https://finance.yahoo.com/quote/{symbol}/financials"
        self.balance_sheet_url = "https://finance.yahoo.com/quote/{symbol}/balance-sheet"
        self.cash_flow_url = "https://finance.yahoo.com/quote/{symbol}/cash-flow"
        
        # ML model for predicting missing financials
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.model_trained = False
    
    def search_ticker(self, company_name):
        """Search for a company ticker symbol by name"""
        try:
            params = {
                'q': company_name,
                'quotesCount': 5,
                'newsCount': 0,
                'enableFuzzyQuery': True,
                'enableEnhancedTrivialQuery': True
            }
            
            response = requests.get(self.search_url, headers=self.headers, params=params)
            data = response.json()
            
            if 'quotes' in data and data['quotes']:
                # Filter quotes to get only equity type
                equity_quotes = [quote for quote in data['quotes'] if quote.get('quoteType') == 'EQUITY']
                
                if equity_quotes:
                    # Sort by name similarity to input
                    return equity_quotes[0]['symbol']
            
            # Try alternative method if no results
            return self._search_alternative(company_name)
            
        except Exception as e:
            logger.error(f"Error searching for ticker: {str(e)}")
            return None
    
    def _search_alternative(self, company_name):
        """Alternative search method using company description"""
        try:
            # Clean company name: remove common suffixes like Inc, LLC, etc.
            clean_name = re.sub(r'\s+(Inc\.?|Corp\.?|LLC|Ltd\.?|Limited|Corporation)$', '', company_name, flags=re.IGNORECASE)
            
            # Split into words and take first 2-3 words to improve search
            words = clean_name.split()
            if len(words) > 3:
                search_term = ' '.join(words[:3])
            else:
                search_term = clean_name
                
            url = f"{self.base_url}/lookup?s={search_term}"
            response = requests.get(url, headers=self.headers)
            
            # Parse HTML to extract the first search result
            soup = BeautifulSoup(response.text, 'html.parser')
            results_table = soup.find('table', {'class': 'lookup-table'})
            
            if results_table:
                first_row = results_table.find('tr', {'class': 'data-row'})
                if first_row:
                    ticker_cell = first_row.find('td', {'class': 'data-col0'})
                    if ticker_cell:
                        return ticker_cell.text.strip()
            
            return None
            
        except Exception as e:
            logger.error(f"Error in alternative ticker search: {str(e)}")
            return None
    
    def get_company_financials(self, company_name=None, ticker=None):
        """Gets financial data for a company from Yahoo Finance"""
        try:
            # If no ticker provided, search for it
            if not ticker and company_name:
                ticker = self.search_ticker(company_name)
            
            if not ticker:
                logger.warning(f"No ticker found for {company_name}")
                return None
            
            # Get company profile
            profile = self.get_company_profile(ticker)
            
            # Get stock data
            stock_data = self.get_stock_data(ticker)
            
            # Get financial statements
            income_statement = self.get_income_statement(ticker)
            balance_sheet = self.get_balance_sheet(ticker)
            cash_flow = self.get_cash_flow(ticker)
            
            # Combine all data
            financials = {
                'profile': profile,
                'stock_data': stock_data,
                'income_statement': income_statement,
                'balance_sheet': balance_sheet,
                'cash_flow': cash_flow
            }
            
            # Extract key metrics
            metrics = self.extract_key_metrics(financials)
            
            # Predict missing values if possible
            if self.model_trained:
                metrics = self.predict_missing_metrics(metrics)
                
            return metrics
            
        except Exception as e:
            logger.error(f"Error getting financials for {ticker}: {str(e)}")
            return None
    
    def get_company_profile(self, ticker):
        """Get company profile information"""
        try:
            url = self.company_url.format(symbol=ticker)
            response = requests.get(url, headers=self.headers)
            
            # Parse HTML to extract company profile
            soup = BeautifulSoup(response.text, 'html.parser')
            
            profile = {}
            
            # Company name
            with suppress(Exception):
                profile['name'] = soup.find('h1', {'class': 'D(ib)'}).text.strip()
            
            # Company description
            with suppress(Exception):
                profile['description'] = soup.find('section', {'class': 'quote-sub-section'}).find('p').text.strip()
            
            # Sector and industry
            sector_industry_div = soup.find('div', string=re.compile('Sector|Industry'))
            if sector_industry_div:
                parent = sector_industry_div.parent
                spans = parent.find_all('span')
                if len(spans) >= 4:
                    with suppress(Exception):
                        profile['sector'] = spans[1].text.strip()
                    with suppress(Exception):
                        profile['industry'] = spans[3].text.strip()
            
            # Get number of employees
            employees_div = soup.find('div', string=re.compile('Full Time Employees'))
            if employees_div:
                parent = employees_div.parent
                spans = parent.find_all('span')
                if len(spans) >= 2:
                    with suppress(Exception):
                        employees_text = spans[1].text.strip()
                        profile['employees'] = int(employees_text.replace(',', ''))
            
            return profile
            
        except Exception as e:
            logger.error(f"Error getting company profile for {ticker}: {str(e)}")
            return {}
    
    def get_stock_data(self, ticker):
        """Get stock price data"""
        try:
            # Get data for past 2 years
            end_date = int(datetime.now().timestamp())
            start_date = int((datetime.now() - timedelta(days=730)).timestamp())
            
            params = {
                'period1': start_date,
                'period2': end_date,
                'interval': '1mo',  # Monthly data
                'includePrePost': False,
                'events': 'div,split'
            }
            
            url = self.quote_url.format(symbol=ticker)
            response = requests.get(url, headers=self.headers, params=params)
            data = response.json()
            
            if 'chart' not in data or 'result' not in data['chart'] or not data['chart']['result']:
                return {}
                
            chart_data = data['chart']['result'][0]
            
            # Extract timestamps and closing prices
            timestamps = chart_data.get('timestamp', [])
            close_prices = chart_data.get('indicators', {}).get('quote', [{}])[0].get('close', [])
            
            if not timestamps or not close_prices:
                return {}
                
            # Convert to DataFrame
            df = pd.DataFrame({
                'date': [datetime.fromtimestamp(ts) for ts in timestamps],
                'close': close_prices
            })
            
            # Calculate additional metrics
            df['return'] = df['close'].pct_change()
            
            # Calculate volatility (annualized standard deviation of returns)
            volatility = df['return'].std() * np.sqrt(12)  # Annualized for monthly data
            
            # Calculate momentum (6-month return)
            momentum = df['close'].iloc[-1] / df['close'].iloc[-7] - 1 if len(df) >= 7 else None
            
            # Get current market cap
            market_cap = self._get_market_cap(ticker)
            
            return {
                'current_price': df['close'].iloc[-1] if not df.empty else None,
                'price_52w_high': df['close'].max() if not df.empty else None,
                'price_52w_low': df['close'].min() if not df.empty else None,
                'volatility': volatility,
                'momentum': momentum,
                'market_cap': market_cap
            }
            
        except Exception as e:
            logger.error(f"Error getting stock data for {ticker}: {str(e)}")
            return {}
    
    def _get_market_cap(self, ticker):
        """Get current market cap"""
        try:
            url = f"{self.base_url}/quote/{ticker}"
            response = requests.get(url, headers=self.headers)
            
            # Parse HTML to extract market cap
            soup = BeautifulSoup(response.text, 'html.parser')
            
            market_cap_row = soup.find('td', string='Market Cap')
            if market_cap_row:
                market_cap_value = market_cap_row.find_next_sibling('td').text.strip()
                
                # Convert to numeric (e.g., "1.2T" to 1,200,000,000,000)
                multiplier = 1
                if market_cap_value.endswith('T'):
                    multiplier = 1e12
                    market_cap_value = market_cap_value[:-1]
                elif market_cap_value.endswith('B'):
                    multiplier = 1e9
                    market_cap_value = market_cap_value[:-1]
                elif market_cap_value.endswith('M'):
                    multiplier = 1e6
                    market_cap_value = market_cap_value[:-1]
                
                return float(market_cap_value) * multiplier
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting market cap for {ticker}: {str(e)}")
            return None
    
    def get_income_statement(self, ticker):
        """Get income statement data"""
        try:
            url = self.financials_url.format(symbol=ticker)
            response = requests.get(url, headers=self.headers)
            
            # Parse HTML to extract income statement data
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all rows in the income statement table
            income_statement = {}
            
            # Common financial items to extract
            items = ['Total Revenue', 'Operating Income', 'Net Income', 'EBITDA', 
                   'Gross Profit', 'Operating Expense']
            
            for item in items:
                row = soup.find('div', string=re.compile(f'^{re.escape(item)}$'))
                if row:
                    values = []
                    value_cells = row.parent.parent.find_all('div', {'data-test': 'fin-col'})
                    for cell in value_cells:
                        try:
                            # Parse the value and convert to numeric
                            value_text = cell.text.strip()
                            if value_text == '-':
                                values.append(None)
                            else:
                                # Handle values like "1.2M", "2.5B", etc.
                                multiplier = 1
                                if value_text.endswith('T'):
                                    multiplier = 1e12
                                    value_text = value_text[:-1]
                                elif value_text.endswith('B'):
                                    multiplier = 1e9
                                    value_text = value_text[:-1]
                                elif value_text.endswith('M'):
                                    multiplier = 1e6
                                    value_text = value_text[:-1]
                                elif value_text.endswith('k'):
                                    multiplier = 1e3
                                    value_text = value_text[:-1]
                                
                                values.append(float(value_text.replace(',', '')) * multiplier)
                        except Exception:
                            values.append(None)
                    
                    income_statement[item.lower().replace(' ', '_')] = values
            
            return income_statement
            
        except Exception as e:
            logger.error(f"Error getting income statement for {ticker}: {str(e)}")
            return {}
    
    def get_balance_sheet(self, ticker):
        """Get balance sheet data"""
        try:
            url = self.balance_sheet_url.format(symbol=ticker)
            response = requests.get(url, headers=self.headers)
            
            # Parse HTML to extract balance sheet data
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all rows in the balance sheet table
            balance_sheet = {}
            
            # Common balance sheet items to extract
            items = ['Total Assets', 'Total Liabilities', 'Total Stockholder Equity',
                   'Cash And Cash Equivalents', 'Total Debt']
            
            for item in items:
                row = soup.find('div', string=re.compile(f'^{re.escape(item)}$'))
                if row:
                    values = []
                    value_cells = row.parent.parent.find_all('div', {'data-test': 'fin-col'})
                    for cell in value_cells:
                        try:
                            # Parse the value and convert to numeric
                            value_text = cell.text.strip()
                            if value_text == '-':
                                values.append(None)
                            else:
                                # Handle values like "1.2M", "2.5B", etc.
                                multiplier = 1
                                if value_text.endswith('T'):
                                    multiplier = 1e12
                                    value_text = value_text[:-1]
                                elif value_text.endswith('B'):
                                    multiplier = 1e9
                                    value_text = value_text[:-1]
                                elif value_text.endswith('M'):
                                    multiplier = 1e6
                                    value_text = value_text[:-1]
                                elif value_text.endswith('k'):
                                    multiplier = 1e3
                                    value_text = value_text[:-1]
                                
                                values.append(float(value_text.replace(',', '')) * multiplier)
                        except Exception:
                            values.append(None)
                    
                    balance_sheet[item.lower().replace(' ', '_')] = values
            
            return balance_sheet
            
        except Exception as e:
            logger.error(f"Error getting balance sheet for {ticker}: {str(e)}")
            return {}
    
    def get_cash_flow(self, ticker):
        """Get cash flow statement data"""
        try:
            url = self.cash_flow_url.format(symbol=ticker)
            response = requests.get(url, headers=self.headers)
            
            # Parse HTML to extract cash flow data
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all rows in the cash flow table
            cash_flow = {}
            
            # Common cash flow items to extract
            items = ['Operating Cash Flow', 'Free Cash Flow', 'Capital Expenditure',
                   'Cash Flow From Investing Activities', 'Cash Flow From Financing Activities']
            
            for item in items:
                row = soup.find('div', string=re.compile(f'^{re.escape(item)}$'))
                if row:
                    values = []
                    value_cells = row.parent.parent.find_all('div', {'data-test': 'fin-col'})
                    for cell in value_cells:
                        try:
                            # Parse the value and convert to numeric
                            value_text = cell.text.strip()
                            if value_text == '-':
                                values.append(None)
                            else:
                                # Handle values like "1.2M", "2.5B", etc.
                                multiplier = 1
                                if value_text.endswith('T'):
                                    multiplier = 1e12
                                    value_text = value_text[:-1]
                                elif value_text.endswith('B'):
                                    multiplier = 1e9
                                    value_text = value_text[:-1]
                                elif value_text.endswith('M'):
                                    multiplier = 1e6
                                    value_text = value_text[:-1]
                                elif value_text.endswith('k'):
                                    multiplier = 1e3
                                    value_text = value_text[:-1]
                                
                                values.append(float(value_text.replace(',', '')) * multiplier)
                        except Exception:
                            values.append(None)
                    
                    cash_flow[item.lower().replace(' ', '_')] = values
            
            return cash_flow
            
        except Exception as e:
            logger.error(f"Error getting cash flow for {ticker}: {str(e)}")
            return {}
    
    def extract_key_metrics(self, financials):
        """Extract key financial metrics for investment criteria evaluation"""
        metrics = {}
        
        # Company profile
        profile = financials.get('profile', {})
        metrics['name'] = profile.get('name')
        metrics['sector'] = profile.get('sector')
        metrics['industry'] = profile.get('industry')
        metrics['employees'] = profile.get('employees')
        
        # Stock data
        stock_data = financials.get('stock_data', {})
        metrics['market_cap'] = stock_data.get('market_cap')
        metrics['volatility'] = stock_data.get('volatility')
        
        # Income statement
        income = financials.get('income_statement', {})
        
        # Revenue (most recent)
        total_revenue = income.get('total_revenue', [])
        metrics['annual_revenue'] = total_revenue[0] if total_revenue else None
        
        # Revenue growth (year-over-year)
        if len(total_revenue) >= 2 and total_revenue[0] and total_revenue[1]:
            metrics['revenue_growth'] = (total_revenue[0] / total_revenue[1] - 1) * 100
        
        # EBITDA (most recent)
        ebitda = income.get('ebitda', [])
        metrics['ebitda'] = ebitda[0] if ebitda else None
        
        # EBITDA margin
        if metrics['ebitda'] and metrics['annual_revenue']:
            metrics['ebitda_margin'] = (metrics['ebitda'] / metrics['annual_revenue']) * 100
        
        # Balance sheet metrics
        balance = financials.get('balance_sheet', {})
        
        # Total debt
        total_debt = balance.get('total_debt', [])
        metrics['total_debt'] = total_debt[0] if total_debt else None
        
        # Cash and equivalents
        cash = balance.get('cash_and_cash_equivalents', [])
        metrics['cash'] = cash[0] if cash else None
        
        # Debt-to-EBITDA ratio
        if metrics['total_debt'] and metrics['ebitda'] and metrics['ebitda'] > 0:
            metrics['debt_to_ebitda'] = metrics['total_debt'] / metrics['ebitda']
        
        # Cash flow metrics
        cash_flow = financials.get('cash_flow', {})
        
        # Operating cash flow
        operating_cf = cash_flow.get('operating_cash_flow', [])
        metrics['operating_cash_flow'] = operating_cf[0] if operating_cf else None
        
        # Free cash flow
        free_cf = cash_flow.get('free_cash_flow', [])
        metrics['free_cash_flow'] = free_cf[0] if free_cf else None
        
        # Capital expenditure
        capex = cash_flow.get('capital_expenditure', [])
        metrics['capex'] = capex[0] if capex else None
        
        # Free cash flow growth
        if len(free_cf) >= 2 and free_cf[0] and free_cf[1]:
            metrics['fcf_growth'] = (free_cf[0] / free_cf[1] - 1) * 100
        
        # Cash flow to revenue ratio
        if metrics['free_cash_flow'] and metrics['annual_revenue'] and metrics['annual_revenue'] > 0:
            metrics['fcf_to_revenue'] = (metrics['free_cash_flow'] / metrics['annual_revenue']) * 100
        
        # CapEx to revenue ratio
        if metrics['capex'] and metrics['annual_revenue'] and metrics['annual_revenue'] > 0:
            metrics['capex_to_revenue'] = abs(metrics['capex'] / metrics['annual_revenue']) * 100
        
        # Cash flow consistency (3 years of growing cash flow)
        if len(free_cf) >= 3:
            valid_cf = [cf for cf in free_cf[:3] if cf is not None]
            if len(valid_cf) >= 3:
                metrics['consistent_cash_flow'] = all(valid_cf[i] > valid_cf[i+1] for i in range(len(valid_cf)-1))
        
        # Profitability years
        if total_revenue and ebitda:
            # Count years with positive EBITDA
            positive_years = 0
            for i in range(min(len(total_revenue), len(ebitda))):
                if ebitda[i] and ebitda[i] > 0:
                    positive_years += 1
            metrics['profitability_years'] = positive_years
        
        # Estimate recurring revenue based on industry and volatility
        metrics['recurring_revenue_percentage'] = self._estimate_recurring_revenue(metrics)
        
        # Determine CapEx requirements
        metrics['capex_requirements'] = self._determine_capex_requirements(metrics)
        
        return metrics
    
    def _estimate_recurring_revenue(self, metrics):
        """Estimate recurring revenue percentage based on industry and volatility"""
        industry = metrics.get('industry', '').lower()
        sector = metrics.get('sector', '').lower()
        volatility = metrics.get('volatility')
        
        # Software as a Service typically has high recurring revenue
        if 'software' in industry and ('service' in industry or 'saas' in industry):
            return 80
        
        # Subscription-based businesses
        if any(term in industry for term in ['subscription', 'streaming']):
            return 75
        
        # Business services often have higher recurring revenue
        if 'services' in industry and 'business' in industry:
            return 65
        
        # Technology sector typically has moderate recurring revenue
        if 'technology' in sector:
            return 55
        
        # Healthcare often has good recurring revenue
        if 'health' in sector or 'medical' in industry:
            return 60
        
        # Utilities and telecommunication have steady revenues
        if 'utilities' in sector or 'telecom' in industry:
            return 70
        
        # Financial services can have recurring components
        if 'financial' in sector or 'banking' in industry:
            return 50
        
        # Lower volatility can indicate more recurring revenue
        if volatility is not None:
            if volatility < 0.2:  # Very stable
                return 60
            elif volatility < 0.3:  # Somewhat stable
                return 50
            elif volatility < 0.4:  # Moderate volatility
                return 40
        
        # Default estimate for unknown industries
        return 30
    
    def _determine_capex_requirements(self, metrics):
        """Determine capital expenditure requirements (low, moderate, high)"""
        industry = metrics.get('industry', '').lower()
        sector = metrics.get('sector', '').lower()
        capex_ratio = metrics.get('capex_to_revenue')
        
        # Use CapEx to revenue ratio if available
        if capex_ratio is not None:
            if capex_ratio < 5:
                return 'low'
            elif capex_ratio < 15:
                return 'moderate'
            else:
                return 'high'
        
        # Software and digital services typically have low CapEx
        if 'software' in industry or 'digital' in industry:
            return 'low'
        
        # Technology can vary but often moderate
        if 'technology' in sector and 'hardware' not in industry:
            return 'low'
        
        # Manufacturing and industrial typically have high CapEx
        if 'manufacturing' in industry or 'industrial' in sector:
            return 'high'
        
        # Utilities and telecom have high CapEx
        if 'utilities' in sector or 'telecom' in industry:
            return 'high'
        
        # Energy and materials typically have high CapEx
        if 'energy' in sector or 'materials' in sector:
            return 'high'
        
        # Retail can vary but often moderate
        if 'retail' in industry:
            return 'moderate'
        
        # Services typically have lower CapEx
        if 'services' in industry:
            return 'low'
        
        # Default to moderate for unknown industries
        return 'moderate'
    
    def predict_missing_metrics(self, metrics):
        """Use ML model to predict missing financial metrics"""
        # If missing key values, try to predict them
        if self.model_trained:
            missing_keys = []
            
            # Check for missing key metrics
            if metrics.get('annual_revenue') is None:
                missing_keys.append('annual_revenue')
            if metrics.get('ebitda_margin') is None:
                missing_keys.append('ebitda_margin')
            if metrics.get('free_cash_flow') is None:
                missing_keys.append('free_cash_flow')
            
            if missing_keys:
                # Create feature vector from available metrics
                features = self._create_feature_vector(metrics)
                if features is not None:
                    # Scale features
                    scaled_features = self.scaler.transform([features])
                    
                    # Predict each missing metric
                    for key in missing_keys:
                        # Predict using appropriate model
                        predicted_value = self.model.predict(scaled_features)[0]
                        
                        # Store prediction with uncertainty flag
                        metrics[key] = predicted_value
                        metrics[f'{key}_predicted'] = True
        
        return metrics
    
    def _create_feature_vector(self, metrics):
        """Create a feature vector from available metrics for prediction"""
        # Minimum required features to make a prediction
        required_features = ['sector', 'industry', 'employees', 'market_cap']
        if not all(metrics.get(feature) is not None for feature in required_features):
            return None
        
        # Create feature vector
        features = []
        
        # Encode sector and industry (this would normally use one-hot encoding)
        # For simplicity, we'll just use a few proxy values based on sector
        sector = metrics.get('sector', '').lower()
        if 'technology' in sector:
            features.extend([1, 0, 0, 0, 0])
        elif 'health' in sector:
            features.extend([0, 1, 0, 0, 0])
        elif 'consumer' in sector:
            features.extend([0, 0, 1, 0, 0])
        elif 'financial' in sector:
            features.extend([0, 0, 0, 1, 0])
        elif 'industrial' in sector:
            features.extend([0, 0, 0, 0, 1])
        else:
            features.extend([0, 0, 0, 0, 0])
            
        # Add numeric features
        features.append(metrics.get('employees', 0))
        features.append(metrics.get('market_cap', 0))
        features.append(metrics.get('volatility', 0.3))
        
        # Add available financial metrics
        features.append(metrics.get('annual_revenue', 0))
        features.append(metrics.get('ebitda', 0))
        features.append(metrics.get('total_debt', 0))
        features.append(metrics.get('cash', 0))
        features.append(metrics.get('operating_cash_flow', 0))
        features.append(metrics.get('free_cash_flow', 0))
        features.append(metrics.get('capex', 0))
        
        return features
    
    def analyze_for_investment_criteria(self, metrics):
        """Analyze the financial metrics for investment criteria match"""
        results = {
            'match_score': 0,
            'criteria_met': [],
            'criteria_missed': []
        }
        
        # Define investment criteria
        criteria = {
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
            'capex': {
                'level': 'low'   # Low capital requirements
            }
        }
        
        # Calculate match score (total 100 points)
        max_score = 0
        score = 0
        
        # Revenue range (20 points)
        max_score += 20
        if metrics.get('annual_revenue') is not None:
            revenue = metrics['annual_revenue']
            if criteria['revenue']['min'] <= revenue <= criteria['revenue']['max']:
                score += 20
                results['criteria_met'].append("Revenue in target range ($5-50M)")
            elif revenue < criteria['revenue']['min']:
                # Partial points for close to range
                partial = min(15, int(20 * (revenue / criteria['revenue']['min'])))
                score += partial
                results['criteria_missed'].append("Revenue in target range ($5-50M)")
            else:
                # Partial points for larger companies
                partial = min(10, int(20 * (criteria['revenue']['max'] * 2 / revenue)))
                score += partial
                results['criteria_missed'].append("Revenue in target range ($5-50M)")
        else:
            results['criteria_missed'].append("Revenue in target range ($5-50M)")
        
        # Cash flow range (20 points)
        max_score += 20
        if metrics.get('free_cash_flow') is not None:
            cash_flow = metrics['free_cash_flow']
            if criteria['cash_flow']['min'] <= cash_flow <= criteria['cash_flow']['max']:
                score += 20
                results['criteria_met'].append("Cash flow in target range ($1-5M)")
            elif cash_flow < criteria['cash_flow']['min']:
                # Partial points for close to range
                partial = min(15, int(20 * (cash_flow / criteria['cash_flow']['min'])))
                score += partial
                results['criteria_missed'].append("Cash flow in target range ($1-5M)")
            else:
                # Partial points for larger cash flows
                partial = min(10, int(20 * (criteria['cash_flow']['max'] * 2 / cash_flow)))
                score += partial
                results['criteria_missed'].append("Cash flow in target range ($1-5M)")
        else:
            results['criteria_missed'].append("Cash flow in target range ($1-5M)")
        
        # EBITDA margin (20 points)
        max_score += 20
        if metrics.get('ebitda_margin') is not None:
            ebitda_margin = metrics['ebitda_margin']
            if ebitda_margin >= criteria['ebitda_margin']['min']:
                score += 20
                results['criteria_met'].append("EBITDA margin >15%")
            else:
                # Partial points based on how close to target
                partial = min(15, int(20 * (ebitda_margin / criteria['ebitda_margin']['min'])))
                score += partial
                results['criteria_missed'].append("EBITDA margin >15%")
        else:
            results['criteria_missed'].append("EBITDA margin >15%")
        
        # Recurring revenue (15 points)
        max_score += 15
        if metrics.get('recurring_revenue_percentage') is not None:
            recurring = metrics['recurring_revenue_percentage']
            if recurring >= criteria['recurring_revenue']['min']:
                score += 15
                results['criteria_met'].append("Strong recurring revenue (>50%)")
            else:
                # Partial points based on how close to target
                partial = min(10, int(15 * (recurring / criteria['recurring_revenue']['min'])))
                score += partial
                results['criteria_missed'].append("Strong recurring revenue (>50%)")
        else:
            results['criteria_missed'].append("Strong recurring revenue (>50%)")
        
        # Profitability track record (15 points)
        max_score += 15
        if metrics.get('profitability_years') is not None:
            profit_years = metrics['profitability_years']
            if profit_years >= criteria['profitability_years']['min']:
                score += 15
                results['criteria_met'].append("3+ years of profitability")
            else:
                # Partial points based on years
                partial = int(15 * (profit_years / criteria['profitability_years']['min']))
                score += partial
                results['criteria_missed'].append("3+ years of profitability")
        else:
            results['criteria_missed'].append("3+ years of profitability")
        
        # Capital expenditure requirements (10 points)
        max_score += 10
        if metrics.get('capex_requirements') is not None:
            capex_level = metrics['capex_requirements']
            if capex_level == criteria['capex']['level']:
                score += 10
                results['criteria_met'].append("Low capital expenditure requirements")
            elif capex_level == 'moderate':
                score += 5
                results['criteria_missed'].append("Low capital expenditure requirements")
            else:
                results['criteria_missed'].append("Low capital expenditure requirements")
        else:
            results['criteria_missed'].append("Low capital expenditure requirements")
        
        # Calculate final percentage score
        results['match_score'] = (score / max_score * 100) if max_score > 0 else 0
        
        # Add additional insights
        results['financials'] = {
            'revenue': metrics.get('annual_revenue'),
            'cash_flow': metrics.get('free_cash_flow'),
            'ebitda_margin': metrics.get('ebitda_margin'),
            'recurring_revenue': metrics.get('recurring_revenue_percentage'),
            'profitability_years': metrics.get('profitability_years'),
            'capex_level': metrics.get('capex_requirements')
        }
        
        # Determine match level
        if results['match_score'] >= 80:
            results['match_level'] = 'Strong Match'
        elif results['match_score'] >= 60:
            results['match_level'] = 'Potential Match'
        elif results['match_score'] >= 40:
            results['match_level'] = 'Partial Match'
        else:
            results['match_level'] = 'Weak Match'
        
        return results