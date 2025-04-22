#!/bin/bash

# Test script for Angelclass API
# This script tests all the major endpoints of the Angelclass API

# Set base URL
BASE_URL="http://localhost:5000/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section header
print_header() {
  echo -e "\n${YELLOW}========================================"
  echo -e "  $1"
  echo -e "========================================${NC}\n"
}

# Function to test an endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth_token=$4
  local expected_status=$5
  
  echo -e "Testing ${YELLOW}$method $endpoint${NC}"
  
  # Build curl command
  cmd="curl -s -X $method"
  
  # Add auth header if token is provided
  if [ ! -z "$auth_token" ]; then
    cmd="$cmd -H \"Authorization: Bearer $auth_token\""
  fi
  
  # Add content-type header and data if provided
  if [ ! -z "$data" ]; then
    cmd="$cmd -H \"Content-Type: application/json\" -d '$data'"
  fi
  
  # Add URL
  cmd="$cmd $BASE_URL$endpoint"
  
  # Execute command and capture response
  response=$(eval $cmd)
  status=$?
  
  # Check if curl command was successful
  if [ $status -ne 0 ]; then
    echo -e "${RED}Failed to connect to server${NC}"
    return 1
  fi
  
  # Check if response contains error message
  if [[ $response == *"\"message\""* && $response == *"error"* ]]; then
    echo -e "${RED}Error: $response${NC}"
    return 1
  fi
  
  # If we have an expected status, check it
  if [ ! -z "$expected_status" ]; then
    http_status=$(echo "$response" | grep -o "\"status\":[0-9]*" | cut -d':' -f2)
    if [ "$http_status" != "$expected_status" ]; then
      echo -e "${RED}Expected status $expected_status but got $http_status${NC}"
      return 1
    fi
  fi
  
  echo -e "${GREEN}Success${NC}"
  echo "$response" | grep -v "^$" | head -n 5 | sed 's/^/  /'
  
  # Return response for further processing
  echo "$response"
}

# Start the tests
print_header "ANGELCLASS API TESTS"

# Test server is running
print_header "Testing Server Status"
test_endpoint "GET" "/"

# Test user registration
print_header "Testing User Registration"
register_response=$(test_endpoint "POST" "/users/register" '{
  "email": "testuser@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User",
  "role": "client"
}')

# Extract token from registration response
token=$(echo "$register_response" | grep -o "\"token\":\"[^\"]*\"" | cut -d':' -f2 | tr -d '"')

if [ -z "$token" ]; then
  # If registration failed (user might already exist), try login
  print_header "Testing User Login"
  login_response=$(test_endpoint "POST" "/users/login" '{
    "email": "testuser@example.com",
    "password": "password123"
  }')
  
  # Extract token from login response
  token=$(echo "$login_response" | grep -o "\"token\":\"[^\"]*\"" | cut -d':' -f2 | tr -d '"')
fi

if [ -z "$token" ]; then
  echo -e "${RED}Failed to get authentication token. Cannot continue tests.${NC}"
  exit 1
fi

echo -e "Authentication token: ${GREEN}$token${NC}"

# Test get current user
print_header "Testing Get Current User"
user_response=$(test_endpoint "GET" "/users/me" "" "$token")

# Extract user ID
user_id=$(echo "$user_response" | grep -o "\"_id\":\"[^\"]*\"" | cut -d':' -f2 | tr -d '"')
echo -e "User ID: ${GREEN}$user_id${NC}"

# Test client profile creation
print_header "Testing Client Profile Creation"
test_endpoint "POST" "/clients/profile" '{
  "displayName": "TestClient",
  "age": 30,
  "gender": "male",
  "preferences": {
    "companionGender": "female",
    "ageRange": {
      "min": 21,
      "max": 35
    }
  }
}' "$token"

# Test get client profile
print_header "Testing Get Client Profile"
test_endpoint "GET" "/clients/profile" "" "$token"

# Test search functionality
print_header "Testing Search Functionality"
test_endpoint "GET" "/search/companions?minAge=21&maxAge=35&sortBy=newest" "" "$token"

# Test get featured companions
print_header "Testing Get Featured Companions"
test_endpoint "GET" "/search/featured" "" "$token"

# Test get popular companions
print_header "Testing Get Popular Companions"
test_endpoint "GET" "/search/popular" "" "$token"

# Test get available locations
print_header "Testing Get Available Locations"
test_endpoint "GET" "/search/locations" "" "$token"

# Test get available services
print_header "Testing Get Available Services"
test_endpoint "GET" "/search/services" "" "$token"

# Test get subscription plans
print_header "Testing Get Subscription Plans"
test_endpoint "GET" "/payments/subscription-plans" "" "$token"

# Test get current subscription
print_header "Testing Get Current Subscription"
test_endpoint "GET" "/payments/subscriptions/current" "" "$token"

# Test get payment history
print_header "Testing Get Payment History"
test_endpoint "GET" "/payments/history" "" "$token"

# Test get terms of service
print_header "Testing Get Terms of Service"
test_endpoint "GET" "/compliance/terms" "" "$token"

# Test get privacy policy
print_header "Testing Get Privacy Policy"
test_endpoint "GET" "/compliance/privacy" "" "$token"

# Test get user agreement status
print_header "Testing Get User Agreement Status"
test_endpoint "GET" "/compliance/status" "" "$token"

# Test get unread message count
print_header "Testing Get Unread Message Count"
test_endpoint "GET" "/messaging/unread-count" "" "$token"

# Test get conversations
print_header "Testing Get Conversations"
test_endpoint "GET" "/messaging/conversations" "" "$token"

# Test get verification status
print_header "Testing Get Verification Status"
test_endpoint "GET" "/verification/status" "" "$token"

print_header "ALL TESTS COMPLETED"
echo -e "${GREEN}API testing completed successfully!${NC}"
