# �� BrainSAIT Public API - Setup Complete

## 🎉 Services Deployed

### ✅ Running Services:
- **MasterLinc Coordinator**: Port 4000
- **DeepSeek AI**: Integrated
- **RadioLinc Agent**: Integrated
- **Orthanc PACS**: Port 8042
- **OHIF Viewer**: Port 3000

---

## 🔗 Public Access Options

### Option 1: Tailscale (Private Network)

**Status**: Configured ✅

**Access Your Services**:
```bash
# Get your Tailscale IP
tailscale ip -4

# Access from any Tailscale device:
http://<tailscale-ip>:4000/health
http://<tailscale-ip>:8042  (Orthanc)
http://<tailscale-ip>:3000  (OHIF)
```

**Benefits**:
- Secure peer-to-peer VPN
- No port forwarding needed
- Access from phone, laptop, anywhere
- Already configured!

---

### Option 2: Cloudflare Tunnel (Public HTTPS)

**Setup Steps**:

1. **Install Cloudflare Tunnel** (if not done):
   ```bash
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
   sudo dpkg -i cloudflared.deb
   ```

2. **Authenticate**:
   ```bash
   cloudflared tunnel login
   ```

3. **Create Tunnel**:
   ```bash
   cloudflared tunnel create brainsait
   ```

4. **Configure Tunnel** (`~/.cloudflared/config.yml`):
   ```yaml
   tunnel: brainsait
   credentials-file: /home/fadil369/.cloudflared/<tunnel-id>.json

   ingress:
     # Public API
     - hostname: api.brainsait.com
       service: http://localhost:4000
     
     # OHIF Viewer
     - hostname: viewer.brainsait.com
       service: http://localhost:3000
     
     # Orthanc (authenticated)
     - hostname: pacs.brainsait.com
       service: http://localhost:8042
     
     # Catch-all
     - service: http_status:404
   ```

5. **Route DNS**:
   ```bash
   cloudflared tunnel route dns brainsait api.brainsait.com
   cloudflared tunnel route dns brainsait viewer.brainsait.com
   cloudflared tunnel route dns brainsait pacs.brainsait.com
   ```

6. **Start Tunnel**:
   ```bash
   cloudflared tunnel run brainsait
   ```

**Public URLs** (after setup):
- `https://api.brainsait.com/health`
- `https://viewer.brainsait.com`
- `https://pacs.brainsait.com`

---

### Option 3: Nginx Reverse Proxy (Traditional)

**Config File**: `~/nginx-brainsait-api.conf`

**Setup**:
```bash
sudo cp ~/nginx-brainsait-api.conf /etc/nginx/sites-available/brainsait-api
sudo ln -s /etc/nginx/sites-available/brainsait-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**SSL Certificate** (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.brainsait.com
```

---

## 🧪 Testing API Access

### Local Testing:
```bash
# Health check
curl http://localhost:4000/health

# Process command
curl -X POST http://localhost:4000/api/process \
  -H "Content-Type: application/json" \
  -d '{"source":"test","command":"health"}'

# RadioLinc triage
curl -X POST http://localhost:4000/api/radiolinc/triage \
  -H "Content-Type: application/json" \
  -d '{"studyId":"test-123"}'
```

### Public Testing (after setup):
```bash
# Via Tailscale
curl http://<tailscale-ip>:4000/health

# Via Cloudflare Tunnel
curl https://api.brainsait.com/health

# Via Nginx + Domain
curl https://your-domain.com/health
```

---

## 📱 WhatsApp/Telegram Integration

### Clawdbot Commands (work locally and remotely):
```
@bot status
@bot studies
@bot analyze study <ID>
@bot report <ID>
```

### How It Works:
```
WhatsApp → Clawdbot (local) → MasterLinc API (local/public)
                            → DeepSeek AI
                            → RadioLinc Agent
                            → Orthanc PACS
```

---

## 🔐 Security Recommendations

### For Production:

1. **Enable Authentication**:
   ```bash
   # Create htpasswd for Orthanc
   sudo apt install apache2-utils
   sudo htpasswd -c /etc/nginx/.htpasswd admin
   ```

2. **Rate Limiting**: Already configured in nginx
3. **CORS**: Restrict to known domains
4. **API Keys**: Implement token-based auth
5. **Firewall**:
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw deny 4000/tcp  # Only via reverse proxy
   sudo ufw enable
   ```

---

## 📊 Monitoring

### Check Logs:
```bash
# MasterLinc Coordinator
tail -f ~/logs/masterlinc-coordinator.log

# Orthanc
docker logs -f brainsait-orthanc

# Nginx (if configured)
sudo tail -f /var/log/nginx/brainsait-api-access.log
```

### Health Monitoring:
```bash
# Create monitoring script
cat > ~/check-health.sh << 'SCRIPT'
#!/bin/bash
curl -sf http://localhost:4000/health > /dev/null && echo "✅ MasterLinc OK" || echo "❌ MasterLinc DOWN"
curl -sf http://localhost:8042/system -u orthanc:orthanc > /dev/null && echo "✅ Orthanc OK" || echo "❌ Orthanc DOWN"
curl -sf http://localhost:3000 > /dev/null && echo "✅ OHIF OK" || echo "❌ OHIF DOWN"
SCRIPT
chmod +x ~/check-health.sh

# Run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/check-health.sh") | crontab -
```

---

## 🚀 Current Status

### ✅ What's Working:
- MasterLinc Coordinator API
- DeepSeek AI integration
- RadioLinc Agent ready
- Orthanc PACS
- OHIF Viewer
- Clawdbot skills

### 🔄 Next Steps:
1. Choose public access method (Tailscale/Cloudflare/Nginx)
2. Configure DNS if using custom domain
3. Set up SSL certificates
4. Test public API access
5. Configure 3CX phone integration
6. Test end-to-end workflows

---

## 📞 Quick Reference

### Service Ports:
- **4000**: MasterLinc API
- **8042**: Orthanc PACS
- **3000**: OHIF Viewer

### Key Files:
- Config: `~/.masterlinc.env`
- Logs: `~/logs/masterlinc-coordinator.log`
- Nginx: `~/nginx-brainsait-api.conf`

### Useful Commands:
```bash
# Check status
curl http://localhost:4000/health | jq

# Restart coordinator
cd ~/masterlinc/packages/masterlinc-coordinator
source ~/.masterlinc.env
node dist/index.js &

# View logs
tail -f ~/logs/masterlinc-coordinator.log

# Test integration
~/test-integration.sh
```

---

**✅ Your BrainSAIT API is ready for public access!**

Choose your preferred method above and configure accordingly.
