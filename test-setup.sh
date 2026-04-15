#!/bin/bash
# Quick Test Script - Validates the IP-Relay setup
# Run this after all components are deployed

set -e

RELAY_API_URL="${1:-http://localhost:8000}"
RELAY_VM_IP="${2:-localhost}"
EXIT_AGENT_IP="${3:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

test_count=0
pass_count=0
fail_count=0

test_result() {
    test_count=$((test_count + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC} - $2"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $2"
        fail_count=$((fail_count + 1))
    fi
}

echo -e "${BLUE}=== IP-Relay Testing Suite ===${NC}"
echo "Relay API URL: $RELAY_API_URL"
echo "Relay VM IP: $RELAY_VM_IP"
echo ""

# Test 1: API Health Check
echo -e "${YELLOW}[Test 1]${NC} API Health Check"
RESPONSE=$(curl -s -w "\n%{http_code}" "$RELAY_API_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    test_result 0 "API is responding"
else
    test_result 1 "API health check failed (HTTP $HTTP_CODE)"
fi

# Test 2: Server Config Endpoint
echo -e "${YELLOW}[Test 2]${NC} Server Configuration"
RESPONSE=$(curl -s "$RELAY_API_URL/server-config")
if echo "$RESPONSE" | grep -q "server_public_key"; then
    test_result 0 "Server config retrieved"
    SERVER_PUBLIC_KEY=$(echo "$RESPONSE" | grep -o '"server_public_key":"[^"]*"' | cut -d'"' -f4)
    echo "  Server Public Key: $SERVER_PUBLIC_KEY"
else
    test_result 1 "Failed to retrieve server config"
fi

# Test 3: Generate Client Config
echo -e "${YELLOW}[Test 3]${NC} Generate Client Config"
RESPONSE=$(curl -s -X POST "$RELAY_API_URL/generate-client-config?peer_name=test-client-1")
if echo "$RESPONSE" | grep -q '"config"'; then
    test_result 0 "Client config generated"
    CLIENT_IP=$(echo "$RESPONSE" | grep -o '"allowed_ip":"[^"]*"' | cut -d'"' -f4)
    echo "  Assigned IP: $CLIENT_IP"
else
    test_result 1 "Failed to generate client config"
fi

# Test 4: Generate Second Client Config
echo -e "${YELLOW}[Test 4]${NC} Generate Second Client Config"
RESPONSE=$(curl -s -X POST "$RELAY_API_URL/generate-client-config?peer_name=test-client-2")
if echo "$RESPONSE" | grep -q '"config"'; then
    test_result 0 "Second client config generated"
    CLIENT_IP_2=$(echo "$RESPONSE" | grep -o '"allowed_ip":"[^"]*"' | cut -d'"' -f4)
    echo "  Assigned IP: $CLIENT_IP_2"
else
    test_result 1 "Failed to generate second client config"
fi

# Test 5: List Peers
echo -e "${YELLOW}[Test 5]${NC} List Connected Peers"
RESPONSE=$(curl -s "$RELAY_API_URL/peers")
if echo "$RESPONSE" | grep -q "peers_output"; then
    test_result 0 "Peers endpoint working"
else
    test_result 1 "Failed to list peers"
fi

# Test 6: WireGuard Status
echo -e "${YELLOW}[Test 6]${NC} WireGuard Interface Status"
RESPONSE=$(curl -s "$RELAY_API_URL/status")
if echo "$RESPONSE" | grep -q "status"; then
    test_result 0 "WireGuard status retrieved"
else
    test_result 1 "Failed to get WireGuard status"
fi

# Test 7: Exit Agent Connection (if IP provided)
if [ -n "$EXIT_AGENT_IP" ]; then
    echo -e "${YELLOW}[Test 7]${NC} Exit Agent Connection"
    if ping -c 1 "$EXIT_AGENT_IP" > /dev/null 2>&1; then
        test_result 0 "Exit agent is reachable"
    else
        test_result 1 "Exit agent is not reachable"
    fi
fi

# Summary
echo ""
echo -e "${BLUE}=== Test Summary ===${NC}"
echo "Total Tests: $test_count"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$fail_count${NC}"

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Check the output above.${NC}"
    exit 1
fi
