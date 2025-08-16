# 🚀 DEPLOYMENT STEPS - Use This Search

**Follow these steps exactly to get your website live on the internet.**

---

## 📋 **WHAT WE'RE DOING:**
We're taking your app from this development environment and putting it on the internet where customers can use it.

---

## 🔧 **STEP 1: CREATE GITHUB ACCOUNT & REPOSITORY**

### What is GitHub?
GitHub is like a "filing cabinet" for your code. It stores your app safely and lets hosting services access it.

### Steps:
1. **Go to**: https://github.com
2. **Click**: "Sign up" (if you don't have an account)
3. **Create account** with your email
4. **Click**: "New repository" (green button)
5. **Repository name**: `use-this-search`
6. **Make it**: Public
7. **Click**: "Create repository"

**✅ Result**: You now have a place to store your code online.

---

## 💾 **STEP 2: UPLOAD YOUR CODE TO GITHUB**

### What we're doing:
Moving your app code from this development environment to GitHub.

### Steps:
1. **Download all files** from this environment to your computer
2. **Upload to GitHub**:
   - Click "uploading an existing file"
   - Drag all your folders (frontend, backend, etc.)
   - Add message: "Initial deployment setup"
   - Click "Commit changes"

**✅ Result**: Your code is now safely stored on GitHub.

---

## 🗄️ **STEP 3: SET UP MONGODB ATLAS (DATABASE)**

### What is MongoDB Atlas?
This is where your app will store user accounts, searches, and subscription data.

### Steps:
1. **Go to**: https://www.mongodb.com/atlas
2. **Click**: "Try Free"
3. **Create account** with your email
4. **Choose**: "Shared" (free option)
5. **Cloud Provider**: AWS
6. **Region**: Choose closest to your location
7. **Cluster Name**: `use-this-search`
8. **Click**: "Create Cluster"

### Get Your Connection String:
1. **Click**: "Connect" on your cluster
2. **Choose**: "Connect your application"
3. **Copy** the connection string (looks like: `mongodb+srv://...`)
4. **Save this** - you'll need it later!

### Add Your IP Address:
1. **Click**: "Network Access" in left menu
2. **Click**: "Add IP Address"
3. **Click**: "Allow Access from Anywhere" (for now)
4. **Click**: "Confirm"

**✅ Result**: You have a database ready for your app.

---

## 🌊 **STEP 4: SET UP DIGITALOCEAN (HOSTING)**

### What is DigitalOcean?
This is the computer server that will run your app 24/7 on the internet.

### Steps:
1. **Go to**: https://www.digitalocean.com
2. **Click**: "Sign Up"
3. **Create account** with your email
4. **Verify email** and add payment method
5. **Go to**: "Apps" in the dashboard
6. **Click**: "Create App"

### Connect GitHub:
1. **Choose**: "GitHub"
2. **Sign in** to GitHub when prompted
3. **Choose**: your `use-this-search` repository
4. **Branch**: main
5. **Click**: "Next"

### Configure Frontend:
1. **Service Type**: Web Service
2. **Name**: frontend
3. **Source Directory**: /frontend
4. **Build Command**: `yarn build`
5. **Run Command**: `yarn serve`
6. **Click**: "Next"

### Add Backend:
1. **Click**: "Add Component"
2. **Service Type**: Web Service  
3. **Name**: backend
4. **Source Directory**: /backend
5. **Build Command**: `pip install -r requirements.txt`
6. **Run Command**: `uvicorn server:app --host 0.0.0.0 --port 8080`

**✅ Result**: Your app is being deployed to the internet!

---

## 🔐 **STEP 5: SET ENVIRONMENT VARIABLES**

### What are these?
Secret settings your app needs to work (like API keys and database passwords).

### In DigitalOcean App Settings:
1. **Go to**: App Settings → Environment
2. **Add these variables**:

**For Frontend:**
```
REACT_APP_BACKEND_URL = https://your-backend-name.ondigitalocean.app
```

**For Backend:**
```
MONGO_URL = your_mongodb_connection_string_from_step_3
STRIPE_SECRET_KEY = sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY = pk_live_your_stripe_key
DB_NAME = usethissearch
```

**✅ Result**: Your app can now connect to the database and payment system.

---

## 🌐 **STEP 6: CONNECT YOUR DOMAIN (IONOS)**

### Steps:
1. **Get your app URL** from DigitalOcean (looks like: `https://your-app.ondigitalocean.app`)
2. **Go to IONOS** control panel
3. **Find**: DNS settings for your domain
4. **Add CNAME record**:
   - Name: `www`
   - Value: `your-app.ondigitalocean.app`
5. **Add A record**:
   - Name: `@`
   - Value: (DigitalOcean will provide this IP)

### In DigitalOcean:
1. **Go to**: App Settings → Domains
2. **Click**: "Add Domain"
3. **Enter**: your domain name
4. **Click**: "Add Domain"

**✅ Result**: People can visit your website at your custom domain!

---

## 🧪 **STEP 7: TEST EVERYTHING**

### What to test:
1. **Visit your website** at your domain
2. **Create a trial account**
3. **Try a search**
4. **Test the upgrade process**
5. **Check admin panel** works

**✅ Result**: Your website is live and working!

---

## 💰 **COSTS SUMMARY:**
- **DigitalOcean**: ~$24-33/month
- **MongoDB Atlas**: Free (for small usage)
- **Domain**: Already paid at IONOS
- **Total**: ~$24-33/month

---

## 🆘 **IF YOU GET STUCK:**
1. **Check the deployment guide** (`deployment-guide.md`)
2. **Look at error messages** in DigitalOcean
3. **Most common issues**:
   - Wrong environment variables
   - GitHub connection problems
   - Database connection issues

---

## 🎉 **ONCE IT'S WORKING:**
You can use this exact same process for:
- GroupKeywords.com
- PostVelocity
- Your other 2 websites

Each one will cost ~$24-33/month and follow identical steps!