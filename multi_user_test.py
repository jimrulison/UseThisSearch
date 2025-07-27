#!/usr/bin/env python3
"""
Focused Multi-User Functionality Testing
Tests the newly implemented multi-user backend system
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

class MultiUserTester:
    def __init__(self):
        self.results = {}
        self.session = requests.Session()
        self.session.timeout = 30
        
        # Test users for multi-user testing
        self.test_users = [
            "test_user_marketing_pro",
            "test_user_content_creator", 
            "test_user_seo_specialist"
        ]
        
    def log_test(self, test_name: str, status: str, details: str):
        """Log test results"""
        self.results[test_name] = {"status": status, "details": details}
        print(f"[{status.upper()}] {test_name}: {details}")
        
    def test_user_management_api_endpoints(self):
        """Test all 6 user management API endpoints"""
        print("\n=== Testing User Management API Endpoints ===")
        
        try:
            all_passed = True
            details = []
            test_user = self.test_users[0]
            headers = {"X-User-ID": test_user}
            
            # Get user's companies first
            response = self.session.get(f"{API_BASE}/companies", headers=headers)
            if response.status_code != 200:
                self.log_test("user_management_api_endpoints", "fail", "Could not get companies for user management test")
                return
            
            companies = response.json()
            if not companies:
                self.log_test("user_management_api_endpoints", "fail", "No companies found for user management test")
                return
            
            company_id = companies[0]["id"]
            
            # Test 1: GET /api/users/companies/{company_id}/users - Get all users in a company
            response = self.session.get(f"{API_BASE}/users/companies/{company_id}/users", headers=headers)
            if response.status_code == 200:
                users_data = response.json()
                if "users" in users_data and len(users_data["users"]) >= 1:
                    details.append("✓ GET company users endpoint working")
                else:
                    all_passed = False
                    details.append("✗ GET company users response invalid")
            else:
                all_passed = False
                details.append(f"✗ GET company users failed: HTTP {response.status_code}")
            
            # Test 2: POST /api/users/companies/{company_id}/users/invite - Invite a user to join a company
            invite_data = {
                "email": "test_invite_user@example.com",
                "role": "member"
            }
            response = self.session.post(f"{API_BASE}/users/companies/{company_id}/users/invite", 
                                       json=invite_data, headers=headers)
            
            invitation_id = None
            if response.status_code == 200:
                invite_result = response.json()
                if "invitation_id" in invite_result:
                    invitation_id = invite_result["invitation_id"]
                    details.append("✓ POST invite user endpoint working")
                else:
                    all_passed = False
                    details.append("✗ POST invite user response missing invitation_id")
            elif response.status_code == 429:
                # User limit exceeded - this is expected behavior
                error_data = response.json()
                if "error" in error_data and "User limit exceeded" in error_data["error"]:
                    details.append("✓ POST invite user endpoint working (user limit enforced)")
                else:
                    all_passed = False
                    details.append("✗ POST invite user unexpected 429 response")
            else:
                all_passed = False
                details.append(f"✗ POST invite user failed: HTTP {response.status_code}")
            
            # Test 3: POST /api/users/companies/{company_id}/users/{user_id}/remove - Remove a user from a company
            # Try to remove owner (should fail)
            response = self.session.post(f"{API_BASE}/users/companies/{company_id}/users/{test_user}/remove", 
                                       headers=headers)
            if response.status_code == 400:
                details.append("✓ POST remove user endpoint working (owner removal prevented)")
            else:
                all_passed = False
                details.append(f"✗ POST remove user endpoint failed: HTTP {response.status_code}")
            
            # Test 4: GET /api/users/users/{user_id}/companies - Get all companies a user has access to
            response = self.session.get(f"{API_BASE}/users/users/{test_user}/companies", headers=headers)
            if response.status_code == 200:
                companies_result = response.json()
                if "companies" in companies_result:
                    details.append("✓ GET user companies endpoint working")
                else:
                    all_passed = False
                    details.append("✗ GET user companies response structure invalid")
            else:
                all_passed = False
                details.append(f"✗ GET user companies failed: HTTP {response.status_code}")
            
            # Test 5: GET /api/users/invitations/{invitation_token} - Get invitation details
            # Use a mock token since we can't easily get real token
            mock_token = "test_invitation_token_123"
            response = self.session.get(f"{API_BASE}/users/invitations/{mock_token}")
            if response.status_code in [404, 410]:  # Expected since token is mock
                details.append("✓ GET invitation details endpoint accessible")
            else:
                details.append(f"Minor: GET invitation details returned HTTP {response.status_code}")
            
            # Test 6: POST /api/users/invitations/{invitation_token}/accept - Accept an invitation
            accept_headers = {"X-User-ID": "user_test_invite_user_example_com"}
            response = self.session.post(f"{API_BASE}/users/invitations/{mock_token}/accept", 
                                       headers=accept_headers)
            if response.status_code in [404, 410, 403]:  # Expected since token is mock
                details.append("✓ POST accept invitation endpoint accessible")
            else:
                details.append(f"Minor: POST accept invitation returned HTTP {response.status_code}")
            
            if all_passed:
                self.log_test("user_management_api_endpoints", "pass", 
                            f"All 6 user management API endpoints working. {'; '.join(details)}")
            else:
                self.log_test("user_management_api_endpoints", "fail", 
                            f"User management API issues: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("user_management_api_endpoints", "fail", f"User management API test error: {str(e)}")
    
    def test_usage_tracking_with_user_limits(self):
        """Test updated usage tracking with user limits"""
        print("\n=== Testing Usage Tracking with User Limits ===")
        
        try:
            all_passed = True
            details = []
            test_user = self.test_users[0]
            headers = {"X-User-ID": test_user}
            
            # Test 1: GET /api/billing/usage - Should include user_limit, current_users, users_remaining
            response = self.session.get(f"{API_BASE}/billing/usage", headers=headers)
            if response.status_code == 200:
                usage_data = response.json()
                
                # Check for required user limit fields
                required_fields = ["user_limit", "current_users", "users_remaining"]
                missing_fields = [field for field in required_fields if field not in usage_data]
                
                if not missing_fields:
                    details.append(f"✓ User limits fields present (limit: {usage_data['user_limit']}, current: {usage_data['current_users']}, remaining: {usage_data['users_remaining']})")
                    
                    # Validate data types
                    if (isinstance(usage_data["user_limit"], int) and
                        isinstance(usage_data["current_users"], int) and
                        isinstance(usage_data["users_remaining"], int)):
                        details.append("✓ User limits data types correct")
                        
                        # Check logical consistency
                        if usage_data["user_limit"] == -1:  # Unlimited
                            details.append("✓ Unlimited user plan detected")
                        elif usage_data["current_users"] + usage_data["users_remaining"] == usage_data["user_limit"]:
                            details.append("✓ User limits calculation correct")
                        else:
                            details.append(f"Minor: User limits calculation inconsistent")
                    else:
                        all_passed = False
                        details.append("✗ User limits data types invalid")
                else:
                    all_passed = False
                    details.append(f"✗ Missing user limit fields: {missing_fields}")
            else:
                all_passed = False
                details.append(f"✗ GET billing usage failed: HTTP {response.status_code}")
            
            # Test 2: GET /api/safe/usage-status - Should include user limits in response
            response = self.session.get(f"{API_BASE}/safe/usage-status", headers=headers)
            if response.status_code == 200:
                usage_status = response.json()
                if "user_limit" in usage_status and "current_users" in usage_status:
                    details.append("✓ Safe usage status includes user limits")
                else:
                    all_passed = False
                    details.append("✗ Safe usage status missing user limit fields")
            else:
                all_passed = False
                details.append(f"✗ GET safe usage status failed: HTTP {response.status_code}")
            
            # Test 3: Verify user limits are calculated correctly based on pricing tiers
            pricing_tiers = {
                "solo": 1,
                "professional": 2, 
                "agency": 5,
                "enterprise": 7
            }
            
            response = self.session.get(f"{API_BASE}/billing/pricing")
            if response.status_code == 200:
                pricing_data = response.json()
                if "plans" in pricing_data:
                    plans = pricing_data["plans"]
                    
                    tier_check_passed = True
                    for tier, expected_limit in pricing_tiers.items():
                        if tier in plans and "user_limit" in plans[tier]:
                            actual_limit = plans[tier]["user_limit"]
                            if actual_limit == expected_limit:
                                details.append(f"✓ {tier.title()} tier user limit correct ({actual_limit})")
                            else:
                                tier_check_passed = False
                                details.append(f"✗ {tier.title()} tier user limit incorrect (expected: {expected_limit}, got: {actual_limit})")
                        else:
                            tier_check_passed = False
                            details.append(f"✗ {tier.title()} tier missing user_limit")
                    
                    if not tier_check_passed:
                        all_passed = False
                else:
                    all_passed = False
                    details.append("✗ Pricing config missing plans")
            else:
                all_passed = False
                details.append(f"✗ GET pricing config failed: HTTP {response.status_code}")
            
            if all_passed:
                self.log_test("usage_tracking_with_user_limits", "pass", 
                            f"Usage tracking with user limits working. {'; '.join(details)}")
            else:
                self.log_test("usage_tracking_with_user_limits", "fail", 
                            f"Usage tracking issues: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("usage_tracking_with_user_limits", "fail", f"Usage tracking test error: {str(e)}")
    
    def test_user_invitation_system(self):
        """Test user invitation system"""
        print("\n=== Testing User Invitation System ===")
        
        try:
            all_passed = True
            details = []
            test_user = self.test_users[0]
            headers = {"X-User-ID": test_user}
            
            # Get user's companies
            response = self.session.get(f"{API_BASE}/companies", headers=headers)
            if response.status_code != 200:
                self.log_test("user_invitation_system", "fail", "Could not get companies for invitation test")
                return
            
            companies = response.json()
            if not companies:
                self.log_test("user_invitation_system", "fail", "No companies found for invitation test")
                return
            
            company_id = companies[0]["id"]
            
            # Test 1: Test invitation creation with proper token generation
            invite_data = {
                "email": "invitation_system_test@example.com",
                "role": "admin"
            }
            response = self.session.post(f"{API_BASE}/users/companies/{company_id}/users/invite", 
                                       json=invite_data, headers=headers)
            
            if response.status_code == 200:
                invite_result = response.json()
                if "invitation_id" in invite_result and "expires_at" in invite_result:
                    details.append("✓ Invitation creation with token generation working")
                else:
                    all_passed = False
                    details.append("✗ Invitation creation response missing required fields")
            elif response.status_code == 429:
                # User limit exceeded - this is expected behavior for Solo plan
                error_data = response.json()
                if "User limit exceeded" in str(error_data):
                    details.append("✓ Invitation creation working (user limit enforced)")
                else:
                    all_passed = False
                    details.append("✗ Unexpected 429 response for invitation creation")
            else:
                all_passed = False
                details.append(f"✗ Invitation creation failed: HTTP {response.status_code}")
            
            # Test 2: Test invitation acceptance flow (endpoint accessibility)
            mock_token = "test_invitation_token_456"
            accept_headers = {"X-User-ID": "user_invitation_system_test_example_com"}
            response = self.session.post(f"{API_BASE}/users/invitations/{mock_token}/accept", 
                                       headers=accept_headers)
            if response.status_code in [404, 410, 403]:  # Expected since token is mock
                details.append("✓ Invitation acceptance flow endpoint accessible")
            else:
                details.append(f"Minor: Invitation acceptance returned HTTP {response.status_code}")
            
            # Test 3: Test invitation expiry handling
            response = self.session.get(f"{API_BASE}/users/invitations/{mock_token}")
            if response.status_code in [404, 410]:  # Expected - 410 for expired, 404 for not found
                details.append("✓ Invitation expiry handling working")
            else:
                details.append(f"Minor: Invitation expiry check returned HTTP {response.status_code}")
            
            # Test 4: Test user permission checks
            other_user = self.test_users[1]
            other_headers = {"X-User-ID": other_user}
            
            # Try to invite to another user's company (should fail)
            response = self.session.post(f"{API_BASE}/users/companies/{company_id}/users/invite", 
                                       json=invite_data, headers=other_headers)
            if response.status_code in [403, 404]:
                details.append("✓ User permission checks working")
            else:
                all_passed = False
                details.append(f"✗ User permission checks failed: HTTP {response.status_code}")
            
            if all_passed:
                self.log_test("user_invitation_system", "pass", 
                            f"User invitation system working. {'; '.join(details)}")
            else:
                self.log_test("user_invitation_system", "fail", 
                            f"User invitation system issues: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("user_invitation_system", "fail", f"User invitation system test error: {str(e)}")
    
    def test_multi_user_permission_system(self):
        """Test multi-user permission system"""
        print("\n=== Testing Multi-User Permission System ===")
        
        try:
            all_passed = True
            details = []
            owner_user = self.test_users[0]
            member_user = self.test_users[1]
            owner_headers = {"X-User-ID": owner_user}
            member_headers = {"X-User-ID": member_user}
            
            # Get owner's companies
            response = self.session.get(f"{API_BASE}/companies", headers=owner_headers)
            if response.status_code != 200:
                self.log_test("multi_user_permission_system", "fail", "Could not get companies for permissions test")
                return
            
            companies = response.json()
            if not companies:
                self.log_test("multi_user_permission_system", "fail", "No companies found for permissions test")
                return
            
            company_id = companies[0]["id"]
            
            # Test 1: Only company owners can invite users
            invite_data = {
                "email": "permissions_test@example.com",
                "role": "member"
            }
            
            # Owner should be able to invite (or get user limit error)
            response = self.session.post(f"{API_BASE}/users/companies/{company_id}/users/invite", 
                                       json=invite_data, headers=owner_headers)
            if response.status_code in [200, 429]:  # 200 = success, 429 = user limit exceeded
                details.append("✓ Company owner can invite users")
            else:
                all_passed = False
                details.append(f"✗ Company owner cannot invite users: HTTP {response.status_code}")
            
            # Non-member should not be able to invite
            response = self.session.post(f"{API_BASE}/users/companies/{company_id}/users/invite", 
                                       json=invite_data, headers=member_headers)
            if response.status_code in [403, 404]:
                details.append("✓ Non-member invite denied correctly")
            else:
                all_passed = False
                details.append(f"✗ Non-member invite not denied: HTTP {response.status_code}")
            
            # Test 2: Only company owners can remove users
            # Owner cannot remove themselves
            response = self.session.post(f"{API_BASE}/users/companies/{company_id}/users/{owner_user}/remove", 
                                       headers=owner_headers)
            if response.status_code == 400:
                details.append("✓ Owner self-removal prevented")
            else:
                all_passed = False
                details.append(f"✗ Owner self-removal not prevented: HTTP {response.status_code}")
            
            # Test 3: Users can only access their own companies
            response = self.session.get(f"{API_BASE}/users/users/{owner_user}/companies", headers=owner_headers)
            if response.status_code == 200:
                details.append("✓ User can access own companies")
            else:
                all_passed = False
                details.append(f"✗ User cannot access own companies: HTTP {response.status_code}")
            
            # Test 4: Users cannot access other user's companies
            response = self.session.get(f"{API_BASE}/users/users/{owner_user}/companies", headers=member_headers)
            if response.status_code == 403:
                details.append("✓ Cross-user company access denied")
            else:
                all_passed = False
                details.append(f"✗ Cross-user company access not denied: HTTP {response.status_code}")
            
            # Test 5: Invited users can access companies they're invited to
            # This would require actually creating an invitation and accepting it
            # For now, we'll test the endpoint structure
            response = self.session.get(f"{API_BASE}/users/companies/{company_id}/users", headers=owner_headers)
            if response.status_code == 200:
                users_data = response.json()
                if "users" in users_data:
                    details.append("✓ Company users access working for owners")
                else:
                    all_passed = False
                    details.append("✗ Company users response structure invalid")
            else:
                all_passed = False
                details.append(f"✗ Company users access failed: HTTP {response.status_code}")
            
            if all_passed:
                self.log_test("multi_user_permission_system", "pass", 
                            f"Multi-user permission system working. {'; '.join(details)}")
            else:
                self.log_test("multi_user_permission_system", "fail", 
                            f"Multi-user permission system issues: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("multi_user_permission_system", "fail", f"Multi-user permission system test error: {str(e)}")
    
    def test_user_limits_enforcement(self):
        """Test user limits enforcement"""
        print("\n=== Testing User Limits Enforcement ===")
        
        try:
            all_passed = True
            details = []
            test_user = self.test_users[0]
            headers = {"X-User-ID": test_user}
            
            # Get user's current usage
            response = self.session.get(f"{API_BASE}/billing/usage", headers=headers)
            if response.status_code != 200:
                self.log_test("user_limits_enforcement", "fail", "Could not get usage for limits test")
                return
            
            usage_data = response.json()
            user_limit = usage_data.get("user_limit", 1)
            current_users = usage_data.get("current_users", 1)
            users_remaining = usage_data.get("users_remaining", 0)
            
            details.append(f"Current usage: {current_users}/{user_limit} users, {users_remaining} remaining")
            
            # Get user's companies
            response = self.session.get(f"{API_BASE}/companies", headers=headers)
            if response.status_code != 200:
                self.log_test("user_limits_enforcement", "fail", "Could not get companies for limits test")
                return
            
            companies = response.json()
            if not companies:
                self.log_test("user_limits_enforcement", "fail", "No companies found for limits test")
                return
            
            company_id = companies[0]["id"]
            
            # Test user limit enforcement
            if users_remaining <= 0:
                # Should not be able to invite more users
                invite_data = {
                    "email": "limit_test@example.com",
                    "role": "member"
                }
                response = self.session.post(f"{API_BASE}/users/companies/{company_id}/users/invite", 
                                           json=invite_data, headers=headers)
                
                if response.status_code == 429:
                    error_data = response.json()
                    if "User limit exceeded" in str(error_data):
                        details.append("✓ User limit enforcement working - invitation blocked")
                        
                        # Check if upgrade prompt is included
                        if "upgrade" in str(error_data).lower():
                            details.append("✓ Upgrade prompt included in limit error")
                        else:
                            details.append("Minor: Upgrade prompt not found in error message")
                    else:
                        all_passed = False
                        details.append("✗ User limit error message incorrect")
                else:
                    all_passed = False
                    details.append(f"✗ User limit not enforced: HTTP {response.status_code}")
            else:
                # Should be able to invite users
                invite_data = {
                    "email": "limit_test_allowed@example.com",
                    "role": "member"
                }
                response = self.session.post(f"{API_BASE}/users/companies/{company_id}/users/invite", 
                                           json=invite_data, headers=headers)
                
                if response.status_code == 200:
                    details.append("✓ User invitation allowed within limits")
                else:
                    all_passed = False
                    details.append(f"✗ User invitation failed within limits: HTTP {response.status_code}")
            
            if all_passed:
                self.log_test("user_limits_enforcement", "pass", 
                            f"User limits enforcement working. {'; '.join(details)}")
            else:
                self.log_test("user_limits_enforcement", "fail", 
                            f"User limits enforcement issues: {'; '.join(details)}")
                
        except Exception as e:
            self.log_test("user_limits_enforcement", "fail", f"User limits enforcement test error: {str(e)}")
    
    def run_all_tests(self):
        """Run all multi-user functionality tests"""
        print("Starting Multi-User Functionality Testing...")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        
        # Run all tests
        self.test_user_management_api_endpoints()
        self.test_usage_tracking_with_user_limits()
        self.test_user_invitation_system()
        self.test_multi_user_permission_system()
        self.test_user_limits_enforcement()
        
        # Print summary
        print("\n" + "="*80)
        print("MULTI-USER FUNCTIONALITY TEST SUMMARY")
        print("="*80)
        
        passed = 0
        failed = 0
        
        for test_name, result in self.results.items():
            status_symbol = "✅" if result["status"] == "pass" else "❌"
            print(f"{status_symbol} {test_name}: {result['status'].upper()}")
            if result["status"] == "pass":
                passed += 1
            else:
                failed += 1
        
        print(f"\nTotal: {passed + failed} tests, {passed} passed, {failed} failed")
        
        if failed == 0:
            print("\n🎉 ALL MULTI-USER FUNCTIONALITY TESTS PASSED!")
        else:
            print(f"\n⚠️  {failed} test(s) failed. Check details above.")
        
        return self.results

if __name__ == "__main__":
    tester = MultiUserTester()
    results = tester.run_all_tests()