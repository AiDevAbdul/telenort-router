# Sprint 4: Backend Multi-Region Updates

**Date**: 2026-04-21T12:09:36.993Z
**Status**: Implementation Complete
**Changes**: Multi-region support in relay-api.py

---

## Overview

Sprint 4 backend updates add multi-region awareness to the relay API, enabling:
- Region-aware client configuration generation
- Region metadata and discovery endpoints
- Automatic region selection based on tunnel preferences
- Enhanced logging with region information

---

## Changes to relay-api.py

### 1. Environment Variables

Added multi-region configuration from environment:

```python
RELAY_REGION = os.getenv("RELAY_REGION", "us-central1")
RELAY_API_PORT = int(os.getenv("RELAY_API_PORT", "8000"))
WIREGUARD_PORT = int(os.getenv("WIREGUARD_PORT", "51820"))
```

These are set by Terraform startup script on each relay VM.

### 2. Region Metadata

Added region information dictionary:

```python
REGION_METADATA = {
    "us-central1": {
        "name": "North America (US Central)",
        "country": "USA",
        "latency_target_ms": 50
    },
    "europe-west1": {
        "name": "Europe (West)",
        "country": "Belgium",
        "latency_target_ms": 50
    },
    "asia-southeast1": {
        "name": "Asia-Pacific (Southeast)",
        "country": "Singapore",
        "latency_target_ms": 50
    }
}
```

### 3. New Endpoints

#### GET /regions
Lists all available relay regions:

```bash
curl http://localhost:8000/regions
```

Response:
```json
{
  "regions": [
    {
      "id": "us-central1",
      "name": "North America (US Central)",
      "country": "USA",
      "latency_target_ms": 50
    },
    {
      "id": "europe-west1",
      "name": "Europe (West)",
      "country": "Belgium",
      "latency_target_ms": 50
    },
    {
      "id": "asia-southeast1",
      "name": "Asia-Pacific (Southeast)",
      "country": "Singapore",
      "latency_target_ms": 50
    }
  ]
}
```

#### GET /regions/{region_id}
Get info about a specific region:

```bash
curl http://localhost:8000/regions/us-central1
```

Response:
```json
{
  "id": "us-central1",
  "name": "North America (US Central)",
  "country": "USA",
  "latency_target_ms": 50
}
```

### 4. Updated /server-config Endpoint

Now includes region information:

```bash
curl http://localhost:8000/server-config
```

Response:
```json
{
  "server_public_key": "...",
  "server_ip": "35.192.123.45",
  "listen_port": 51820,
  "server_tunnel_ip": "10.0.0.1",
  "region": "us-central1",
  "region_name": "North America (US Central)",
  "country": "USA",
  "api_port": 8000,
  "timestamp": "2026-04-21T12:09:36.993Z"
}
```

### 5. Enhanced /generate-client-config Endpoint

Now supports region preference:

```bash
# Generate config for preferred region
curl -X POST "http://localhost:8000/generate-client-config?tunnel_id=<id>&peer_name=client&preferred_region=europe-west1" \
  -H "Authorization: Bearer clerk_test_user_123"
```

Response includes region information:
```json
{
  "peer_name": "client",
  "public_key": "...",
  "private_key": "...",
  "allowed_ip": "10.0.0.2/32",
  "config": "[Interface]\n...",
  "region": "europe-west1",
  "server_ip": "35.205.123.45",
  "wireguard_port": 51820,
  "status": "created"
}
```

### 6. Enhanced Logging

Client config generation now logs region information:

```python
log = ConnectionLog(
    tunnel_id=tunnel.id,
    event="client_config_generated",
    details={
        "peer_name": peer_name,
        "region": target_region,
        "allowed_ip": allowed_ip
    }
)
```

---

## How Multi-Region Works

### 1. User Creates Tunnel
```bash
curl -X POST http://localhost:8000/tunnels \
  -H "Authorization: Bearer clerk_test_user_123" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Tunnel", "relay_region": "us-central1"}'
```

### 2. User Generates Client Config
```bash
curl -X POST "http://localhost:8000/generate-client-config?tunnel_id=<id>&preferred_region=europe-west1" \
  -H "Authorization: Bearer clerk_test_user_123"
```

### 3. Load Balancer Routes to Nearest Region
- Global load balancer receives request
- Routes to nearest healthy relay VM
- Client connects through that region's WireGuard interface

### 4. Traffic Flows Through Exit Agent
```
Client → Load Balancer → Relay VM (europe-west1) → Exit Agent → Internet
```

---

## Testing Multi-Region

### Test 1: List Available Regions
```bash
curl http://localhost:8000/regions
```

### Test 2: Get Region Info
```bash
curl http://localhost:8000/regions/asia-southeast1
```

### Test 3: Generate Config for Specific Region
```bash
curl -X POST "http://localhost:8000/generate-client-config?tunnel_id=<tunnel_id>&preferred_region=europe-west1" \
  -H "Authorization: Bearer clerk_test_user_123"
```

### Test 4: Verify Region in Server Config
```bash
curl http://localhost:8000/server-config
# Should show: "region": "us-central1" (or whichever region the VM is in)
```

---

## Environment Variables (Set by Terraform)

Each relay VM receives these environment variables via startup script:

```bash
RELAY_REGION=us-central1          # Region this VM is in
RELAY_API_PORT=8000               # API port
WIREGUARD_PORT=51820              # WireGuard port
DATABASE_URL=postgresql://...     # Neon connection string
CLERK_SECRET_KEY=sk_live_...      # Clerk authentication
ENVIRONMENT=prod                  # Environment name
```

---

## Database Integration

Region information is stored in the `tunnels` table:

```sql
SELECT id, name, relay_region, created_at FROM tunnels;
```

Example:
```
id                                   | name       | relay_region    | created_at
-------------------------------------|------------|-----------------|------------------
3018ab3f-cba0-473a-b59c-afe556865eaa | My Tunnel  | us-central1     | 2026-04-21 12:00:00
```

---

## Failover Logic

If a region goes down:

1. Load balancer health check fails
2. Load balancer removes unhealthy backend
3. New requests route to healthy regions
4. Existing connections may drop (graceful reconnect)

Future enhancement: Implement cross-region failover in client library.

---

## Performance Considerations

- **Latency**: Each region targets < 50ms latency
- **Session Affinity**: Load balancer uses CLIENT_IP for sticky sessions
- **Keep-Alive**: WireGuard keep-alive every 25 seconds maintains connection
- **Database**: Single Neon PostgreSQL instance (shared across all regions)

---

## Files Modified

- `backend/relay-api.py` - Added multi-region support
  - Added environment variable loading
  - Added region metadata
  - Added /regions endpoints
  - Updated /server-config endpoint
  - Enhanced /generate-client-config endpoint
  - Added region-aware logging

---

## Next Steps

1. ✅ Create Terraform infrastructure
2. ✅ Update backend API for multi-region
3. **Next**: Deploy Terraform infrastructure
4. **Next**: Test failover between regions
5. **Next**: Update frontend dashboard for region selection

---

**Status**: Backend updates complete and ready for deployment
**Next**: Deploy Terraform infrastructure with `terraform apply`
