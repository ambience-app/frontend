# Deployment Guide

This document outlines the deployment process for the Ambience frontend application.

## Environments

### Staging
- **Branch**: `develop`
- **URL**: [staging.ambience.app](https://staging.ambience.app)
- **Deployment**: Automatically deploys on push to `develop`
- **Network**: Testnet

### Production
- **Branch**: `main`
- **URL**: [app.ambience.app](https://app.ambience.app)
- **Deployment**: Manual deployment by creating a git tag (format: `v1.0.0`)
- **Network**: Mainnet

## Required Secrets

The following secrets need to be configured in your GitHub repository settings:

### Repository Secrets
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID
- `SENTRY_AUTH_TOKEN`: Sentry authentication token
- `WALLETCONNECT_PROJECT_ID`: WalletConnect project ID
- `STAGING_WALLETCONNECT_PROJECT_ID`: Staging WalletConnect project ID
- `PROD_WALLETCONNECT_PROJECT_ID`: Production WalletConnect project ID
- `STAGING_API_URL`: Staging API URL
- `PROD_API_URL`: Production API URL

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# App
NEXT_PUBLIC_NETWORK=testnet # or 'mainnet' for production
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
NEXT_PUBLIC_API_URL=your-api-url

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## Deployment Workflows

### CI Pipeline
Runs on every push to `main` or `develop` branches and on pull requests:
- Linting
- Type checking
- Unit tests
- Build verification

### Staging Deployment
Triggered on push to `develop` branch:
1. Runs CI pipeline
2. Builds the application with staging environment variables
3. Deploys to Vercel staging environment

### Production Deployment
Triggered when a new tag is pushed (format: `v1.0.0`):
1. Runs CI pipeline
2. Builds the application with production environment variables
3. Creates a new Sentry release
4. Deploys to Vercel production environment

## Monitoring

### Sentry
- Error tracking
- Performance monitoring
- Release health

### Vercel
- Serverless function monitoring
- Performance metrics
- Real-time logs

## Rollback

To rollback to a previous version:

1. Go to Vercel dashboard
2. Navigate to the deployment
3. Select the version you want to rollback to
4. Click "Redeploy"

## Troubleshooting

### Deployment Fails
1. Check the GitHub Actions logs for errors
2. Verify all required secrets are set
3. Check environment variable configurations

### Build Fails
1. Run `npm run build` locally to identify issues
2. Check for TypeScript errors
3. Verify all dependencies are installed

### Monitoring Issues
1. Verify Sentry DSN is correctly configured
2. Check Sentry project permissions
3. Verify Vercel integration with Sentry
