# IP-Relay Testing Solution - Architecture & Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼────────┐
            │  Exit Agent    │  │ Remote Client │
            │ (Home/Office)  │  │  (Laptop/    │
            │                │  │   Mobile)    │
            │ Public IP:     │  │              │
            │ 203.0.113.45   │  │ Public IP:   │
            │                │  │ 203.0.113.45 │
            │ wg-exit        │  │ wg-client    │
            │ 10.0.0.2/24    │  │ 10.0.0.3/24  │
            └───────┬────────┘  └──────┬────────┘
                    │                   │
                    │ UDP:51820         │ UDP:51820
                    │ (Reverse Tunnel)  │ (Direct)
                    │                   │
                    └───────┬───────────┘
                            │
                    ┌───────▼──────────┐
                    │  GCP Relay VM    │
                    │  (Ubuntu 22.04)  │
                    │                  │
                    │ WireGuard Hub    │
                    │ wg0: 10.0.0.1/24 │
                    │ Port: 51820/UDP  │
                    │                  │
                    │ FastAPI Service  │
                    │ Port: 8000/TCP   │
                    │                  │
                    │ IP Forwarding ✓  │
                    │ NAT/Masquerade ✓ │
                    └──────────────────┘
```

## Data Flow

### 1. Exit Agent Connection (Reverse Tunnel)
```
Exit Agent (Home/Office)
    ↓
    └─→ Initiates connection to GCP Relay VM
        └─→ WireGuard handshake
            └─→ Establishes reverse tunnel
                └─→ PersistentKeepalive = 25 (maintains through ISP firewall)
                    └─→ Tunnel established: 10.0.0.2 ↔ 10.0.0.1
```

### 2. Remote Client Connection
```
Remote Client (Laptop/Mobile)
    ↓
    └─→ Requests config from Relay API
        └─→ API generates keypair and assigns IP (10.0.0.3)
            └─→ Client receives config
                └─→ Connects to Relay VM
                    └─→ Tunnel established: 10.0.0.3 ↔ 10.0.0.1
```

### 3. Traffic Routing
```
Remote Client (10.0.0.3)
    ↓
    └─→ All traffic → Relay VM (10.0.0.1)
        └─→ Relay VM routes through Exit Agent (10.0.0.2)
            └─→ Exit Agent sends to Internet
                └─→ Internet sees Exit Agent's Public IP (203.0.113.45)
```

## Component Interaction

```
┌──────────────────────────────────────────────────────────────┐
│                    GCP Relay VM                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ WireGuard Interface (wg0)                              │ │
│  │ - Listens on UDP:51820                                 │ │
│  │ - Tunnel IP: 10.0.0.1/24                               │ │
│  │ - Peers: Exit Agent (10.0.0.2), Clients (10.0.0.3+)   │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▲                                   │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FastAPI Service (Port 8000)                            │ │
│  │ - /health - Health check                               │ │
│  │ - /server-config - Get server public key               │ │
│  │ - /generate-client-config - Create new peer            │ │
│  │ - /peers - List connected peers                        │ │
│  │ - /status - WireGuard status                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ▲                                   │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ System Configuration                                   │ │
│  │ - IP Forwarding: net.ipv4.ip_forward=1                 │ │
│  │ - iptables NAT: POSTROUTING -o eth0 -j MASQUERADE     │ │
│  │ - iptables FORWARD: Allow wg0 ↔ eth0                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Network Topology

```
                    ┌─────────────────┐
                    │   INTERNET      │
                    │ (Public IPs)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  GCP Firewall   │
                    │ Allow UDP:51820 │
                    │ Allow TCP:8000  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────────────────┐
                    │  GCP Relay VM               │
                    │  External IP: 35.123.45.67  │
                    │  Internal IP: 10.128.0.2    │
                    │                             │
                    │  eth0 (External)            │
                    │  wg0 (Tunnel: 10.0.0.1)    │
                    └────────┬────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
        ┌───────────▼──────┐  ┌──────▼──────────┐
        │  Exit Agent      │  │ Remote Client   │
        │  (Home/Office)   │  │ (Laptop/Mobile) │
        │                  │  │                 │
        │ wg-exit:         │  │ wg-client:      │
        │ 10.0.0.2/24      │  │ 10.0.0.3/24     │
        │                  │  │                 │
        │ Public IP:       │  │ Public IP:      │
        │ 203.0.113.45     │  │ 203.0.113.45    │
        │ (ISP)            │  │ (via tunnel)    │
        └──────────────────┘  └─────────────────┘
```

## Tunnel Establishment Sequence

```
Exit Agent                          Relay VM                    Remote Client
    │                                  │                              │
    │─── WireGuard Handshake ────────→ │                              │
    │                                  │                              │
    │ ← Handshake Response ────────────│                              │
    │                                  │                              │
    │─── Keep-Alive (every 25s) ────→ │                              │
    │                                  │                              │
    │                                  │ ← API Request (config) ──────│
    │                                  │                              │
    │                                  │─ Generate Keypair ──────────→│
    │                                  │                              │
    │                                  │ ← WireGuard Handshake ───────│
    │                                  │                              │
    │                                  │─ Handshake Response ────────→│
    │                                  │                              │
    │                                  │ ← Keep-Alive (every 25s) ────│
    │                                  │                              │
    │ ← Traffic (routed) ──────────────┼─ Traffic (routed) ──────────→│
    │                                  │                              │
```

## IP Assignment

```
Tunnel Network: 10.0.0.0/24

10.0.0.1    - Relay VM (WireGuard Hub)
10.0.0.2    - Exit Agent (First peer)
10.0.0.3    - Remote Client 1
10.0.0.4    - Remote Client 2
...
10.0.0.254  - Last available peer
```

## Port Usage

```
Relay VM:
  UDP 51820  - WireGuard tunnel traffic
  TCP 8000   - FastAPI service (config management)

Exit Agent:
  UDP 51820  - WireGuard tunnel traffic (outbound)

Remote Client:
  UDP 51820  - WireGuard tunnel traffic (outbound)
```

## Security Flow

```
1. Exit Agent initiates connection to Relay VM
   └─→ WireGuard encryption (ChaCha20-Poly1305)
       └─→ Tunnel established with PersistentKeepalive

2. Remote Client requests config from Relay API
   └─→ API generates keypair
       └─→ Config sent to client
           └─→ Client connects via WireGuard

3. Traffic routing
   └─→ All traffic encrypted in WireGuard tunnel
       └─→ Exit Agent decrypts and forwards to Internet
           └─→ Internet sees Exit Agent's public IP
```

## Failure Scenarios & Recovery

```
Exit Agent Disconnects:
  └─→ Keep-alive timeout (75 seconds)
      └─→ Relay VM removes peer
          └─→ Remote clients lose connectivity
              └─→ Exit agent reconnects
                  └─→ Tunnel re-established

Remote Client Disconnects:
  └─→ Peer removed from Relay VM
      └─→ No impact on exit agent
          └─→ Client can reconnect with same config

Relay VM Restarts:
  └─→ WireGuard interface down
      └─→ All tunnels drop
          └─→ Exit agent reconnects
              └─→ Remote clients reconnect
```

## Performance Characteristics

```
Latency:
  - Exit Agent ↔ Relay VM: ~10-50ms (depends on GCP region)
  - Remote Client ↔ Relay VM: ~10-50ms
  - Total: ~20-100ms (acceptable for most use cases)

Throughput:
  - Limited by WireGuard encryption/decryption
  - Typical: 100-500 Mbps (depends on CPU)
  - GCP VM: e2-medium should handle 100+ Mbps

Connections:
  - Relay VM can handle 100+ concurrent peers
  - Limited by available IPs in 10.0.0.0/24 (254 max)
  - Can be extended with additional subnets

Keep-Alive:
  - Exit Agent: 25 seconds (maintains through ISP firewall)
  - Remote Client: 25 seconds (maintains through NAT)
```

## Scaling Considerations (Phase 2+)

```
Current Limitations:
  - Single relay VM (no redundancy)
  - Single tunnel network (10.0.0.0/24)
  - No load balancing
  - No geographic distribution

Future Improvements:
  - Multiple relay VMs (different regions)
  - Multiple tunnel networks (10.0.0.0/24, 10.1.0.0/24, etc.)
  - Load balancer for relay VMs
  - Automatic failover
  - Geographic routing
```

## Monitoring Points

```
Relay VM:
  - WireGuard interface status
  - Connected peers count
  - API service health
  - CPU/Memory usage
  - Network throughput

Exit Agent:
  - Tunnel connection status
  - Public IP verification
  - Keep-alive heartbeat
  - Connection uptime

Remote Client:
  - Tunnel connection status
  - Public IP verification
  - Latency to relay VM
  - Packet loss
```
