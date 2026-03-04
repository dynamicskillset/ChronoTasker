#!/bin/bash
set -e

# ChronoTasker deployment script
# Usage: bash deploy/deploy.sh

SERVER="root@80.78.23.57"
REMOTE_DIR="/opt/chronotasker"

echo "=== ChronoTasker Deployment ==="

# 1. Build frontend
echo "[1/6] Building frontend..."
cd "$(dirname "$0")/../chronotasker-app"
npm run build

# 2. Build server
echo "[2/6] Building server..."
cd "$(dirname "$0")/../server"
npm run build

# 3. Create remote directory structure
echo "[3/6] Setting up remote directories..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR/{frontend,server}"

# 4. Upload frontend
echo "[4/6] Uploading frontend..."
rsync -az --delete "$(dirname "$0")/../chronotasker-app/dist/" "$SERVER:$REMOTE_DIR/frontend/"

# 5. Upload server
echo "[5/6] Uploading server..."
rsync -az --delete \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude '*.db' \
  "$(dirname "$0")/../server/" "$SERVER:$REMOTE_DIR/server/"

# 6. Install deps and restart on remote
echo "[6/6] Installing dependencies and restarting services..."
ssh "$SERVER" bash -s << 'REMOTE_SCRIPT'
set -e

cd /opt/chronotasker/server

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# Install pm2 if not present
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Install server dependencies
npm install --production

# Create .env if it doesn't exist (token will be auto-generated on first run)
if [ ! -f .env ]; then
    echo "PORT=3001" > .env
fi

# Start/restart server with pm2
pm2 stop chronotasker 2>/dev/null || true
pm2 delete chronotasker 2>/dev/null || true
pm2 start dist/index.js --name chronotasker
pm2 save

# Set up pm2 to start on boot
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# Install nginx if not present
if ! command -v nginx &> /dev/null; then
    apt-get update -qq
    apt-get install -y nginx
fi

# Configure nginx
cp /opt/chronotasker/frontend/../deploy-nginx.conf /etc/nginx/sites-available/chronotasker 2>/dev/null || true
ln -sf /etc/nginx/sites-available/chronotasker /etc/nginx/sites-enabled/chronotasker 2>/dev/null || true

# Test and reload nginx
nginx -t && systemctl reload nginx

echo ""
echo "=== Deployment complete ==="
echo "Server running on port 3001"
echo "Frontend served by nginx on port 80"
REMOTE_SCRIPT

echo ""
echo "=== Done! ==="
echo "Access ChronoTasker at http://80.78.23.57"
