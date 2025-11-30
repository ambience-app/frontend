# API Deployment & Environment Setup Guide

## Overview

This guide provides comprehensive instructions for deploying the Ambience Chat API across different environments and networks. The API supports multiple blockchain networks including Base, Celo, and their respective testnets.

## Prerequisites

### Required Tools

- **Node.js** 16+ or **Python** 3.8+
- **Git** for version control
- **Docker** (optional, for containerized deployment)
- **Web3 Wallet** with test funds (MetaMask, Coinbase Wallet)

### API Keys & Accounts

1. **Alchemy Account** - For blockchain RPC access
   - Create account at [alchemy.com](https://alchemy.com)
   - Create apps for each network (Base Mainnet, Base Sepolia, Celo Mainnet, Celo Alfajores)
   - Copy API keys

2. **Test Wallets** - For testing and development
   - Fund wallets with test tokens from respective faucets
   - Base Sepolia: [Base Faucet](https://faucet.quicknode.com/base/sepolia)
   - Celo Alfajores: [Celo Faucet](https://faucet.celo.org/alfajores)

## Environment Setup

### 1. Development Environment

#### Environment Variables

Create a `.env.local` file in your project root:

```bash
# Core API Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000/ws
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Blockchain Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e
CONTRACT_ADDRESS_BASE_MAINNET=0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e
CONTRACT_ADDRESS_BASE_SEPOLIA=0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e
CONTRACT_ADDRESS_CELO_MAINNET=0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e
CONTRACT_ADDRESS_CELO_ALFAJORES=0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e

# RPC URLs
NEXT_PUBLIC_BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_BASE_SEPOLIA_KEY
NEXT_PUBLIC_CELO_RPC_URL=https://celo-alfajores.g.alchemy.com/v2/YOUR_CELO_ALFAJORES_KEY

# Base Mainnet
BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_BASE_MAINNET_KEY

# Celo Mainnet
CELO_MAINNET_RPC_URL=https://celo-mainnet.g.alchemy.com/v2/YOUR_CELO_MAINNET_KEY

# External Services
IPFS_GATEWAY_URL=https://ipfs.io/ipfs/
ENS_PROVIDER_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# Database (if using)
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:password@localhost:5432/ambience_chat

# Rate Limiting
RATE_LIMIT_REDIS_URL=redis://localhost:6379/1

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
API_RATE_LIMIT_MAX=1000
API_RATE_LIMIT_WINDOW=3600000
```

#### Local Development Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/your-repo/ambience-chat.git
   cd ambience-chat
   npm install
   ```

2. **Start Services**
   ```bash
   # Start local Redis (for rate limiting)
   docker run -d -p 6379:6379 redis:alpine
   
   # Start local PostgreSQL (optional)
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:13
   
   # Start development server
   npm run dev
   ```

3. **Verify Setup**
   - API should be available at `http://localhost:3000`
   - WebSocket should be available at `ws://localhost:3000/ws`
   - Swagger UI should be available at `http://localhost:3000/api-docs`

### 2. Production Deployment

#### Option A: Vercel Deployment

1. **Prepare for Vercel**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Configure Environment Variables**
   In Vercel dashboard, add production environment variables:
   
   ```bash
   # Production Values
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   NEXT_PUBLIC_WS_URL=wss://your-app.vercel.app/ws
   
   # Production RPC URLs
   NEXT_PUBLIC_BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_PRODUCTION_KEY
   BASE_MAINNET_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_PRODUCTION_KEY
   CELO_MAINNET_RPC_URL=https://celo-mainnet.g.alchemy.com/v2/YOUR_PRODUCTION_KEY
   
   # Production Database
   REDIS_URL=redis://your-production-redis-url
   DATABASE_URL=postgresql://user:password@your-production-db
   
   # Production Security
   JWT_SECRET=your-production-jwt-secret
   ENCRYPTION_KEY=your-production-32-char-key
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

#### Option B: Docker Deployment

1. **Dockerfile**
   ```dockerfile
   # Multi-stage build for production
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   
   FROM node:18-alpine AS runner
   WORKDIR /app
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/next.config.js ./
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   ENV HOSTNAME "0.0.0.0"
   
   CMD ["node", "server.js"]
   ```

2. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     ambience-chat:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
         - REDIS_URL=redis://redis:6379
       depends_on:
         - redis
         - postgres
       restart: unless-stopped
   
     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
       volumes:
         - redis_data:/data
       restart: unless-stopped
   
     postgres:
       image: postgres:15
       environment:
         - POSTGRES_DB=ambience_chat
         - POSTGRES_USER=postgres
         - POSTGRES_PASSWORD=${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"
       restart: unless-stopped
   
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/ssl/certs
       depends_on:
         - ambience-chat
       restart: unless-stopped
   
   volumes:
     redis_data:
     postgres_data:
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

#### Option C: Cloud Platform Deployment

**AWS Deployment**
1. **Elastic Beanstalk Setup**
   ```bash
   npm install -g awsebcli
   eb init
   eb create production
   eb deploy
   ```

2. **Environment Variables in AWS Console**
   - Configure all production environment variables
   - Set up RDS for PostgreSQL
   - Set up ElastiCache for Redis
   - Configure Application Load Balancer for WebSocket support

**Google Cloud Deployment**
1. **App Engine Setup**
   ```bash
   gcloud app create
   gcloud app deploy
   ```

2. **app.yaml Configuration**
   ```yaml
   runtime: nodejs18
   
   env_variables:
     NEXT_PUBLIC_APP_URL: https://your-app.appspot.com
     REDIS_URL: redis://your-redis-url
     DATABASE_URL: postgresql://user:password@your-cloud-sql-url
   ```

## Network Configuration

### Base Network

#### Base Mainnet
- **Chain ID**: 8453
- **RPC URL**: `https://base-mainnet.g.alchemy.com/v2/{API_KEY}`
- **Contract Address**: `0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e`
- **Currency**: ETH

#### Base Sepolia Testnet
- **Chain ID**: 84532
- **RPC URL**: `https://base-sepolia.g.alchemy.com/v2/{API_KEY}`
- **Contract Address**: `0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e`
- **Currency**: ETH

### Celo Network

#### Celo Mainnet
- **Chain ID**: 42220
- **RPC URL**: `https://celo-mainnet.g.alchemy.com/v2/{API_KEY}`
- **Contract Address**: `0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e`
- **Currency**: CELO

#### Celo Alfajores Testnet
- **Chain ID**: 44787
- **RPC URL**: `https://celo-alfajores.g.alchemy.com/v2/{API_KEY}`
- **Contract Address**: `0x23cdaec75b1c3e5d26db4675ecb3c9042a780a0e`
- **Currency**: CELO

## WebSocket Configuration

### Production WebSocket Setup

1. **Enable WebSocket in Your Platform**

   **Vercel**: WebSocket support is automatically enabled
   
   **Docker/Nginx**: Configure WebSocket proxy:
   ```nginx
   upstream websocket {
       server ambience-chat:3000;
   }
   
   server {
       location /ws {
           proxy_pass http://websocket;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

2. **Environment Configuration**
   ```bash
   # WebSocket URLs by environment
   NEXT_PUBLIC_WS_URL_WSS=wss://your-domain.com/ws
   NEXT_PUBLIC_WS_URL_WS=ws://localhost:3000/ws
   ```

## Monitoring & Observability

### 1. Logging Setup

**Production Logging**
```javascript
// lib/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ambience-chat-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export default logger;
```

### 2. Health Checks

```javascript
// pages/api/health.js
export default async function handler(req, res) {
  const checks = {
    timestamp: Date.now(),
    status: 'ok',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      blockchain: await checkBlockchainConnection(),
      external_apis: await checkExternalAPIs()
    }
  };
  
  const isHealthy = Object.values(checks.checks).every(check => check.status === 'ok');
  
  res.status(isHealthy ? 200 : 503).json(checks);
}
```

### 3. Metrics Collection

```javascript
// lib/metrics.js
import { register, collectDefaultMetrics } from 'prom-client';

collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const blockchainTransactionCount = new Counter({
  name: 'blockchain_transactions_total',
  help: 'Total number of blockchain transactions',
  labelNames: ['network', 'type']
});

export { httpRequestDuration, blockchainTransactionCount, register };
```

## Security Configuration

### 1. Rate Limiting

```javascript
// middleware/rateLimiter.js
import RedisStore from 'rate-limit-redis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rl',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

export const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 1
    });
  }
};
```

### 2. CORS Configuration

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.ALLOWED_ORIGINS || 'https://yourdomain.com'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-API-Key'
          }
        ]
      }
    ];
  }
};
```

### 3. Environment-Specific Security

```bash
# Development
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true

# Staging
NODE_ENV=staging
NEXT_PUBLIC_DEBUG=false
SECURE_COOKIES=true

# Production
NODE_ENV=production
NEXT_PUBLIC_DEBUG=false
SECURE_COOKIES=true
HSTS_ENABLED=true
CSP_ENABLED=true
```

## Testing Deployment

### 1. Smoke Tests

```bash
#!/bin/bash
# deploy-test.sh

API_URL="https://your-api-url"
WS_URL="wss://your-websocket-url"

echo "Testing API Health..."
curl -f $API_URL/api/health || exit 1

echo "Testing Rate Limit..."
curl -f -H "X-API-Key: test-key" $API_URL/rate-limit || exit 1

echo "Testing WebSocket..."
wscat -c $WS_URL -x '{"type":"ping","id":"test"}' || exit 1

echo "All tests passed!"
```

### 2. Load Testing

```javascript
// load-test.js
import autocannon from 'autocannon';

const runLoadTest = async () => {
  const result = await autocannon({
    url: 'https://your-api-url/api/health',
    connections: 100,
    duration: '30s'
  });
  
  console.log('Load test results:', result);
};

runLoadTest();
```

## Rollback Strategy

### 1. Database Migration Rollback

```bash
# Rollback to previous migration
npm run db:migrate:down

# Or specific version
npm run db:migrate:down -- --to 20231130120000
```

### 2. Application Rollback

```bash
# Vercel rollback
vercel rollback

# Docker rollback
docker-compose down
docker-compose up -d --scale ambience-chat=1 previous-image-tag

# Kubernetes rollback
kubectl rollout undo deployment/ambience-chat-api
```

## Troubleshooting Common Issues

### 1. WebSocket Connection Issues

**Problem**: WebSocket connection fails in production

**Solution**:
- Check proxy configuration
- Verify environment variables
- Test WebSocket URL in isolation

### 2. RPC Rate Limiting

**Problem**: RPC provider rate limits exceeded

**Solution**:
- Implement request caching
- Use multiple RPC providers
- Implement exponential backoff

### 3. Gas Estimation Issues

**Problem**: Transaction gas estimation fails

**Solution**:
- Use multiple gas estimation strategies
- Implement manual gas limits
- Cache gas price estimates

This deployment guide provides a comprehensive foundation for deploying the Ambience Chat API across different environments and networks. Always test thoroughly in staging before production deployment.