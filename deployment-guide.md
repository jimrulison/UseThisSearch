# Use This Search - Deployment Guide

This guide will help you deploy your "Use This Search" application to the internet.

## What You'll Need:
1. GitHub account (free)
2. DigitalOcean account 
3. MongoDB Atlas account (free)
4. Your Stripe API keys
5. Your domain from IONOS

## Step-by-Step Deployment Process:

### STEP 1: Set Up GitHub Repository
1. Go to github.com and create account (if you don't have one)
2. Create a new repository called "use-this-search"
3. Upload your code to this repository

### STEP 2: Set Up MongoDB Atlas (Database)
1. Go to mongodb.com/atlas
2. Create free account
3. Create a new cluster (database)
4. Get your connection string
5. Add your IP address to allowed connections

### STEP 3: Set Up DigitalOcean App Platform
1. Go to digitalocean.com
2. Create account
3. Connect your GitHub repository
4. Configure environment variables
5. Deploy your app

### STEP 4: Configure Your Domain
1. In your IONOS control panel
2. Update DNS settings to point to DigitalOcean
3. Add custom domain in DigitalOcean

### STEP 5: Test Everything
1. Verify your website loads
2. Test login functionality
3. Test payment processing
4. Verify all features work

## Environment Variables You'll Need:

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

**Backend (.env):**
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Estimated Costs:
- DigitalOcean: $24-33/month per site
- MongoDB Atlas: Free (for small sites) or $9/month
- Domain: ~$12/year (already paid at IONOS)

## Support:
If you get stuck at any step, the deployment process includes:
1. Clear error messages
2. Step-by-step troubleshooting
3. Documentation links
4. Community support

## Security Checklist:
- ✅ Environment variables are set as secrets
- ✅ Database has authentication enabled
- ✅ HTTPS is automatically enabled
- ✅ API keys are not exposed in code