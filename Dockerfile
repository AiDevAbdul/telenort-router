FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    wireguard \
    wireguard-tools \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    iptables \
    netfilter-persistent \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create relay-api directory
WORKDIR /root/relay-api

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN python3 -m venv venv && \
    . venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy relay API script
COPY relay-api.py .

# Enable IP forwarding
RUN echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf

# Create WireGuard config directory
RUN mkdir -p /etc/wireguard && chmod 700 /etc/wireguard

# Generate WireGuard keys
RUN wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key && \
    chmod 600 /etc/wireguard/server_private.key

# Create WireGuard config
RUN echo "[Interface]\nAddress = 10.0.0.1/24\nListenPort = 51820\nPrivateKey = $(cat /etc/wireguard/server_private.key)" > /etc/wireguard/wg0.conf && \
    chmod 600 /etc/wireguard/wg0.conf

# Expose ports
EXPOSE 51820/udp 8000/tcp

# Start script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Enabling IP forwarding..."\n\
sysctl -w net.ipv4.ip_forward=1\n\
\n\
echo "Configuring iptables..."\n\
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\n\
iptables -A FORWARD -i wg0 -o eth0 -j ACCEPT\n\
iptables -A FORWARD -i eth0 -o wg0 -m state --state RELATED,ESTABLISHED -j ACCEPT\n\
\n\
echo "Starting WireGuard..."\n\
wg-quick up wg0\n\
\n\
echo "Starting Relay API..."\n\
. venv/bin/activate\n\
python3 relay-api.py\n\
' > /root/start.sh && chmod +x /root/start.sh

CMD ["/root/start.sh"]
