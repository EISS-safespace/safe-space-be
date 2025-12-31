#!/bin/bash

###############################################################################
# SafeSpace - University VM Setup Script
# 
# This script sets up the university VM for SafeSpace deployment
#
# Usage: curl -fsSL https://raw.githubusercontent.com/your-org/safespace/main/scripts/vm-setup.sh | bash
# Or: ./scripts/vm-setup.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    error "Please do not run as root. Run as your regular user."
    exit 1
fi

log "========================================="
log "SafeSpace VM Setup Script"
log "========================================="

###############################################################################
# 1. System Update
###############################################################################

log "Step 1: Updating system packages..."
sudo apt update
sudo apt upgrade -y

###############################################################################
# 2. Install Docker
###############################################################################

log "Step 2: Installing Docker..."

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    warning "Docker is already installed"
    docker --version
else
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    log "Docker installed successfully"
    docker --version
fi

###############################################################################
# 3. Install Docker Compose
###############################################################################

log "Step 3: Installing Docker Compose..."

# Check if Docker Compose is already installed
if command -v docker-compose &> /dev/null; then
    warning "Docker Compose is already installed"
    docker-compose --version
else
    sudo apt install docker-compose-plugin -y
    log "Docker Compose installed successfully"
fi

###############################################################################
# 4. Install Additional Tools
###############################################################################

log "Step 4: Installing additional tools..."

sudo apt install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    net-tools \
    ufw \
    certbot \
    python3-certbot-nginx

log "Additional tools installed"

###############################################################################
# 5. Configure Firewall
###############################################################################

log "Step 5: Configuring firewall..."

# Enable UFW
sudo ufw --force enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Show status
sudo ufw status

log "Firewall configured"

###############################################################################
# 6. Create Application Directory
###############################################################################

log "Step 6: Creating application directory..."

sudo mkdir -p /opt/safespace
sudo chown $USER:$USER /opt/safespace
mkdir -p /opt/safespace/{backups,logs,scripts}

log "Application directory created: /opt/safespace"

###############################################################################
# 7. Set Up Logging
###############################################################################

log "Step 7: Setting up logging..."

# Create log directory
sudo mkdir -p /var/log/safespace
sudo chown $USER:$USER /var/log/safespace

# Create logrotate configuration
sudo tee /etc/logrotate.d/safespace > /dev/null <<EOF
/var/log/safespace/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    sharedscripts
}
EOF

log "Logging configured"

###############################################################################
# 8. Clone Repository
###############################################################################

log "Step 8: Cloning repository..."

cd /opt/safespace

if [ -d ".git" ]; then
    warning "Repository already cloned, pulling latest changes..."
    git pull
else
    read -p "Enter GitHub repository URL: " REPO_URL
    git clone "$REPO_URL" .
fi

log "Repository cloned"

###############################################################################
# 9. Set Up Environment Variables
###############################################################################

log "Step 9: Setting up environment variables..."

if [ -f ".env" ]; then
    warning ".env file already exists"
else
    cp .env.example .env
    info "Please edit .env file with your production values"
    info "Run: nano /opt/safespace/.env"
fi

###############################################################################
# 10. Set Up Backup Cron Job
###############################################################################

log "Step 10: Setting up automated backups..."

# Make backup script executable
chmod +x /opt/safespace/scripts/backup.sh
chmod +x /opt/safespace/scripts/restore.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null | grep -v "safespace/scripts/backup.sh"; echo "0 2 * * * /opt/safespace/scripts/backup.sh >> /var/log/safespace/backup.log 2>&1") | crontab -

log "Automated backups configured (daily at 2 AM)"

###############################################################################
# 11. Set Up SSL/TLS (Optional)
###############################################################################

log "Step 11: SSL/TLS setup..."

read -p "Do you want to set up SSL/TLS now? (yes/no): " SETUP_SSL

if [ "$SETUP_SSL" = "yes" ]; then
    read -p "Enter your domain name (e.g., safespace.yourdomain.com): " DOMAIN
    read -p "Enter your email for Let's Encrypt: " EMAIL
    
    # Create SSL directory
    mkdir -p /opt/safespace/nginx/ssl
    
    # Stop nginx if running
    docker-compose -f /opt/safespace/docker-compose.yml stop nginx 2>/dev/null || true
    
    # Obtain certificate
    sudo certbot certonly --standalone \
        -d "$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/safespace/nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/safespace/nginx/ssl/key.pem
    sudo chown $USER:$USER /opt/safespace/nginx/ssl/*.pem
    
    # Set up auto-renewal
    sudo tee /etc/cron.daily/certbot-renew > /dev/null <<EOF
#!/bin/bash
certbot renew --quiet --deploy-hook "docker-compose -f /opt/safespace/docker-compose.yml restart nginx"
EOF
    sudo chmod +x /etc/cron.daily/certbot-renew
    
    log "SSL/TLS configured for $DOMAIN"
else
    info "Skipping SSL/TLS setup. You can run this script again later."
fi

###############################################################################
# 12. Final Steps
###############################################################################

log "========================================="
log "VM Setup Complete!"
log "========================================="
info ""
info "Next steps:"
info "1. Edit environment variables: nano /opt/safespace/.env"
info "2. Update nginx.conf with your domain"
info "3. Start services: cd /opt/safespace && docker-compose up -d"
info "4. Check logs: docker-compose logs -f"
info "5. Verify health: curl http://localhost:3001/health"
info ""
info "Important directories:"
info "  - Application: /opt/safespace"
info "  - Backups: /opt/safespace/backups"
info "  - Logs: /var/log/safespace"
info ""
info "Useful commands:"
info "  - View services: docker-compose ps"
info "  - View logs: docker-compose logs -f"
info "  - Restart: docker-compose restart"
info "  - Backup: /opt/safespace/scripts/backup.sh"
info ""
log "========================================="

# Remind about docker group
warning "IMPORTANT: You may need to log out and log back in for Docker group changes to take effect"
warning "Or run: newgrp docker"

exit 0

