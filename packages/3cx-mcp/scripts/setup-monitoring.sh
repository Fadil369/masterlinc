#!/bin/bash

###############################################################################
# Setup Monitoring and Analytics for 3CX MCP Server
###############################################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}📊 Setting up monitoring and analytics${NC}"

# Create Prometheus config
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: '3cx-mcp-server'
    static_configs:
      - targets: ['3cx-mcp:3000']
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
EOF

# Create Grafana dashboard
cat > grafana-dashboard.json << 'EOF'
{
  "dashboard": {
    "title": "3CX MCP Server Dashboard",
    "panels": [
      {
        "title": "Active Calls",
        "type": "graph",
        "targets": [{"expr": "3cx_active_calls_total"}]
      },
      {
        "title": "Call Volume (24h)",
        "type": "graph",
        "targets": [{"expr": "rate(3cx_calls_total[24h])"}]
      },
      {
        "title": "Agent Availability",
        "type": "stat",
        "targets": [{"expr": "3cx_agents_available"}]
      },
      {
        "title": "Average Call Duration",
        "type": "gauge",
        "targets": [{"expr": "avg(3cx_call_duration_seconds)"}]
      }
    ]
  }
}
EOF

echo -e "${GREEN}✅ Monitoring setup complete${NC}"
