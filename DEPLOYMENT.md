# Deployment Guide

Complete guide for deploying Paratranslator with Cloudflare Tunnel

> **📌 Note**: Replace `your-domain.com` throughout this guide with your actual domain name.

---

## 🐳 Option 1: Docker Deployment (Recommended)

The easiest way to deploy with automatic setup and process management.

### Quick Start (3 Steps)

#### 1. Get Cloudflare Tunnel Token

1. Visit [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Go to **Networks** → **Tunnels** → **Create a tunnel**
3. Choose **Cloudflared**
4. Name: `paratranslator`
5. Click **Save tunnel**
6. **Copy the tunnel token** (starts with `eyJ...`)

#### 2. Run Deployment Script

```bash
./docker-deploy.sh
```

The script will:
- Prompt for your tunnel token (or create `.env` file manually)
- Build optimized Docker images
- Start all services (app + tunnel)
- Show status and logs

#### 3. Configure Public Hostname

In the Cloudflare dashboard (same page where you got the token):

**Add public hostname:**
- **Subdomain**: (leave empty for root domain)
- **Domain**: `your-domain.com` (replace with your actual domain)
- **Service Type**: HTTP
- **URL**: `app:3001`

Click **Save** ✅

**🎉 Done!** Your site is live at `https://your-domain.com`

> **Note**: Service Type "HTTP" is correct here. This is the internal connection between the Cloudflare Tunnel and your app (which is secure within the Docker network). Your website is automatically served over **HTTPS** to visitors via Cloudflare's SSL/TLS. No additional configuration needed!

### Manual Docker Setup

If you prefer manual control:

```bash
# 1. Create .env file with your tunnel token
echo "TUNNEL_TOKEN=your_token_here" > .env

# 2. Build and start containers
docker compose up -d

# 3. Configure public hostname in Cloudflare (as above)
```

### Docker Management Commands

```bash
# View live logs
docker compose logs -f

# Check container status
docker compose ps

# Restart services
docker compose restart

# Stop all services
docker compose down

# Update and rebuild
docker compose up -d --build

# View specific service logs
docker compose logs -f app         # Next.js app
docker compose logs -f cloudflared # Tunnel

# Execute commands in container
docker compose exec app sh
```

### Docker Troubleshooting

**Containers won't start?**
```bash
docker compose logs app
docker compose build --no-cache
docker compose up -d
```

**Tunnel not connecting?**
```bash
docker compose logs cloudflared
# Verify token in .env file
# Check public hostname configuration in Cloudflare
```

**App not accessible locally?**
```bash
curl http://localhost:3001
docker compose ps
```

---

## 🔧 Option 2: Non-Docker Deployment

Deploy without Docker using PM2 and Cloudflare Tunnel.

### Prerequisites

- Node.js 20+
- Cloudflare account
- Your domain added to Cloudflare (e.g., `your-domain.com`)

### Step 1: Install cloudflared

```bash
# For Debian/Ubuntu
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Or via package manager
sudo apt-get install cloudflared

# Verify installation
cloudflared --version
```

### Step 2: Create Cloudflare Tunnel

```bash
# Authenticate with Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create paratranslator

# Note the Tunnel ID displayed
```

This creates:
- A tunnel with a unique ID
- Credentials at `~/.cloudflared/<TUNNEL_ID>.json`

### Step 3: Configure DNS

```bash
# Route domain to tunnel (replace your-domain.com with your actual domain)
cloudflared tunnel route dns paratranslator your-domain.com
cloudflared tunnel route dns paratranslator www.your-domain.com
```

Or manually in Cloudflare Dashboard:
1. Go to **DNS** settings for your domain
2. Add CNAME record:
   - **Name**: `@` (or `www`)
   - **Target**: `<TUNNEL_ID>.cfargotunnel.com`
   - **Proxy status**: Proxied ✅

### Step 4: Update Configuration

Edit `cloudflared-config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID_HERE
credentials-file: /home/vmo/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: your-domain.com
    service: http://localhost:3001
  - hostname: www.your-domain.com
    service: http://localhost:3001
  - service: http_status:404
```

### Step 5: Build Next.js App

```bash
npm run build
```

### Step 6: Install PM2

```bash
npm install -g pm2
```

### Step 7: Start Services

```bash
# Start Next.js with PM2
pm2 start npm --name "paratranslator" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# (Follow the command it provides)

# Start Cloudflare Tunnel
cloudflared tunnel --config cloudflared-config.yml run paratranslator
```

### Step 8: Install Tunnel as Service

To keep the tunnel running in the background:

```bash
# Install as system service
sudo cloudflared --config /home/vmo/workspace/javascript/paratranslator/cloudflared-config.yml service install

# Start the service
sudo systemctl start cloudflared

# Enable on boot
sudo systemctl enable cloudflared
```

### Non-Docker Management Commands

```bash
# PM2 Commands
pm2 logs paratranslator          # View logs
pm2 restart paratranslator       # Restart app
pm2 stop paratranslator          # Stop app
pm2 delete paratranslator        # Remove from PM2
pm2 list                         # List all processes

# Tunnel Commands
sudo systemctl status cloudflared    # Check status
sudo systemctl restart cloudflared   # Restart tunnel
sudo journalctl -u cloudflared -f    # View logs

# Cloudflared Commands
cloudflared tunnel list              # List all tunnels
cloudflared tunnel info paratranslator  # Tunnel details
```

### Non-Docker Troubleshooting

**Tunnel won't connect?**
- Check if Next.js is running: `curl http://localhost:3001`
- Verify tunnel ID and credentials path in config
- Check tunnel logs: `sudo journalctl -u cloudflared -f`

**DNS not resolving?**
- Wait 5-10 minutes for DNS propagation
- Clear DNS cache: `sudo systemd-resolve --flush-caches`
- Verify CNAME record in Cloudflare Dashboard

**App crashes or won't start?**
- Check PM2 logs: `pm2 logs paratranslator`
- Verify build completed: `ls -la .next`
- Check Node.js version: `node --version`

---

## 📊 Architecture Overview

### Docker Setup
```
Internet → Cloudflare → Tunnel Container → App Container (Next.js:3001)
```

### Non-Docker Setup
```
Internet → Cloudflare → Tunnel Service → PM2 → Next.js (localhost:3001)
```

---

## 🔐 Security Features

- ✅ **Automatic HTTPS**: Your site is served over HTTPS to all visitors
- ✅ **SSL/TLS Certificates**: Managed automatically by Cloudflare
- ✅ **No ports opened**: No need to open ports 80/443 in your firewall
- ✅ **Origin IP hidden**: Your server IP stays private
- ✅ **DDoS protection**: Included via Cloudflare
- ✅ **Encrypted tunnel**: All traffic between Cloudflare and your server is encrypted

### Traffic Flow

```
Internet User (HTTPS) → Cloudflare Edge (HTTPS) → Encrypted Tunnel → Your App (HTTP)
           ↑                                                              ↑
    🔒 SSL/TLS                                                    Internal only
```

**Why HTTP internally?**
- The tunnel itself is encrypted end-to-end
- HTTP between tunnel and app is fast and secure (internal Docker network)
- HTTPS is already handled by Cloudflare at the edge
- No need for SSL certificates on your app

---

## 🚀 Production Best Practices

### For Docker Deployments

1. **Set resource limits** in `docker-compose.yml`:
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
```

2. **Add health checks**:
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001"]
  interval: 30s
  timeout: 10s
  retries: 3
```

3. **Use Docker secrets** for sensitive data instead of `.env` files

4. **Set up log rotation**:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### For All Deployments

1. **Monitor logs regularly**
2. **Set up automated backups** of tunnel credentials
3. **Keep dependencies updated**: `npm audit` and `npm update`
4. **Use environment variables** for configuration
5. **Enable Cloudflare analytics** for traffic insights

---

## 🔄 Updating Your Deployment

### Docker Update

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose up -d --build

# Check status
docker compose ps
docker compose logs -f
```

### Non-Docker Update

```bash
# Pull latest code
git pull

# Rebuild Next.js
npm run build

# Restart app
pm2 restart paratranslator

# Check status
pm2 status
pm2 logs paratranslator
```

---

## 🆘 Common Issues

### Issue: "Tunnel token is invalid"
**Solution**: Regenerate token in Cloudflare dashboard and update `.env` file

### Issue: "Port 3001 already in use"
**Solution**: 
```bash
# Find and kill process on port 3001
sudo lsof -ti:3001 | xargs kill -9
```

### Issue: "Build fails with memory error"
**Solution**: Increase Node.js memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Issue: "DNS propagation takes too long"
**Solution**: Use Cloudflare's proxied DNS (orange cloud icon) for instant propagation

### Issue: "Container keeps restarting"
**Solution**:
```bash
docker compose logs app
# Fix the error shown and rebuild
docker compose up -d --build
```

---

## 📞 Support Resources

- **Cloudflare Tunnel Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Docker Compose**: https://docs.docker.com/compose/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/usage/quick-start/

---

## 📝 Quick Reference

### Docker Commands
| Command | Description |
|---------|-------------|
| `./docker-deploy.sh` | Automated deployment |
| `docker compose up -d` | Start services |
| `docker compose down` | Stop services |
| `docker compose logs -f` | View logs |
| `docker compose restart` | Restart services |
| `docker compose ps` | Check status |

### Non-Docker Commands
| Command | Description |
|---------|-------------|
| `pm2 start npm --name paratranslator -- start` | Start app |
| `pm2 logs paratranslator` | View logs |
| `pm2 restart paratranslator` | Restart app |
| `sudo systemctl status cloudflared` | Check tunnel |
| `cloudflared tunnel list` | List tunnels |

---

**🎉 Your deployment is complete!**

Access your app at: **https://your-domain.com**
