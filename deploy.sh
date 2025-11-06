#!/bin/bash

# Paratranslator Deployment Script
# This script helps you deploy your Next.js app with Cloudflare Tunnel

set -e

echo "🚀 Paratranslator Deployment Script"
echo "===================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "❌ cloudflared is not installed"
    echo "📦 Install it with: sudo apt-get install cloudflared"
    exit 1
fi

echo "✅ cloudflared is installed"
echo ""

# Check if tunnel is configured
if [ ! -f "cloudflared-config.yml" ]; then
    echo "❌ cloudflared-config.yml not found"
    exit 1
fi

# Check if placeholder values are still in config
if grep -q "YOUR_TUNNEL_ID" cloudflared-config.yml; then
    echo "⚠️  Please update cloudflared-config.yml with your actual tunnel ID"
    echo "   See DEPLOYMENT.md for instructions"
    echo "   Run: cloudflared tunnel create paratranslator"
    exit 1
fi

echo "✅ Configuration file looks good"
echo ""

# Build the Next.js app
echo "🔨 Building Next.js app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 not found. Installing PM2..."
    npm install -g pm2
fi

# Start Next.js with PM2
echo "🚀 Starting Next.js app with PM2..."
pm2 delete paratranslator 2>/dev/null || true
pm2 start npm --name "paratranslator" -- start
pm2 save

echo "✅ Next.js app is running"
echo ""

# Ask if user wants to run tunnel as service or manually
echo "How do you want to run the Cloudflare Tunnel?"
echo "1) As a system service (recommended - runs on boot)"
echo "2) Manually in this terminal"
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo "📝 Installing Cloudflare Tunnel as a service..."
    sudo cloudflared --config "$(pwd)/cloudflared-config.yml" service install
    sudo systemctl start cloudflared
    sudo systemctl enable cloudflared
    echo "✅ Tunnel service installed and started"
    echo "📊 Check status with: sudo systemctl status cloudflared"
else
    echo "🌐 Starting tunnel manually..."
    echo "⚠️  Keep this terminal open to maintain the tunnel"
    cloudflared tunnel --config cloudflared-config.yml run
fi

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app should be live at your domain"
echo ""
echo "Useful commands:"
echo "  pm2 logs paratranslator            # View Next.js logs"
echo "  pm2 restart paratranslator         # Restart Next.js"
echo "  sudo systemctl status cloudflared  # Check tunnel status"
echo ""
echo "📖 For complete documentation, see: DEPLOYMENT.md"
