import json
import logging
import requests
from typing import Dict, Any

class CRMIntegrationManager:
    def __init__(self, config_path='config/crm_config.json'):
        """
        Initialize CRM Integration Manager
        
        Args:
            config_path (str): Path to CRM configuration file
        """
        self.logger = logging.getLogger(__name__)
        
        # Load configuration
        try:
            with open(config_path, 'r') as config_file:
                self.config = json.load(config_file)
        except FileNotFoundError:
            self.logger.error(f"CRM configuration file not found at {config_path}")
            self.config = {}
        
        # Initialize CRM connectors
        self.crm_connectors = {
            'hubspot': HubspotCRMConnector(self.config.get('hubspot', {})),
            'salesforce': SalesforceCRMConnector(self.config.get('salesforce', {}))
        }
    
    def export_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Export lead to configured CRM systems
        
        Args:
            lead_data (dict): Comprehensive lead information
        
        Returns:
            dict: Export results for each CRM
        """
        export_results = {}
        
        # Export to enabled CRMs
        for crm_name in self.config.get('enabled_crms', []):
            try:
                connector = self.crm_connectors.get(crm_name)
                if connector:
                    result = connector.create_lead(lead_data)
                    export_results[crm_name] = result
            except Exception as e:
                self.logger.error(f"CRM export failed for {crm_name}: {str(e)}")
                export_results[crm_name] = {
                    'status': 'error',
                    'message': str(e)
                }
        
        return export_results
    
    def enrich_lead_profile(self, base_profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich lead profile with additional insights
        
        Args:
            base_profile (dict): Initial lead profile
        
        Returns:
            dict: Enriched profile
        """
        enriched_profile = base_profile.copy()
        
        # Add predictive scoring
        enriched_profile['predictive_score'] = self._calculate_predictive_score(base_profile)
        
        # Add recommended actions
        enriched_profile['recommended_actions'] = self._generate_action_recommendations(base_profile)
        
        return enriched_profile
    
    def _calculate_predictive_score(self, profile: Dict[str, Any]) -> float:
        """Calculate advanced predictive lead score"""
        score_components = {
            'tech_readiness': profile.get('ai_readiness_score', 0) * 0.4,
            'growth_potential': self._assess_growth_potential(profile) * 0.3,
            'market_timing': self._assess_market_timing(profile) * 0.3
        }
        
        return sum(score_components.values())
    
    def _assess_growth_potential(self, profile: Dict[str, Any]) -> float:
        """Assess company's growth potential"""
        growth_indicators = profile.get('growth_indicators', [])
        return len(growth_indicators) * 2
    
    def _assess_market_timing(self, profile: Dict[str, Any]) -> float:
        """Assess market timing for lead"""
        industry_timing_scores = {
            'Technology': 8,
            'Financial Services': 7,
            'Healthcare': 6
        }
        industry = profile.get('company_details', {}).get('industry', '')
        return industry_timing_scores.get(industry, 5)
    
    def _generate_action_recommendations(self, profile: Dict[str, Any]) -> list:
        """Generate contextual action recommendations"""
        recommendations = []
        
        ai_readiness = profile.get('ai_readiness_score', 0)
        
        if ai_readiness < 5:
            recommendations.append("Schedule initial AI strategy consultation")
        elif ai_readiness > 8:
            recommendations.append("Propose advanced AI transformation workshop")
        
        return recommendations

class HubspotCRMConnector:
    def __init__(self, config: Dict[str, Any]):
        self.api_key = config.get('api_key')
        self.base_url = config.get('base_url', 'https://api.hubapi.com')
        self.logger = logging.getLogger(__name__)
    
    def create_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a lead in Hubspot
        
        Args:
            lead_data (dict): Lead information
        
        Returns:
            dict: Hubspot API response
        """
        if not self.api_key:
            raise ValueError("Hubspot API key not configured")
        
        try:
            # Prepare lead data for Hubspot
            hubspot_payload = self._transform_lead_data(lead_data)
            
            response = requests.post(
                f"{self.base_url}/contacts/v1/contact",
                headers={
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                },
                json=hubspot_payload
            )
            
            response.raise_for_status()
            return {
                'status': 'success',
                'contact_id': response.json().get('vid')
            }
        
        except requests.RequestException as e:
            self.logger.error(f"Hubspot lead creation failed: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }
    
    def _transform_lead_data(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform internal lead data to Hubspot format
        
        Args:
            lead_data (dict): Original lead data
        
        Returns:
            dict: Hubspot-compatible lead data
        """
        return {
            'properties': [
                {'property': 'email', 'value': lead_data.get('contact_info', {}).get('emails', [''])[0]},
                {'property': 'firstname', 'value': lead_data.get('company_details', {}).get('name', '')},
                {'property': 'company', 'value': lead_data.get('company_details', {}).get('name', '')},
                {'property': 'ai_readiness_score', 'value': str(lead_data.get('ai_readiness_score', 0))},
                {'property': 'industry', 'value': lead_data.get('company_details', {}).get('industry', '')}
            ]
        }

class SalesforceCRMConnector:
    def __init__(self, config: Dict[str, Any]):
        self.client_id = config.get('client_id')
        self.client_secret = config.get('client_secret')
        self.base_url = config.get('base_url', 'https://login.salesforce.com')
        self.logger = logging.getLogger(__name__)
    
    def create_lead(self, lead_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a lead in Salesforce
        
        Args:
            lead_data (dict): Lead information
        
        Returns:
            dict: Salesforce API response
        """
        if not (self.client_id and self.client_secret):
            raise ValueError("Salesforce credentials not configured")
        
        try:
            # Implement Salesforce lead creation logic
            # This would typically involve OAuth authentication and API call
            return {
                'status': 'success',
                'message': 'Salesforce integration placeholder'
            }
        
        except Exception as e:
            self.logger.error(f"Salesforce lead creation failed: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }