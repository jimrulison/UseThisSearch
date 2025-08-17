# 🚀 Railway Deployment Guide - Use This Search

## Quick & Easy Railway Deployment (30 minutes total)

### Why Railway?
- ✅ One-click GitHub deployment
- ✅ Built-in MongoDB hosting
- ✅ Automatic SSL certificates
- ✅ Simple environment variable management
- ✅ Perfect for scaling to 5+ websites
- ✅ Much more reliable than DigitalOcean

---

## STEP 1: Prepare Your Repository

1. **Push to GitHub**: Make sure your latest code is pushed to your GitHub repository
2. **Verify Files**: Ensure these files exist in your repo:
   - `railway.toml` ✅
   - `nixpacks.toml` ✅
   - `backend/requirements.txt` ✅ (cleaned up)
   - `frontend/package.json` ✅

---

## STEP 2: Deploy Backend to Railway

1. **Go to**: https://railway.app
2. **Sign in** with GitHub
3. **Click**: "New Project"
4. **Select**: "Deploy from GitHub repo"
5. **Choose**: Your repository (`jimrulison/UseThisSearch`)
6. **Service Name**: "usethissearch-backend"

### Set Environment Variables:
In Railway dashboard, go to your service → Variables tab:

```bash
MONGO_URL=mongodb://localhost:27017  # Railway will provide this
DB_NAME=usethissearch
CLAUDE_API_KEY=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
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

## STEP 3: Add MongoDB Database

1. **In your Railway project**: Click "Add Service"
2. **Select**: "Database" → "MongoDB"
3. **Railway will automatically**:
   - Create a MongoDB instance
   - Generate connection string
   - Make it available to your backend

4. **Update your backend variables**:
   ```bash
   MONGO_URL=${{MongoDB.DATABASE_URL}}
   ```

---

## STEP 4: Deploy Frontend

1. **Add another service**: Click "Add Service" → "GitHub Repo"
2. **Choose**: Same repository
3. **Service Name**: "usethissearch-frontend"
4. **Root Directory**: `frontend`

### Frontend Environment Variables:
```bash
REACT_APP_BACKEND_URL=${{usethissearch-backend.PUBLIC_URL}}
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

---

## STEP 5: Configure Domain (Optional)

1. **Get your Railway URLs**:
   - Frontend: `https://usethissearch-frontend-production.up.railway.app`
   - Backend: `https://usethissearch-backend-production.up.railway.app`

2. **Custom Domain** (if you want):
   - Go to Frontend service → Settings → Domains
   - Add your custom domain
   - Update DNS at IONOS

---

## STEP 6: Test Everything

1. **Visit your frontend URL**
2. **Test user registration**
3. **Try searches**
4. **Test admin panel**: `/admin/login`
   - Email: JimRulison@gmail.com
   - Password: JR09mar05

---

## Cost Comparison

| Service | DigitalOcean | Railway |
|---------|--------------|---------|
| Backend | $12/month | $5/month |
| Frontend | $12/month | $5/month |
| Database | $25/month | $5/month |
| **Total** | **$49/month** | **$15/month** |

**💰 Railway saves you $34/month per website!**

---

## Scaling to 5 Websites

Each additional website costs only **$15/month** on Railway vs **$49/month** on DigitalOcean.

**Total for 5 websites**:
- Railway: $75/month
- DigitalOcean: $245/month
- **You save: $170/month!**

---

## Troubleshooting

**Build Fails**: Check the Railway build logs, usually dependency issues
**Database Connection**: Ensure MONGO_URL uses the Railway variable format
**Environment Variables**: Double-check all variables are set correctly

**Railway Support**: Excellent community and support team

---

## 🎉 Success!

Your app should now be live and working perfectly on Railway. The deployment is much more stable and cost-effective than DigitalOcean.

**Next**: Deploy your other websites using the same process!