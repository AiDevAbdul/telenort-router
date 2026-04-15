# Product Specification: "IP-Relay" SaaS

## 1. Project Overview
A SaaS platform that allows users to route their remote device traffic through a specific, whitelisted Static IP (at their home or office) without complex router configurations. The system uses a Cloud Relay (GCP) and a Reverse WireGuard Tunnel to ensure connectivity even behind firewalls.

## 2. Tech Stack
* **Frontend/Backend:** Next.js (App Router), TypeScript, Tailwind CSS.
* **Database:** Neon (Serverless PostgreSQL).
* **Infrastructure:** Google Cloud Platform (GCP) Compute Engine.
* **VPN Protocol:** WireGuard (Core engine).
* **Orchestration:** Python or Node.js (running on the VM to manage configs).

---

## 3. System Architecture


The data flow must follow this path:
1.  **Remote Client** (Laptop/Mobile) $\rightarrow$ **GCP Relay VM**.
2.  **GCP Relay VM** $\rightarrow$ **Exit Agent** (Office/Home PC) via Reverse Tunnel.
3.  **Exit Agent** $\rightarrow$ **Internet** (Target Website sees the Static IP).

---

## 4. Component Requirements

### A. Cloud Relay (GCP VM)
* **OS:** Ubuntu 22.04 LTS.
* **WireGuard Setup:** Must act as the "Hub."
* **Networking:** * Enable IP Forwarding (`net.ipv4.ip_forward=1`).
    * Configure `iptables` or `nftables` for NAT/Masquerading.
* **API/Service:** A small background service (FastAPI or Node) that:
    * Generates WireGuard Key Pairs.
    * Adds/Removes peers dynamically based on DB updates.
    * Provides Status/Heartbeat of tunnels.

### B. The Exit Agent (Office/Home Side)
* **Functionality:** A lightweight script (Bash or Python) that:
    * Installs WireGuard on the host machine (Windows/Linux/Mac).
    * Initiates a **Persistent Keep-alive** connection to the GCP VM (Reverse Tunnel).
    * Acts as the final NAT gateway for the relayed traffic.
* **Verification:** Must send its current Public IP to the Dashboard to verify it matches the user's registered Static IP.

### C. Management Dashboard (Next.js + Neon)
* **User Authentication:** Use NextAuth.js or Clerk.
* **Database Schema (Neon):**
    * `Users`: Profile and Subscription status.
    * `Tunnels`: Relay Server IP, Client Keys, Exit Node Keys, Port assignments.
    * `Status`: Real-time connection status (Active/Inactive).
* **Features:**
    * Input field for the user’s "Target Static IP."
    * "Download Config" button: Generates a `.conf` file or QR code for the remote device.
    * "One-Click Installer": Generates the bash command for the Exit Agent.

---

## 5. Key Technical Logic for the Agent
* **The Routing Rule:** The coding agent must implement specific `PreUp` and `PostUp` rules in the WireGuard config. Traffic coming from the *Remote Client* must be forcefully routed through the *Exit Node* interface on the Relay VM.
* **CGNAT Bypass:** The Exit Agent **must** initiate the handshake to the GCP VM with a `PersistentKeepalive = 25` to maintain the tunnel through the ISP firewall.
* **Security:** Implement SSH Key-based communication between the Next.js backend and the GCP VM to update configurations.

---

## 6. MVP Goals (Phase 1)
1.  Automated provisioning of a WireGuard peer on a running GCP VM.
2.  A functional dashboard to register a Static IP.
3.  A downloadable script for the "Exit Node" that establishes the reverse link.
4.  Connection success: Browsing to `icanhazip.com` on the remote device shows the Office Static IP.