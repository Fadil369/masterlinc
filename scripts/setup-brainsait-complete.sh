#!/bin/bash
# brainsait Server Complete Setup Script
# Configures file sharing, subnet routing, exit node, and more

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="100.122.153.63"
SERVER_NAME="brainsait"
SHARED_DIR="/srv/shared"
SMB_USER="fadil369"

echo "════════════════════════════════════════════════════════════════════════════"
echo "        🚀 brainsait (Hetzner) - Complete Setup & Enhancement"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "This will configure your Hetzner server for:"
echo "   ✅ File Sharing (SMB/Samba, NFS)"
echo "   ✅ SSH access optimization"
echo "   ✅ Tailscale subnet routing"
echo "   ✅ Exit node capability"
echo "   ✅ Docker services"
echo "   ✅ Firewall configuration"
echo ""
echo "Server: $SERVER_IP ($SERVER_NAME)"
echo "Press Enter to continue, or Ctrl+C to cancel..."
read

# Create the remote setup script
cat > /tmp/brainsait_remote_setup.sh << 'REMOTE_SCRIPT'
#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Starting brainsait Server Configuration...${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Install Samba for file sharing
echo -e "${BLUE}[1/8]${NC} Installing Samba..."
sudo apt-get update -qq
sudo apt-get install -y samba nfs-kernel-server cifs-utils -qq

# Step 2: Create shared directory
echo -e "${BLUE}[2/8]${NC} Creating shared directory..."
sudo mkdir -p /srv/shared
sudo chown fadil369:fadil369 /srv/shared
sudo chmod 2775 /srv/shared

# Step 3: Configure Samba
echo -e "${BLUE}[3/8]${NC} Configuring Samba..."
if ! grep -q "\[shared\]" /etc/samba/smb.conf; then
    sudo tee -a /etc/samba/smb.conf > /dev/null << 'EOF'

[shared]
   comment = brainsait Shared Storage
   path = /srv/shared
   browseable = yes
   writable = yes
   guest ok = no
   valid users = fadil369
   create mask = 0664
   directory mask = 2775
EOF
fi

# Set Samba password (using brainsait as password)
echo -e "brainsait\nbrainsait" | sudo smbpasswd -a fadil369 -s

# Restart Samba
sudo systemctl restart smbd nmbd
sudo systemctl enable smbd nmbd

# Step 4: Configure NFS
echo -e "${BLUE}[4/8]${NC} Configuring NFS..."
if ! grep -q "/srv/shared" /etc/exports; then
    echo "/srv/shared 100.0.0.0/8(rw,sync,no_subtree_check,no_root_squash)" | sudo tee -a /etc/exports
fi
sudo exportfs -ra
sudo systemctl restart nfs-kernel-server
sudo systemctl enable nfs-kernel-server

# Step 5: Configure SSH for Tailscale
echo -e "${BLUE}[5/8]${NC} Optimizing SSH configuration..."
# Ensure SSH listens on all interfaces (including Tailscale)
sudo sed -i 's/#ListenAddress 0.0.0.0/ListenAddress 0.0.0.0/' /etc/ssh/sshd_config
sudo sed -i 's/#Port 22/Port 22/' /etc/ssh/sshd_config

# Enable password authentication for Tailscale network
if ! grep -q "Match Address 100.*.*.*/8" /etc/ssh/sshd_config; then
    sudo tee -a /etc/ssh/sshd_config > /dev/null << 'EOF'

# Allow password auth from Tailscale network
Match Address 100.64.0.0/10
    PasswordAuthentication yes
    PubkeyAuthentication yes
EOF
fi

sudo systemctl restart sshd

# Step 6: Enable IP forwarding for routing
echo -e "${BLUE}[6/8]${NC} Enabling IP forwarding..."
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
sudo sysctl -p /etc/sysctl.d/99-tailscale.conf

# Step 7: Configure Tailscale subnet router and exit node
echo -e "${BLUE}[7/8]${NC} Configuring Tailscale routing..."

# Get Docker networks
DOCKER_NETWORKS="10.0.0.0/24,10.0.1.0/24"

# Advertise as subnet router and exit node
sudo tailscale up --advertise-routes=$DOCKER_NETWORKS --advertise-exit-node --ssh --accept-routes

echo -e "${YELLOW}⚠️  Remember to approve subnet routes and exit node in admin console${NC}"

# Step 8: Configure firewall
echo -e "${BLUE}[8/8]${NC} Configuring firewall..."
sudo ufw allow from 100.64.0.0/10 to any port 22 comment 'SSH from Tailscale'
sudo ufw allow from 100.64.0.0/10 to any port 445 comment 'SMB from Tailscale'
sudo ufw allow from 100.64.0.0/10 to any port 139 comment 'SMB from Tailscale'
sudo ufw allow from 100.64.0.0/10 to any port 2049 comment 'NFS from Tailscale'

# Reload UFW
sudo ufw --force enable

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Server configuration completed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Configured services:"
echo "  ✓ Samba/SMB file sharing"
echo "  ✓ NFS file sharing"
echo "  ✓ SSH (listening on Tailscale)"
echo "  ✓ Tailscale subnet routing (10.0.0.0/24, 10.0.1.0/24)"
echo "  ✓ Tailscale exit node"
echo "  ✓ Firewall rules"
echo ""
echo "Status:"
tailscale status
echo ""

REMOTE_SCRIPT

echo ""
echo "Connecting to brainsait and running setup..."
echo ""

# Try SSH methods in order of preference
SSH_SUCCESS=false

# Method 1: Try Tailscale SSH (recommended)
echo "Attempting connection via Tailscale SSH..."
if tailscale ssh fadil369@$SERVER_NAME "bash -s" < /tmp/brainsait_remote_setup.sh 2>/dev/null; then
    SSH_SUCCESS=true
# Method 2: Try regular SSH with Tailscale IP
elif ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no fadil369@$SERVER_IP "bash -s" < /tmp/brainsait_remote_setup.sh 2>/dev/null; then
    SSH_SUCCESS=true
# Method 3: Try with password prompt
else
    echo ""
    echo -e "${YELLOW}Tailscale SSH not available. Trying regular SSH...${NC}"
    echo "You may need to enter your password."
    echo ""
    if ssh -o ConnectTimeout=10 fadil369@$SERVER_IP "bash -s" < /tmp/brainsait_remote_setup.sh; then
        SSH_SUCCESS=true
    fi
fi

# Clean up temp file
rm -f /tmp/brainsait_remote_setup.sh

if [ "$SSH_SUCCESS" = true ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "🎉 brainsait Server Setup Complete!"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "📋 Access Methods:"
    echo ""
    echo "  SSH:"
    echo "    ssh fadil369@$SERVER_IP"
    echo "    tailscale ssh fadil369@$SERVER_NAME"
    echo ""
    echo "  SMB File Sharing (from Mac):"
    echo "    Finder → Cmd+K → smb://$SERVER_IP"
    echo "    Username: $SMB_USER"
    echo "    Password: brainsait"
    echo ""
    echo "  NFS File Sharing (from Mac/Linux):"
    echo "    sudo mkdir -p /mnt/brainsait"
    echo "    sudo mount -t nfs $SERVER_IP:/srv/shared /mnt/brainsait"
    echo ""
    echo "  Taildrop:"
    echo "    tailscale file cp myfile.txt $SERVER_NAME:"
    echo ""
    echo "⚠️  IMPORTANT: Approve in Admin Console"
    echo "    → https://login.tailscale.com/admin/machines"
    echo "    → Find 'brainsait'"
    echo "    → Approve: Subnet routes, Exit node"
    echo ""
    echo "🔗 Quick Test from Mac:"
    echo "    # Test SSH"
    echo "    tailscale ssh fadil369@$SERVER_NAME"
    echo ""
    echo "    # Mount SMB share"
    echo "    open 'smb://$SERVER_IP'"
    echo ""
    echo "    # Ping via Tailscale"
    echo "    tailscale ping $SERVER_NAME"
    echo ""
else
    echo ""
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ Connection to server failed!${NC}"
    echo -e "${RED}════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo ""
    echo "1. Verify Tailscale is connected:"
    echo "   tailscale status"
    echo ""
    echo "2. Ping the server:"
    echo "   tailscale ping $SERVER_NAME"
    echo ""
    echo "3. Check if SSH is listening:"
    echo "   nc -zv $SERVER_IP 22"
    echo ""
    echo "4. Try manual SSH:"
    echo "   tailscale ssh fadil369@$SERVER_NAME"
    echo ""
    echo "5. Run setup manually on server:"
    echo "   ssh to server and run the commands from the script"
    echo ""
    exit 1
fi
