#!/usr/bin/env python3
"""
Focused Multi-User Backend Testing
Tests specifically the multi-user functionality with proper user limit handling
"""

import requests
import json
import time
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
API_BASE = f"{BACKEND_URL}/api"

def test_user_limits_enforcement():
    """Test that user limits are properly enforced"""
    print("\n=== Testing User Limits Enforcement ===")
    
    session = requests.Session()
    session.timeout = 30
    
    test_user = "test_user_marketing_pro"
    headers = {"X-User-ID": test_user}
    
    try:
        # 1. Check current usage limits
        print("1. Checking current usage limits...")
        response = session.get(f"{API_BASE}/billing/usage", headers=headers)
        
        if response.status_code == 200:
            usage_data = response.json()
            print(f"   User limit: {usage_data['user_limit']}")
            print(f"   Current users: {usage_data['current_users']}")
            print(f"   Users remaining: {usage_data['users_remaining']}")
            
            # 2. Get user's companies
            print("2. Getting user's companies...")
            response = session.get(f"{API_BASE}/companies", headers=headers)
            
            if response.status_code == 200:
                companies = response.json()
                if companies:
                    company_id = companies[0]["id"]
                    print(f"   Using company: {companies[0]['name']} (ID: {company_id})")
                    
                    # 3. Try to invite a user (should fail if at limit)
                    print("3. Testing user invitation...")
                    invite_data = {
                        "email": "test_invite_limit@example.com",
                        "role": "member"
                    }
                    
                    response = session.post(f"{API_BASE}/users/companies/{company_id}/users/invite", 
                                          json=invite_data, headers=headers)
                    
                    if response.status_code == 429:
                        error_data = response.json()
                        print("   ✅ User limit enforcement working!")
                        print(f"   ✅ Error message: {error_data.get('detail', {}).get('message', 'Limit exceeded')}")
                        
                        # Check if error details are properly structured
                        if isinstance(error_data.get('detail'), dict):
                            detail = error_data['detail']
                            if 'upgrade_required' in detail and detail['upgrade_required']:
                                print("   ✅ Upgrade requirement flag present")
                            if 'current_count' in detail:
                                print(f"   ✅ Current count provided: {detail['current_count']}")
                        
                        return True
                    elif response.status_code == 200:
                        print("   ❌ User invitation succeeded when it should have failed (user at limit)")
                        return False
                    else:
                        print(f"   ❌ Unexpected response: HTTP {response.status_code}")
                        return False
                else:
                    print("   ❌ No companies found")
                    return False
            else:
                print(f"   ❌ Failed to get companies: HTTP {response.status_code}")
                return False
        else:
            print(f"   ❌ Failed to get usage limits: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Test error: {str(e)}")
        return False

def test_user_management_endpoints():
    """Test all user management endpoints are accessible"""
    print("\n=== Testing User Management Endpoints ===")
    
    session = requests.Session()
    session.timeout = 30
    
    test_user = "test_user_marketing_pro"
    headers = {"X-User-ID": test_user}
    
    results = {}
    
    try:
        # Get companies first
        response = session.get(f"{API_BASE}/companies", headers=headers)
        if response.status_code != 200:
            print("❌ Cannot get companies for endpoint testing")
            return False
        
        companies = response.json()
        if not companies:
            print("❌ No companies found for endpoint testing")
            return False
        
        company_id = companies[0]["id"]
        
        # Test 1: GET /api/users/companies/{company_id}/users
        print("1. Testing GET company users endpoint...")
        response = session.get(f"{API_BASE}/users/companies/{company_id}/users", headers=headers)
        results['get_company_users'] = response.status_code == 200
        print(f"   Status: {response.status_code} {'✅' if results['get_company_users'] else '❌'}")
        
        # Test 2: POST /api/users/companies/{company_id}/users/invite
        print("2. Testing POST invite user endpoint...")
        invite_data = {"email": "endpoint_test@example.com", "role": "member"}
        response = session.post(f"{API_BASE}/users/companies/{company_id}/users/invite", 
                              json=invite_data, headers=headers)
        # Should return 429 (limit exceeded) or 200 (success) - both are valid responses
        results['invite_user'] = response.status_code in [200, 429]
        print(f"   Status: {response.status_code} {'✅' if results['invite_user'] else '❌'}")
        
        # Test 3: POST /api/users/companies/{company_id}/users/{user_id}/remove
        print("3. Testing POST remove user endpoint...")
        response = session.post(f"{API_BASE}/users/companies/{company_id}/users/fake_user/remove", 
                              headers=headers)
        # Should return 404 (user not found) or 400 (cannot remove owner) - both valid
        results['remove_user'] = response.status_code in [400, 404]
        print(f"   Status: {response.status_code} {'✅' if results['remove_user'] else '❌'}")
        
        # Test 4: GET /api/users/users/{user_id}/companies
        print("4. Testing GET user companies endpoint...")
        response = session.get(f"{API_BASE}/users/users/{test_user}/companies", headers=headers)
        results['get_user_companies'] = response.status_code == 200
        print(f"   Status: {response.status_code} {'✅' if results['get_user_companies'] else '❌'}")
        
        # Test 5: GET /api/users/invitations/{token}
        print("5. Testing GET invitation details endpoint...")
        response = session.get(f"{API_BASE}/users/invitations/fake_token")
        # Should return 404 (not found) - this is expected
        results['get_invitation'] = response.status_code == 404
        print(f"   Status: {response.status_code} {'✅' if results['get_invitation'] else '❌'}")
        
        # Test 6: POST /api/users/invitations/{token}/accept
        print("6. Testing POST accept invitation endpoint...")
        response = session.post(f"{API_BASE}/users/invitations/fake_token/accept", headers=headers)
        # Should return 404 (not found) - this is expected
        results['accept_invitation'] = response.status_code == 404
        print(f"   Status: {response.status_code} {'✅' if results['accept_invitation'] else '❌'}")
        
        # Summary
        passed = sum(results.values())
        total = len(results)
        print(f"\nEndpoint accessibility: {passed}/{total} endpoints working correctly")
        
        return passed == total
        
    except Exception as e:
        print(f"❌ Endpoint test error: {str(e)}")
        return False

def test_billing_integration():
    """Test billing integration with user limits"""
    print("\n=== Testing Billing Integration ===")
    
    session = requests.Session()
    session.timeout = 30
    
    test_user = "test_user_marketing_pro"
    headers = {"X-User-ID": test_user}
    
    try:
        # Test 1: GET /api/billing/usage
        print("1. Testing billing usage endpoint...")
        response = session.get(f"{API_BASE}/billing/usage", headers=headers)
        
        if response.status_code == 200:
            usage_data = response.json()
            
            # Check required user fields
            required_fields = ["user_limit", "current_users", "users_remaining"]
            missing_fields = [field for field in required_fields if field not in usage_data]
            
            if not missing_fields:
                print("   ✅ All user limit fields present")
                print(f"   ✅ User limit: {usage_data['user_limit']}")
                print(f"   ✅ Current users: {usage_data['current_users']}")
                print(f"   ✅ Users remaining: {usage_data['users_remaining']}")
                
                # Validate logic
                if usage_data['user_limit'] != -1:  # Not unlimited
                    expected_remaining = usage_data['user_limit'] - usage_data['current_users']
                    if usage_data['users_remaining'] == expected_remaining:
                        print("   ✅ User limit calculation correct")
                        return True
                    else:
                        print(f"   ❌ User limit calculation incorrect (expected: {expected_remaining}, got: {usage_data['users_remaining']})")
                        return False
                else:
                    print("   ✅ Unlimited user plan detected")
                    return True
            else:
                print(f"   ❌ Missing user limit fields: {missing_fields}")
                return False
        else:
            print(f"   ❌ Billing usage endpoint failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Billing integration test error: {str(e)}")
        return False

def main():
    """Run focused multi-user tests"""
    print("Starting Focused Multi-User Backend Testing...")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base: {API_BASE}")
    
    start_time = time.time()
    
    # Run focused tests
    test_results = {
        "user_limits_enforcement": test_user_limits_enforcement(),
        "user_management_endpoints": test_user_management_endpoints(),
        "billing_integration": test_billing_integration()
    }
    
    total_time = time.time() - start_time
    
    # Summary
    print(f"\n{'='*60}")
    print("FOCUSED MULTI-USER TEST SUMMARY")
    print(f"{'='*60}")
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results.items():
        status_symbol = "✅" if result else "❌"
        status_text = "PASS" if result else "FAIL"
        print(f"{status_symbol} {test_name.replace('_', ' ').title()}: {status_text}")
        
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nResults: {passed} passed, {failed} failed")
    print(f"Total testing time: {total_time:.1f} seconds")
    
    return test_results

if __name__ == "__main__":
    results = main()