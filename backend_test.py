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
            "performance": {"status": "pending", "details": ""}
        }
        self.session = requests.Session()
        self.session.timeout = 30
        
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
    
    def test_performance(self):
        """Test performance and response times"""
        print("\n=== Testing Performance ===")
        
        try:
            # Test multiple concurrent-like requests
            response_times = []
            
            for i in range(3):
                payload = {"search_term": f"performance test {i+1}"}
                start_time = time.time()
                
                response = self.session.post(f"{API_BASE}/search", json=payload)
                
                if response.status_code == 200:
                    response_time = (time.time() - start_time) * 1000
                    response_times.append(response_time)
                    
                    data = response.json()
                    api_reported_time = data.get("processing_time_ms", 0)
                    
                    print(f"Request {i+1}: {response_time:.0f}ms total, {api_reported_time}ms API processing")
                else:
                    self.log_test("performance", "fail", 
                                f"Performance test failed: HTTP {response.status_code}")
                    return
            
            if response_times:
                avg_time = sum(response_times) / len(response_times)
                max_time = max(response_times)
                
                if max_time < 30000:  # 30 seconds
                    self.log_test("performance", "pass", 
                                f"Performance acceptable. Avg: {avg_time:.0f}ms, Max: {max_time:.0f}ms")
                else:
                    self.log_test("performance", "fail", 
                                f"Performance too slow. Avg: {avg_time:.0f}ms, Max: {max_time:.0f}ms")
            else:
                self.log_test("performance", "fail", "No successful performance tests")
                
        except Exception as e:
            self.log_test("performance", "fail", f"Performance test error: {str(e)}")
    
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