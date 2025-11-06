#!/bin/bash

# Docker Deployment Script for Paratranslator
# Replace 'your-domain.com' with your actual domain

set -e

echo "🐳 Paratranslator Docker Deployment"
echo "===================================="
echo "📌 Don't forget to configure your domain in Cloudflare"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "📦 Install it from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi

echo "✅ Docker is installed"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo ""
    echo "You need to create a .env file with your Cloudflare Tunnel token."
    echo "See DEPLOYMENT.md for complete instructions."
    echo ""
    echo "Quick steps:"
    echo "1. Visit: https://one.dash.cloudflare.com/"
    echo "2. Go to: Networks → Tunnels → Create a tunnel"
    echo "3. Name: paratranslator → Copy the token"
    echo "4. Create .env: echo 'TUNNEL_TOKEN=your_token' > .env"
    echo ""
    read -p "Do you want to enter your tunnel token now? (y/n): " enter_token
    
    if [ "$enter_token" = "y" ]; then
        read -p "Enter your Cloudflare Tunnel Token: " token
        echo "TUNNEL_TOKEN=$token" > .env
        echo "✅ .env file created"
    else
        echo "❌ Cannot continue without tunnel token"
        exit 1
    fi
fi

echo "✅ .env file found"
echo ""

# Build and start containers
echo "🔨 Building Docker images..."
docker compose build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"
echo ""

echo "🚀 Starting containers..."
docker compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start containers"
    exit 1
fi

echo "✅ Containers started"
echo ""

# Wait a few seconds for services to initialize
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check container status
echo "📊 Container Status:"
docker compose ps
echo ""

# Show logs
echo "📝 Recent logs:"
docker compose logs --tail=20
echo ""

echo "✅ Deployment Complete!"
echo ""
echo "🌐 Your app should be live at:"
echo "   https://your-domain.com (replace with your actual domain)"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f         # View live logs"
echo "  docker compose ps              # Check status"
echo "  docker compose restart         # Restart services"
echo "  docker compose down            # Stop everything"
echo "  docker compose up -d --build   # Rebuild and restart"
echo ""
echo "📖 For complete documentation, see: DEPLOYMENT.md"
