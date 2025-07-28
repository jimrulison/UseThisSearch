#!/usr/bin/env python3
"""
Focused Admin System Testing
Tests only the admin authentication and analytics functionality
"""

import requests
import json
import time
import os
from datetime import datetime

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

class AdminTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = 30
        
        # Admin credentials for testing
        self.admin_credentials = {
            "email": "JimRulison@gmail.com",
            "password": "JR09mar05"
        }
        self.admin_token = None
        
        self.results = {
            "admin_authentication": {"status": "pending", "details": ""},
            "admin_analytics": {"status": "pending", "details": ""}
        }
        
    def log_test(self, test_name: str, status: str, details: str):
        """Log test results"""
        self.results[test_name] = {"status": status, "details": details}
        print(f"[{status.upper()}] {test_name}: {details}")
        
    def test_admin_authentication(self):
        """Test admin authentication system"""
        print("\n=== Testing Admin Authentication System ===")
        
        try:
            all_passed = True
            details = []
            
            # Test 1: Admin login with correct credentials
            print("Testing admin login with correct credentials...")
            login_response = self.session.post(f"{API_BASE}/admin/login", json=self.admin_credentials)
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                
                # Validate login response structure
                required_fields = ["success", "token", "admin", "expires_at"]
                missing_fields = [field for field in required_fields if field not in login_data]
                
                if not missing_fields:
                    if login_data["success"] and login_data["token"]:
                        self.admin_token = login_data["token"]
                        details.append("✓ Admin login successful with correct credentials")
                        
                        # Validate admin data
                        admin_data = login_data["admin"]
                        if admin_data.get("email") == self.admin_credentials["email"]:
                            details.append("✓ Admin data returned correctly")
                        else:
                            all_passed = False
                            details.append("✗ Admin data incorrect")
                            
                        # Check password hash is not returned
                        if "password_hash" not in admin_data:
                            details.append("✓ Password hash not exposed in response")
                        else:
                            all_passed = False
                            details.append("✗ Password hash exposed in response")
                    else:
                        all_passed = False
                        details.append("✗ Login response indicates failure")
                else:
                    all_passed = False
                    details.append(f"✗ Login response missing fields: {missing_fields}")
            else:
                all_passed = False
                details.append(f"✗ Admin login failed: HTTP {login_response.status_code}")
                try:
                    error_data = login_response.json()
                    details.append(f"Error details: {error_data}")
                except:
                    details.append(f"Response text: {login_response.text}")
            
            # Test 2: Admin login with incorrect credentials
            print("Testing admin login with incorrect credentials...")
            wrong_credentials = {"email": self.admin_credentials["email"], "password": "wrongpassword"}
            wrong_login_response = self.session.post(f"{API_BASE}/admin/login", json=wrong_credentials)
            
            if wrong_login_response.status_code == 401:
                details.append("✓ Incorrect credentials properly rejected")
            else:
                all_passed = False
                details.append(f"✗ Incorrect credentials not rejected: HTTP {wrong_login_response.status_code}")
            
            # Test 3: Token verification (if we have a token)
            if self.admin_token:
                print("Testing token verification...")
                headers = {"Authorization": f"Bearer {self.admin_token}"}
                verify_response = self.session.get(f"{API_BASE}/admin/verify", headers=headers)
                
                if verify_response.status_code == 200:
                    verify_data = verify_response.json()
                    if verify_data.get("success") and "admin" in verify_data:
                        details.append("✓ Token verification working")
                    else:
                        all_passed = False
                        details.append("✗ Token verification response invalid")
                else:
                    all_passed = False
                    details.append(f"✗ Token verification failed: HTTP {verify_response.status_code}")
                
                # Test 4: Admin logout
                print("Testing admin logout...")
                logout_response = self.session.post(f"{API_BASE}/admin/logout", headers=headers)
                
                if logout_response.status_code == 200:
                    logout_data = logout_response.json()
                    if logout_data.get("success"):
                        details.append("✓ Admin logout working")
                        
                        # Test 5: Verify token is invalidated after logout
                        verify_after_logout = self.session.get(f"{API_BASE}/admin/verify", headers=headers)
                        if verify_after_logout.status_code == 401:
                            details.append("✓ Token invalidated after logout")
                        else:
                            all_passed = False
                            details.append(f"✗ Token not invalidated after logout: HTTP {verify_after_logout.status_code}")
                    else:
                        all_passed = False
                        details.append("✗ Logout response indicates failure")
                else:
                    all_passed = False
                    details.append(f"✗ Admin logout failed: HTTP {logout_response.status_code}")
                
                # Re-login for subsequent tests
                print("Re-logging in for subsequent tests...")
                login_response = self.session.post(f"{API_BASE}/admin/login", json=self.admin_credentials)
                if login_response.status_code == 200:
                    self.admin_token = login_response.json()["token"]
            
            # Test 6: Access protected endpoint without token
            print("Testing access without authentication...")
            no_auth_response = self.session.get(f"{API_BASE}/admin/verify")
            if no_auth_response.status_code in [401, 403]:
                details.append("✓ Protected endpoints require authentication")
            else:
                all_passed = False
                details.append(f"✗ Protected endpoints accessible without auth: HTTP {no_auth_response.status_code}")
            
            if all_passed:
                self.log_test("admin_authentication", "pass", 
                            f"Admin authentication system working perfectly. {'; '.join(details)}")
            else:
                self.log_test("admin_authentication", "fail", 
                            f"Admin authentication issues found: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("admin_authentication", "fail", f"Admin authentication test error: {str(e)}")
    
    def test_admin_analytics(self):
        """Test admin analytics API endpoints"""
        print("\n=== Testing Admin Analytics API ===")
        
        try:
            all_passed = True
            details = []
            
            # Ensure we have admin token
            if not self.admin_token:
                print("Getting admin token for analytics testing...")
                login_response = self.session.post(f"{API_BASE}/admin/login", json=self.admin_credentials)
                if login_response.status_code == 200:
                    self.admin_token = login_response.json()["token"]
                else:
                    self.log_test("admin_analytics", "fail", "Could not get admin token for analytics testing")
                    return
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test 1: User lookup by email
            print("Testing user lookup functionality...")
            # First, create some test data by making searches with a test user
            test_user_email = "test_admin_lookup@example.com"
            user_headers = {"X-User-ID": test_user_email}
            
            # Make a few searches to create data
            print("Creating test data...")
            for i in range(3):
                search_data = {"search_term": f"admin test search {i+1}"}
                search_response = self.session.post(f"{API_BASE}/search", json=search_data, headers=user_headers)
                print(f"Search {i+1} status: {search_response.status_code}")
                time.sleep(0.5)
            
            # Wait for background tasks
            time.sleep(3)
            
            # Test user lookup
            lookup_data = {"email": test_user_email}
            lookup_response = self.session.post(f"{API_BASE}/admin/analytics/user-lookup", 
                                              json=lookup_data, headers=headers)
            
            if lookup_response.status_code == 200:
                user_metrics = lookup_response.json()
                
                # Validate user metrics structure
                required_fields = ["user_id", "user_email", "total_searches", "total_companies", 
                                 "recent_searches", "search_history", "companies"]
                missing_fields = [field for field in required_fields if field not in user_metrics]
                
                if not missing_fields:
                    if user_metrics["user_email"] == test_user_email:
                        details.append(f"✓ User lookup working (found user with {user_metrics['total_searches']} searches)")
                    else:
                        all_passed = False
                        details.append(f"✗ User lookup returned wrong user")
                else:
                    all_passed = False
                    details.append(f"✗ User lookup missing fields: {missing_fields}")
            else:
                all_passed = False
                details.append(f"✗ User lookup failed: HTTP {lookup_response.status_code}")
                try:
                    error_data = lookup_response.json()
                    details.append(f"Error details: {error_data}")
                except:
                    details.append(f"Response text: {lookup_response.text}")
            
            # Test 2: Global analytics
            print("Testing global analytics...")
            global_response = self.session.get(f"{API_BASE}/admin/analytics/global-analytics", headers=headers)
            
            if global_response.status_code == 200:
                global_data = global_response.json()
                
                # Validate global analytics structure
                required_fields = ["total_users", "total_searches", "total_companies", 
                                 "active_subscriptions", "usage_stats", "popular_search_terms"]
                missing_fields = [field for field in required_fields if field not in global_data]
                
                if not missing_fields:
                    details.append(f"✓ Global analytics working (users: {global_data['total_users']}, searches: {global_data['total_searches']})")
                    
                    # Check data types
                    if (isinstance(global_data["total_users"], int) and
                        isinstance(global_data["total_searches"], int) and
                        isinstance(global_data["popular_search_terms"], list)):
                        details.append("✓ Global analytics data types correct")
                    else:
                        all_passed = False
                        details.append("✗ Global analytics data types incorrect")
                else:
                    all_passed = False
                    details.append(f"✗ Global analytics missing fields: {missing_fields}")
            else:
                all_passed = False
                details.append(f"✗ Global analytics failed: HTTP {global_response.status_code}")
            
            # Test 3: Admin dashboard
            print("Testing admin dashboard...")
            dashboard_response = self.session.get(f"{API_BASE}/admin/analytics/dashboard", headers=headers)
            
            if dashboard_response.status_code == 200:
                dashboard_data = dashboard_response.json()
                
                # Validate dashboard structure
                required_fields = ["global_analytics", "recent_users", "system_stats"]
                missing_fields = [field for field in required_fields if field not in dashboard_data]
                
                if not missing_fields:
                    details.append("✓ Admin dashboard working")
                    
                    # Check that global_analytics is embedded
                    if "total_users" in dashboard_data["global_analytics"]:
                        details.append("✓ Dashboard includes global analytics")
                    else:
                        all_passed = False
                        details.append("✗ Dashboard missing global analytics data")
                else:
                    all_passed = False
                    details.append(f"✗ Dashboard missing fields: {missing_fields}")
            else:
                all_passed = False
                details.append(f"✗ Admin dashboard failed: HTTP {dashboard_response.status_code}")
            
            # Test 4: All users listing
            print("Testing all users listing...")
            users_response = self.session.get(f"{API_BASE}/admin/analytics/users", headers=headers)
            
            if users_response.status_code == 200:
                users_data = users_response.json()
                
                if isinstance(users_data, list):
                    details.append(f"✓ All users listing working ({len(users_data)} users)")
                    
                    # Check user data structure if we have users
                    if users_data:
                        user = users_data[0]
                        user_fields = ["user_id", "total_searches", "total_companies", "last_activity"]
                        missing_user_fields = [field for field in user_fields if field not in user]
                        
                        if not missing_user_fields:
                            details.append("✓ User data structure correct")
                        else:
                            all_passed = False
                            details.append(f"✗ User data missing fields: {missing_user_fields}")
                else:
                    all_passed = False
                    details.append("✗ Users listing not a list")
            else:
                all_passed = False
                details.append(f"✗ All users listing failed: HTTP {users_response.status_code}")
            
            # Test 5: Authentication required for all endpoints
            print("Testing authentication requirements...")
            no_auth_headers = {}
            auth_test_response = self.session.get(f"{API_BASE}/admin/analytics/global-analytics", headers=no_auth_headers)
            
            if auth_test_response.status_code in [401, 403]:
                details.append("✓ Analytics endpoints require authentication")
            else:
                all_passed = False
                details.append(f"✗ Analytics endpoints accessible without auth: HTTP {auth_test_response.status_code}")
            
            if all_passed:
                self.log_test("admin_analytics", "pass", 
                            f"Admin analytics API working perfectly. {'; '.join(details)}")
            else:
                self.log_test("admin_analytics", "fail", 
                            f"Admin analytics API issues found: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("admin_analytics", "fail", f"Admin analytics API test error: {str(e)}")
    
    def run_admin_tests(self):
        """Run focused admin tests"""
        print(f"Starting Admin System Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print(f"Admin Email: {self.admin_credentials['email']}")
        
        start_time = time.time()
        
        # Run admin tests
        self.test_admin_authentication()
        self.test_admin_analytics()
        
        total_time = time.time() - start_time
        
        # Summary
        print(f"\n{'='*60}")
        print("ADMIN SYSTEM TEST SUMMARY")
        print(f"{'='*60}")
        
        passed = 0
        failed = 0
        
        for test_name, result in self.results.items():
            status_symbol = "✅" if result["status"] == "pass" else "❌" if result["status"] == "fail" else "⏳"
            print(f"{status_symbol} {test_name}: {result['status']}")
            
            if result["status"] == "pass":
                passed += 1
            elif result["status"] == "fail":
                failed += 1
        
        print(f"\nResults: {passed} passed, {failed} failed")
        print(f"Total time: {total_time:.2f} seconds")
        
        if failed == 0:
            print("\n🎉 ALL ADMIN TESTS PASSED!")
            return True
        else:
            print(f"\n⚠️  {failed} ADMIN TESTS FAILED")
            return False

if __name__ == "__main__":
    tester = AdminTester()
    success = tester.run_admin_tests()
    exit(0 if success else 1)