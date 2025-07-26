#!/usr/bin/env python3
"""
Comprehensive Backend Testing for AnswerThePublic Clone
Tests all API endpoints, Claude AI integration, and database functionality
"""

import requests
import json
import time
import os
from datetime import datetime
from typing import Dict, List, Any

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BACKEND_URL = get_backend_url()
if not BACKEND_URL:
    print("ERROR: Could not get REACT_APP_BACKEND_URL from frontend/.env")
    exit(1)

API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.results = {
            "health_check": {"status": "pending", "details": ""},
            "claude_ai_integration": {"status": "pending", "details": ""},
            "search_api": {"status": "pending", "details": ""},
            "search_history_api": {"status": "pending", "details": ""},
            "search_stats_api": {"status": "pending", "details": ""},
            "database_integration": {"status": "pending", "details": ""},
            "error_handling": {"status": "pending", "details": ""},
            "performance": {"status": "pending", "details": ""},
            # New multi-company tests
            "multi_company_database_schema": {"status": "pending", "details": ""},
            "company_management_api": {"status": "pending", "details": ""},
            "dashboard_statistics_api": {"status": "pending", "details": ""},
            "company_aware_search_integration": {"status": "pending", "details": ""}
        }
        self.session = requests.Session()
        self.session.timeout = 30
        
        # Test users for multi-company testing
        self.test_users = [
            "test_user_marketing_pro",
            "test_user_content_creator", 
            "test_user_seo_specialist"
        ]
        
    def log_test(self, test_name: str, status: str, details: str):
        """Log test results"""
        self.results[test_name] = {"status": status, "details": details}
        print(f"[{status.upper()}] {test_name}: {details}")
        
    def test_health_check(self):
        """Test health check endpoint"""
        print("\n=== Testing Health Check Endpoint ===")
        
        try:
            response = self.session.get(f"{API_BASE}/health")
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_test("health_check", "pass", 
                                f"Health check working - Status: {data['status']}")
                else:
                    self.log_test("health_check", "fail", 
                                f"Invalid health response: {data}")
            else:
                self.log_test("health_check", "fail", 
                            f"Health check failed with status {response.status_code}")
                
        except Exception as e:
            self.log_test("health_check", "fail", f"Health check error: {str(e)}")
    
    def test_claude_ai_integration(self):
        """Test Claude AI integration with various search terms"""
        print("\n=== Testing Claude AI Integration ===")
        
        test_terms = [
            "digital marketing",
            "coffee", 
            "AI",
            "fitness",
            "python programming"
        ]
        
        all_passed = True
        details = []
        
        for term in test_terms:
            try:
                print(f"Testing Claude AI with term: '{term}'")
                
                payload = {"search_term": term}
                start_time = time.time()
                
                response = self.session.post(f"{API_BASE}/search", json=payload)
                processing_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Validate response structure
                    required_fields = ["search_term", "suggestions", "total_suggestions", "processing_time_ms"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        all_passed = False
                        details.append(f"Missing fields for '{term}': {missing_fields}")
                        continue
                    
                    # Validate suggestions structure
                    suggestions = data["suggestions"]
                    required_categories = ["questions", "prepositions", "comparisons", "alphabetical"]
                    missing_categories = [cat for cat in required_categories if cat not in suggestions]
                    
                    if missing_categories:
                        all_passed = False
                        details.append(f"Missing categories for '{term}': {missing_categories}")
                        continue
                    
                    # Check if we got reasonable number of suggestions
                    total_suggestions = sum(len(suggestions[cat]) for cat in required_categories)
                    
                    if total_suggestions < 10:
                        all_passed = False
                        details.append(f"Too few suggestions for '{term}': {total_suggestions}")
                        continue
                    
                    # Check processing time
                    if processing_time > 30000:  # 30 seconds
                        details.append(f"Slow processing for '{term}': {processing_time:.0f}ms")
                    
                    details.append(f"'{term}': {total_suggestions} suggestions in {processing_time:.0f}ms")
                    
                else:
                    all_passed = False
                    details.append(f"Failed for '{term}': HTTP {response.status_code}")
                    
            except Exception as e:
                all_passed = False
                details.append(f"Error testing '{term}': {str(e)}")
        
        if all_passed:
            self.log_test("claude_ai_integration", "pass", 
                        f"Claude AI working for all test terms. {'; '.join(details)}")
        else:
            self.log_test("claude_ai_integration", "fail", 
                        f"Claude AI issues found: {'; '.join(details)}")
    
    def test_search_api_edge_cases(self):
        """Test search API with edge cases"""
        print("\n=== Testing Search API Edge Cases ===")
        
        edge_cases = [
            {"term": "", "expected_status": 400, "description": "empty string"},
            {"term": "   ", "expected_status": 400, "description": "whitespace only"},
            {"term": "a" * 101, "expected_status": 400, "description": "too long (101 chars)"},
            {"term": "test@#$%", "expected_status": 200, "description": "special characters"},
            {"term": "normal term", "expected_status": 200, "description": "normal term"}
        ]
        
        all_passed = True
        details = []
        
        for case in edge_cases:
            try:
                payload = {"search_term": case["term"]}
                response = self.session.post(f"{API_BASE}/search", json=payload)
                
                if response.status_code == case["expected_status"]:
                    details.append(f"✓ {case['description']}: HTTP {response.status_code}")
                else:
                    all_passed = False
                    details.append(f"✗ {case['description']}: Expected {case['expected_status']}, got {response.status_code}")
                    
            except Exception as e:
                all_passed = False
                details.append(f"✗ {case['description']}: Error - {str(e)}")
        
        if all_passed:
            self.log_test("search_api", "pass", f"Search API edge cases handled correctly. {'; '.join(details)}")
        else:
            self.log_test("search_api", "fail", f"Search API edge case issues: {'; '.join(details)}")
    
    def test_search_history_api(self):
        """Test search history API"""
        print("\n=== Testing Search History API ===")
        
        try:
            # First, make a few searches to populate history
            test_terms = ["test history 1", "test history 2", "test history 3"]
            
            for term in test_terms:
                payload = {"search_term": term}
                self.session.post(f"{API_BASE}/search", json=payload)
                time.sleep(0.5)  # Small delay to ensure different timestamps
            
            # Test getting history
            response = self.session.get(f"{API_BASE}/search/history")
            
            if response.status_code == 200:
                history = response.json()
                
                if isinstance(history, list):
                    # Test pagination
                    response_limited = self.session.get(f"{API_BASE}/search/history?limit=2")
                    
                    if response_limited.status_code == 200:
                        limited_history = response_limited.json()
                        
                        if len(limited_history) <= 2:
                            self.log_test("search_history_api", "pass", 
                                        f"History API working. Found {len(history)} total records, pagination working")
                        else:
                            self.log_test("search_history_api", "fail", 
                                        f"Pagination not working. Requested 2, got {len(limited_history)}")
                    else:
                        self.log_test("search_history_api", "fail", 
                                    f"Pagination request failed: HTTP {response_limited.status_code}")
                else:
                    self.log_test("search_history_api", "fail", 
                                f"History response not a list: {type(history)}")
            else:
                self.log_test("search_history_api", "fail", 
                            f"History API failed: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("search_history_api", "fail", f"History API error: {str(e)}")
    
    def test_search_stats_api(self):
        """Test search statistics API"""
        print("\n=== Testing Search Statistics API ===")
        
        try:
            response = self.session.get(f"{API_BASE}/search/stats")
            
            if response.status_code == 200:
                stats = response.json()
                
                required_fields = ["total_searches", "popular_terms", "recent_searches", "average_suggestions_per_search"]
                missing_fields = [field for field in required_fields if field not in stats]
                
                if not missing_fields:
                    # Validate data types
                    if (isinstance(stats["total_searches"], int) and
                        isinstance(stats["popular_terms"], list) and
                        isinstance(stats["recent_searches"], list) and
                        isinstance(stats["average_suggestions_per_search"], (int, float))):
                        
                        self.log_test("search_stats_api", "pass", 
                                    f"Stats API working. Total searches: {stats['total_searches']}, "
                                    f"Popular terms: {len(stats['popular_terms'])}, "
                                    f"Recent searches: {len(stats['recent_searches'])}")
                    else:
                        self.log_test("search_stats_api", "fail", 
                                    f"Stats API data type validation failed")
                else:
                    self.log_test("search_stats_api", "fail", 
                                f"Stats API missing fields: {missing_fields}")
            else:
                self.log_test("search_stats_api", "fail", 
                            f"Stats API failed: HTTP {response.status_code}")
                
        except Exception as e:
            self.log_test("search_stats_api", "fail", f"Stats API error: {str(e)}")
    
    def test_database_integration(self):
        """Test database persistence and data integrity"""
        print("\n=== Testing Database Integration ===")
        
        try:
            # Clear history first
            clear_response = self.session.delete(f"{API_BASE}/search/history")
            
            if clear_response.status_code != 200:
                self.log_test("database_integration", "fail", 
                            f"Could not clear history: HTTP {clear_response.status_code}")
                return
            
            # Make a unique search
            unique_term = f"database_test_{int(time.time())}"
            search_payload = {"search_term": unique_term}
            
            search_response = self.session.post(f"{API_BASE}/search", json=search_payload)
            
            if search_response.status_code != 200:
                self.log_test("database_integration", "fail", 
                            f"Search failed: HTTP {search_response.status_code}")
                return
            
            # Wait a moment for background task to complete
            time.sleep(2)
            
            # Check if it appears in history
            history_response = self.session.get(f"{API_BASE}/search/history")
            
            if history_response.status_code == 200:
                history = history_response.json()
                
                # Look for our unique term
                found = any(item.get("search_term") == unique_term for item in history)
                
                if found:
                    # Check stats
                    stats_response = self.session.get(f"{API_BASE}/search/stats")
                    
                    if stats_response.status_code == 200:
                        stats = stats_response.json()
                        
                        if stats["total_searches"] > 0:
                            self.log_test("database_integration", "pass", 
                                        f"Database integration working. Search stored and retrievable. "
                                        f"Total searches: {stats['total_searches']}")
                        else:
                            self.log_test("database_integration", "fail", 
                                        "Search stored but stats not updated")
                    else:
                        self.log_test("database_integration", "fail", 
                                    f"Stats retrieval failed: HTTP {stats_response.status_code}")
                else:
                    self.log_test("database_integration", "fail", 
                                f"Search term '{unique_term}' not found in history")
            else:
                self.log_test("database_integration", "fail", 
                            f"History retrieval failed: HTTP {history_response.status_code}")
                
        except Exception as e:
            self.log_test("database_integration", "fail", f"Database integration error: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling for various scenarios"""
        print("\n=== Testing Error Handling ===")
        
        error_tests = [
            {
                "name": "Invalid JSON",
                "method": "POST",
                "url": f"{API_BASE}/search",
                "data": "invalid json",
                "headers": {"Content-Type": "application/json"},
                "expected_status": 422
            },
            {
                "name": "Missing field",
                "method": "POST", 
                "url": f"{API_BASE}/search",
                "json": {},
                "expected_status": 422
            },
            {
                "name": "Invalid endpoint",
                "method": "GET",
                "url": f"{API_BASE}/nonexistent",
                "expected_status": 404
            }
        ]
        
        all_passed = True
        details = []
        
        for test in error_tests:
            try:
                if test["method"] == "POST":
                    if "json" in test:
                        response = self.session.post(test["url"], json=test["json"])
                    else:
                        response = self.session.post(
                            test["url"], 
                            data=test["data"], 
                            headers=test.get("headers", {})
                        )
                else:
                    response = self.session.get(test["url"])
                
                if response.status_code == test["expected_status"]:
                    details.append(f"✓ {test['name']}: HTTP {response.status_code}")
                else:
                    all_passed = False
                    details.append(f"✗ {test['name']}: Expected {test['expected_status']}, got {response.status_code}")
                    
            except Exception as e:
                all_passed = False
                details.append(f"✗ {test['name']}: Error - {str(e)}")
        
        if all_passed:
            self.log_test("error_handling", "pass", f"Error handling working correctly. {'; '.join(details)}")
        else:
            self.log_test("error_handling", "fail", f"Error handling issues: {'; '.join(details)}")
    
    def test_multi_company_database_schema(self):
        """Test multi-company database schema and Personal company auto-creation"""
        print("\n=== Testing Multi-Company Database Schema ===")
        
        try:
            all_passed = True
            details = []
            
            for user_id in self.test_users:
                # Test Personal company auto-creation by listing companies
                headers = {"X-User-ID": user_id}
                response = self.session.get(f"{API_BASE}/companies", headers=headers)
                
                if response.status_code == 200:
                    companies = response.json()
                    
                    # Should have at least one company (Personal)
                    if len(companies) >= 1:
                        # Check if Personal company exists
                        personal_company = next((c for c in companies if c.get("is_personal", False)), None)
                        
                        if personal_company:
                            if personal_company["name"] == "Personal" and personal_company["user_id"] == user_id:
                                details.append(f"✓ Personal company auto-created for {user_id}")
                            else:
                                all_passed = False
                                details.append(f"✗ Personal company invalid for {user_id}")
                        else:
                            all_passed = False
                            details.append(f"✗ No Personal company found for {user_id}")
                    else:
                        all_passed = False
                        details.append(f"✗ No companies found for {user_id}")
                else:
                    all_passed = False
                    details.append(f"✗ Failed to get companies for {user_id}: HTTP {response.status_code}")
            
            if all_passed:
                self.log_test("multi_company_database_schema", "pass", 
                            f"Multi-company schema working. {'; '.join(details)}")
            else:
                self.log_test("multi_company_database_schema", "fail", 
                            f"Schema issues found: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("multi_company_database_schema", "fail", f"Database schema test error: {str(e)}")
    
    def test_company_management_api(self):
        """Test company management CRUD operations"""
        print("\n=== Testing Company Management API ===")
        
        try:
            all_passed = True
            details = []
            test_user = self.test_users[0]
            headers = {"X-User-ID": test_user}
            
            # Test 1: Create new company
            company_data = {"name": "Test Marketing Agency"}
            response = self.session.post(f"{API_BASE}/companies", json=company_data, headers=headers)
            
            if response.status_code == 200:
                created_company = response.json()
                company_id = created_company["id"]
                details.append("✓ Company creation successful")
                
                # Test 2: List companies (should include Personal + new company)
                response = self.session.get(f"{API_BASE}/companies", headers=headers)
                if response.status_code == 200:
                    companies = response.json()
                    if len(companies) >= 2:
                        details.append(f"✓ Company listing working ({len(companies)} companies)")
                    else:
                        all_passed = False
                        details.append(f"✗ Expected at least 2 companies, got {len(companies)}")
                else:
                    all_passed = False
                    details.append(f"✗ Company listing failed: HTTP {response.status_code}")
                
                # Test 3: Update company name
                update_data = {"name": "Updated Marketing Agency"}
                response = self.session.put(f"{API_BASE}/companies/{company_id}", json=update_data, headers=headers)
                if response.status_code == 200:
                    updated_company = response.json()
                    if updated_company["name"] == "Updated Marketing Agency":
                        details.append("✓ Company update successful")
                    else:
                        all_passed = False
                        details.append("✗ Company update failed - name not changed")
                else:
                    all_passed = False
                    details.append(f"✗ Company update failed: HTTP {response.status_code}")
                
                # Test 4: Try to create duplicate company name
                duplicate_data = {"name": "Updated Marketing Agency"}
                response = self.session.post(f"{API_BASE}/companies", json=duplicate_data, headers=headers)
                if response.status_code == 400:
                    details.append("✓ Duplicate name validation working")
                else:
                    all_passed = False
                    details.append(f"✗ Duplicate validation failed: HTTP {response.status_code}")
                
                # Test 5: Try to rename Personal company (should fail)
                personal_companies = [c for c in companies if c.get("is_personal", False)]
                if personal_companies:
                    personal_id = personal_companies[0]["id"]
                    rename_data = {"name": "Renamed Personal"}
                    response = self.session.put(f"{API_BASE}/companies/{personal_id}", json=rename_data, headers=headers)
                    if response.status_code == 400:
                        details.append("✓ Personal company rename protection working")
                    else:
                        all_passed = False
                        details.append(f"✗ Personal company rename protection failed: HTTP {response.status_code}")
                
                # Test 6: Delete company
                response = self.session.delete(f"{API_BASE}/companies/{company_id}", headers=headers)
                if response.status_code == 200:
                    details.append("✓ Company deletion successful")
                else:
                    all_passed = False
                    details.append(f"✗ Company deletion failed: HTTP {response.status_code}")
                
                # Test 7: Try to delete Personal company (should fail)
                if personal_companies:
                    personal_id = personal_companies[0]["id"]
                    response = self.session.delete(f"{API_BASE}/companies/{personal_id}", headers=headers)
                    if response.status_code == 400:
                        details.append("✓ Personal company deletion protection working")
                    else:
                        all_passed = False
                        details.append(f"✗ Personal company deletion protection failed: HTTP {response.status_code}")
                
            else:
                all_passed = False
                details.append(f"✗ Company creation failed: HTTP {response.status_code}")
            
            # Test 8: Cross-user access protection
            other_user = self.test_users[1]
            other_headers = {"X-User-ID": other_user}
            
            # Try to access first user's companies
            response = self.session.get(f"{API_BASE}/companies", headers=other_headers)
            if response.status_code == 200:
                other_companies = response.json()
                # Should only see their own companies, not the first user's
                user_isolation = all(c["user_id"] == other_user for c in other_companies)
                if user_isolation:
                    details.append("✓ User isolation working correctly")
                else:
                    all_passed = False
                    details.append("✗ User isolation failed - seeing other user's companies")
            
            if all_passed:
                self.log_test("company_management_api", "pass", 
                            f"Company management API working. {'; '.join(details)}")
            else:
                self.log_test("company_management_api", "fail", 
                            f"Company management issues: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("company_management_api", "fail", f"Company management test error: {str(e)}")
    
    def test_dashboard_statistics_api(self):
        """Test dashboard statistics API for companies"""
        print("\n=== Testing Dashboard Statistics API ===")
        
        try:
            all_passed = True
            details = []
            test_user = self.test_users[0]
            headers = {"X-User-ID": test_user}
            
            # First, get user's companies
            response = self.session.get(f"{API_BASE}/companies", headers=headers)
            if response.status_code != 200:
                self.log_test("dashboard_statistics_api", "fail", "Could not get companies for dashboard test")
                return
            
            companies = response.json()
            if not companies:
                self.log_test("dashboard_statistics_api", "fail", "No companies found for dashboard test")
                return
            
            # Use the first company (likely Personal)
            company_id = companies[0]["id"]
            company_headers = {"X-User-ID": test_user, "X-Company-ID": company_id}
            
            # Make some searches to populate data
            search_terms = ["dashboard test marketing", "dashboard test seo", "dashboard test content"]
            for term in search_terms:
                search_data = {"search_term": term}
                self.session.post(f"{API_BASE}/search", json=search_data, headers=company_headers)
                time.sleep(0.5)  # Small delay
            
            # Wait for background tasks to complete
            time.sleep(2)
            
            # Test 1: Get dashboard stats
            response = self.session.get(f"{API_BASE}/dashboard/{company_id}", headers=headers)
            if response.status_code == 200:
                stats = response.json()
                
                # Validate required fields
                required_fields = ["total_searches", "recent_searches", "popular_terms", "search_trends", "company_info"]
                missing_fields = [field for field in required_fields if field not in stats]
                
                if not missing_fields:
                    details.append("✓ Dashboard stats structure valid")
                    
                    # Check data types
                    if (isinstance(stats["total_searches"], int) and
                        isinstance(stats["recent_searches"], list) and
                        isinstance(stats["popular_terms"], list) and
                        isinstance(stats["search_trends"], list) and
                        isinstance(stats["company_info"], dict)):
                        
                        details.append(f"✓ Dashboard data types correct (total: {stats['total_searches']})")
                        
                        # Check if our test searches appear
                        if stats["total_searches"] >= 3:
                            details.append("✓ Search data populated correctly")
                        else:
                            details.append(f"Minor: Expected at least 3 searches, got {stats['total_searches']}")
                        
                    else:
                        all_passed = False
                        details.append("✗ Dashboard data types invalid")
                else:
                    all_passed = False
                    details.append(f"✗ Dashboard missing fields: {missing_fields}")
            else:
                all_passed = False
                details.append(f"✗ Dashboard stats failed: HTTP {response.status_code}")
            
            # Test 2: Get company-specific search history
            response = self.session.get(f"{API_BASE}/companies/{company_id}/searches", headers=headers)
            if response.status_code == 200:
                searches = response.json()
                if isinstance(searches, list):
                    details.append(f"✓ Company search history working ({len(searches)} records)")
                    
                    # Test pagination
                    response = self.session.get(f"{API_BASE}/companies/{company_id}/searches?limit=2", headers=headers)
                    if response.status_code == 200:
                        limited_searches = response.json()
                        if len(limited_searches) <= 2:
                            details.append("✓ Company search history pagination working")
                        else:
                            all_passed = False
                            details.append("✗ Company search history pagination failed")
                    else:
                        all_passed = False
                        details.append("✗ Company search history pagination request failed")
                else:
                    all_passed = False
                    details.append("✗ Company search history not a list")
            else:
                all_passed = False
                details.append(f"✗ Company search history failed: HTTP {response.status_code}")
            
            # Test 3: Invalid company ID
            response = self.session.get(f"{API_BASE}/dashboard/invalid_company_id", headers=headers)
            if response.status_code == 404:
                details.append("✓ Invalid company ID handling working")
            else:
                all_passed = False
                details.append(f"✗ Invalid company ID handling failed: HTTP {response.status_code}")
            
            if all_passed:
                self.log_test("dashboard_statistics_api", "pass", 
                            f"Dashboard statistics API working. {'; '.join(details)}")
            else:
                self.log_test("dashboard_statistics_api", "fail", 
                            f"Dashboard statistics issues: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("dashboard_statistics_api", "fail", f"Dashboard statistics test error: {str(e)}")
    
    def test_company_aware_search_integration(self):
        """Test company-aware search functionality"""
        print("\n=== Testing Company-Aware Search Integration ===")
        
        try:
            all_passed = True
            details = []
            test_user = self.test_users[0]
            headers = {"X-User-ID": test_user}
            
            # Get user's companies
            response = self.session.get(f"{API_BASE}/companies", headers=headers)
            if response.status_code != 200:
                self.log_test("company_aware_search_integration", "fail", "Could not get companies for search test")
                return
            
            companies = response.json()
            if len(companies) < 1:
                self.log_test("company_aware_search_integration", "fail", "No companies found for search test")
                return
            
            company_id = companies[0]["id"]
            
            # Test 1: Search with company headers
            search_data = {"search_term": "company aware search test"}
            company_headers = {"X-User-ID": test_user, "X-Company-ID": company_id}
            
            response = self.session.post(f"{API_BASE}/search", json=search_data, headers=company_headers)
            if response.status_code == 200:
                search_result = response.json()
                if "suggestions" in search_result and "total_suggestions" in search_result:
                    details.append("✓ Company-aware search working")
                else:
                    all_passed = False
                    details.append("✗ Company-aware search response invalid")
            else:
                all_passed = False
                details.append(f"✗ Company-aware search failed: HTTP {response.status_code}")
            
            # Wait for background task
            time.sleep(2)
            
            # Test 2: Verify search was stored with company association
            response = self.session.get(f"{API_BASE}/companies/{company_id}/searches", headers=headers)
            if response.status_code == 200:
                company_searches = response.json()
                
                # Look for our test search
                found_search = any(s.get("search_term") == "company aware search test" for s in company_searches)
                if found_search:
                    details.append("✓ Search stored with company association")
                else:
                    all_passed = False
                    details.append("✗ Search not found in company history")
            else:
                all_passed = False
                details.append("✗ Could not verify company search storage")
            
            # Test 3: Search without company header (backward compatibility)
            search_data = {"search_term": "backward compatibility test"}
            user_only_headers = {"X-User-ID": test_user}
            
            response = self.session.post(f"{API_BASE}/search", json=search_data, headers=user_only_headers)
            if response.status_code == 200:
                details.append("✓ Backward compatibility working (search without company header)")
            else:
                all_passed = False
                details.append(f"✗ Backward compatibility failed: HTTP {response.status_code}")
            
            # Test 4: Search without any headers (anonymous)
            search_data = {"search_term": "anonymous search test"}
            response = self.session.post(f"{API_BASE}/search", json=search_data)
            if response.status_code == 200:
                details.append("✓ Anonymous search working")
            else:
                all_passed = False
                details.append(f"✗ Anonymous search failed: HTTP {response.status_code}")
            
            # Test 5: Create second company and test isolation
            company_data = {"name": "Test Company 2"}
            response = self.session.post(f"{API_BASE}/companies", json=company_data, headers=headers)
            if response.status_code == 200:
                company2 = response.json()
                company2_id = company2["id"]
                
                # Make search in second company
                search_data = {"search_term": "company isolation test"}
                company2_headers = {"X-User-ID": test_user, "X-Company-ID": company2_id}
                
                response = self.session.post(f"{API_BASE}/search", json=search_data, headers=company2_headers)
                if response.status_code == 200:
                    time.sleep(2)  # Wait for background task
                    
                    # Check that search appears in company2 but not company1
                    response1 = self.session.get(f"{API_BASE}/companies/{company_id}/searches", headers=headers)
                    response2 = self.session.get(f"{API_BASE}/companies/{company2_id}/searches", headers=headers)
                    
                    if response1.status_code == 200 and response2.status_code == 200:
                        searches1 = response1.json()
                        searches2 = response2.json()
                        
                        found_in_company1 = any(s.get("search_term") == "company isolation test" for s in searches1)
                        found_in_company2 = any(s.get("search_term") == "company isolation test" for s in searches2)
                        
                        if not found_in_company1 and found_in_company2:
                            details.append("✓ Company search isolation working")
                        else:
                            all_passed = False
                            details.append(f"✗ Company isolation failed (found in company1: {found_in_company1}, company2: {found_in_company2})")
                    else:
                        all_passed = False
                        details.append("✗ Could not verify company isolation")
                
                # Clean up - delete test company
                self.session.delete(f"{API_BASE}/companies/{company2_id}", headers=headers)
            
            if all_passed:
                self.log_test("company_aware_search_integration", "pass", 
                            f"Company-aware search integration working. {'; '.join(details)}")
            else:
                self.log_test("company_aware_search_integration", "fail", 
                            f"Company-aware search issues: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("company_aware_search_integration", "fail", f"Company-aware search test error: {str(e)}")
    
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"Starting comprehensive backend testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        
        start_time = time.time()
        
        # Run tests in order
        self.test_health_check()
        self.test_claude_ai_integration()
        self.test_search_api_edge_cases()
        self.test_search_history_api()
        self.test_search_stats_api()
        self.test_database_integration()
        self.test_error_handling()
        self.test_performance()
        
        total_time = time.time() - start_time
        
        # Summary
        print(f"\n{'='*60}")
        print("BACKEND TEST SUMMARY")
        print(f"{'='*60}")
        
        passed = 0
        failed = 0
        
        for test_name, result in self.results.items():
            status_symbol = "✅" if result["status"] == "pass" else "❌" if result["status"] == "fail" else "⏳"
            print(f"{status_symbol} {test_name.replace('_', ' ').title()}: {result['status'].upper()}")
            
            if result["status"] == "pass":
                passed += 1
            elif result["status"] == "fail":
                failed += 1
        
        print(f"\nResults: {passed} passed, {failed} failed")
        print(f"Total testing time: {total_time:.1f} seconds")
        
        return self.results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()