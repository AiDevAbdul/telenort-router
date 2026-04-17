FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
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

# Create app data directory
RUN mkdir -p /app/data && chmod 755 /app/data

# Expose ports
EXPOSE 51820/udp 8000/tcp

# Start script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Starting Relay API..."\n\
cd /root/relay-api\n\
. venv/bin/activate\n\
python3 relay-api.py\n\
' > /root/start.sh && chmod +x /root/start.sh

CMD ["/root/start.sh"]
