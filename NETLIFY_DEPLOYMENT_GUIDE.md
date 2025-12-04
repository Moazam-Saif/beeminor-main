# 🚀 Netlify Deployment Guide for Beeminor

## Overview
This guide covers deploying your Beeminor app to Netlify with GitHub integration, using **manual deployment only** to keep your live site safe.

---

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ GitHub repository with your code
- ✅ Netlify account (free tier works fine)
- ✅ Production backend URL (where your API is hosted)
- ✅ MongoDB Atlas (or production database) ready
- ✅ Email credentials configured (Gmail app password)

---

## 🔧 Step 1: Prepare Your Environment Variables

### Backend Environment Variables (.env)
Create/update `backend/.env` with production values:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/beeminor?retryWrites=true&w=majority

# Server
PORT=3001
NODE_ENV=production

# Email Configuration
EMAIL_USER=saifmoazam9@gmail.com
EMAIL_PASSWORD=aixueogdhyktpycj
EMAIL_FROM=Beeminor <noreply@beeminor.com>
ADMIN_EMAIL=saifmoazam2@gmail.com

# Frontend URL (for email links)
FRONTEND_URL=https://your-app-name.netlify.app
# Alternative: APP_URL=https://your-app-name.netlify.app

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_use_random_string
```

### Frontend Environment Variables (Netlify Dashboard)
You'll configure these in Netlify later:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend-url.com
EXPO_PUBLIC_APP_URL=https://your-app-name.netlify.app
NODE_ENV=production
```

---

## 🔗 Step 2: Connect GitHub to Netlify

### Option A: Via Netlify Dashboard (Recommended)

1. **Login to Netlify**
   - Go to https://app.netlify.com
   - Sign in or create account

2. **Create New Site**
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"

3. **Authorize GitHub**
   - Click "Authorize Netlify"
   - Select your GitHub organization/account
   - Choose the `beeminor-main` repository

4. **Configure Build Settings**
   ```
   Build command: npx expo export --platform web
   Publish directory: dist/
   Base directory: (leave empty)
   ```

5. **IMPORTANT: Disable Auto-Deploy**
   - After site is created, go to: Site Settings → Build & deploy → Build settings
   - Under "Build settings", find "Auto publishing"
   - Click "Edit settings" and set to **"Off"** or **"Stop builds"**
   - This ensures manual deploy only!

### Option B: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link your repository
netlify init

# Follow prompts:
# - Create & configure a new site
# - Select GitHub as git provider
# - Choose your repository
# - Build command: npx expo export --platform web
# - Publish directory: dist/
```

---

## ⚙️ Step 3: Configure Netlify Build Settings

### In Netlify Dashboard

1. **Go to Site Settings → Environment Variables**

2. **Add Frontend Environment Variables:**
   ```
   EXPO_PUBLIC_API_BASE_URL = https://your-backend-api.com
   EXPO_PUBLIC_APP_URL = https://your-app-name.netlify.app
   NODE_ENV = production
   ```

3. **Configure Build Settings:**
   - Site Settings → Build & deploy → Build settings
   - Build command: `npx expo export --platform web`
   - Publish directory: `dist/`
   - Production branch: `main` (or your default branch)

4. **Deploy Notifications (Optional):**
   - Site Settings → Build & deploy → Deploy notifications
   - Set up email/Slack notifications for failed builds

---

## 🚀 Step 4: Manual Deployment

### Method 1: Via Netlify Dashboard

1. Go to your site in Netlify Dashboard
2. Click "Deploys" tab
3. Click "Trigger deploy" → "Deploy site"
4. Wait for build to complete (check logs for errors)
5. Once complete, visit your site URL

### Method 2: Via Netlify CLI

```bash
# Build your app locally first (optional but recommended)
npx expo export --platform web

# Deploy to production
netlify deploy --prod

# Or deploy to preview first
netlify deploy

# Then promote to production
netlify deploy --prod
```

### Method 3: Via Git Push + Manual Trigger

Since auto-deploy is disabled, you can:
1. Push changes to GitHub
2. Go to Netlify Dashboard → Deploys
3. Click "Trigger deploy" → "Clear cache and deploy site"

---

## 🔒 Step 5: Update Backend Environment

After deploying frontend, update your **backend** `.env`:

```env
# Update this with your actual Netlify URL
FRONTEND_URL=https://your-actual-app.netlify.app

# Or if using APP_URL
APP_URL=https://your-actual-app.netlify.app
```

This ensures:
- ✅ Email notification links point to production admin panel
- ✅ Referral invite links use production URL
- ✅ All frontend URLs are correct

**Restart your backend server** after updating!

---

## 🧪 Step 6: Testing Your Deployment

### Test Checklist

1. **Frontend Loading**
   - [ ] Visit your Netlify URL
   - [ ] Check console for errors (F12)
   - [ ] Verify app loads correctly

2. **Backend Connection**
   - [ ] Test login/signup
   - [ ] Check if API calls work
   - [ ] Verify data loads from database

3. **Email Notifications**
   - [ ] Submit a test withdrawal
   - [ ] Check admin email receives notification
   - [ ] Click admin panel link in email
   - [ ] Verify link goes to production URL

4. **Referral System**
   - [ ] Go to Tasks/Taches screen
   - [ ] Copy invite link
   - [ ] Verify link contains production URL (not localhost)
   - [ ] Test sharing referral code

5. **Exchange & Wallet**
   - [ ] Test diamond/BVR to flowers exchange
   - [ ] Verify database updates
   - [ ] Test withdrawal submission

---

## 🔧 Troubleshooting

### Build Fails on Netlify

**Error:** `npm ERESOLVE could not resolve` - React peer dependency conflict
```bash
# Solution: The .npmrc file is already configured with legacy-peer-deps=true
# This is needed because lucide-react-native requires React 18, but we use React 19
# If you removed .npmrc, recreate it with:
echo "legacy-peer-deps=true" > .npmrc
git add .npmrc
git commit -m "Add .npmrc for peer dependency resolution"
git push
```

**Error:** `Module not found` or dependency errors
```bash
# Solution: Ensure package.json has all dependencies
npm install
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

**Error:** `expo: command not found`
```bash
# Solution: Add to package.json scripts:
"scripts": {
  "build": "npx expo export --platform web",
  "predeploy": "npm run build"
}
```

### API Connection Fails

**Error:** Network request failed or CORS errors

**Solution:**
1. Verify `EXPO_PUBLIC_API_BASE_URL` in Netlify environment variables
2. Check backend CORS settings allow your Netlify domain
3. Ensure backend is running and accessible

```javascript
// backend/server.js or index.ts
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:8081',
    'https://your-app.netlify.app', // Add your Netlify URL
  ],
  credentials: true
}));
```

### Email Links Still Use Localhost

**Error:** Email admin panel link goes to `http://localhost:8081/admin`

**Solution:**
1. Check backend `.env` has correct `FRONTEND_URL`
2. Restart backend server
3. Test new withdrawal request

```bash
# Check if variable is loaded
console.log('Frontend URL:', process.env.FRONTEND_URL);
```

### Referral Links Use Localhost

**Error:** Copied invite link is `http://localhost:8081/invite/ABC123`

**Solution:**
1. Verify `EXPO_PUBLIC_APP_URL` in Netlify environment variables
2. Redeploy frontend
3. Clear cache: Netlify Dashboard → Deploys → Trigger deploy → "Clear cache and deploy"

---

## 📝 Environment Variables Reference

### Frontend (Netlify)
| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://api.beeminor.com` | ✅ Yes | Backend API URL |
| `EXPO_PUBLIC_APP_URL` | `https://beeminor.netlify.app` | ✅ Yes | Frontend URL for referral links |
| `NODE_ENV` | `production` | ⚠️ Auto-set | Environment mode |

### Backend (Server)
| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `FRONTEND_URL` or `APP_URL` | `https://beeminor.netlify.app` | ✅ Yes | Frontend URL for email links |
| `MONGODB_URI` | `mongodb+srv://...` | ✅ Yes | Database connection |
| `EMAIL_USER` | `sender@gmail.com` | ✅ Yes | Gmail sender |
| `EMAIL_PASSWORD` | `app_password` | ✅ Yes | Gmail app password |
| `ADMIN_EMAIL` | `admin@beeminor.com` | ✅ Yes | Admin notification recipient |
| `PORT` | `3001` | ⚠️ Optional | Server port |
| `JWT_SECRET` | `random_secret_key` | ✅ Yes | JWT signing key |

---

## 🔄 Deployment Workflow

### Regular Updates (Manual Deploy)

1. **Make changes locally**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Deploy to Netlify**
   - Go to Netlify Dashboard
   - Click "Trigger deploy" → "Deploy site"
   - Wait for build completion
   - Test changes on production

### Emergency Rollback

If something breaks:

1. **Via Netlify Dashboard:**
   - Deploys tab → Find previous working deploy
   - Click "..." → "Publish deploy"
   - Your site instantly reverts to that version

2. **Via CLI:**
   ```bash
   netlify rollback
   ```

---

## 🎯 Quick Reference

### Key Files Created/Modified

1. **`netlify.toml`** - Netlify configuration (build settings, headers)
2. **`backend/services/notificationService.js`** - Updated admin panel links
3. **`app/(tabs)/taches/index.tsx`** - Updated referral invite links
4. **`lib/api.ts`** - Already configured for dynamic API URL

### Production URLs To Set

1. **Frontend:** Your Netlify URL (e.g., `beeminor.netlify.app`)
2. **Backend:** Your API server URL (Railway, Render, Heroku, etc.)
3. **Update Both:** Frontend env vars + Backend env vars

### Manual Deploy Commands

```bash
# Preview deploy
netlify deploy

# Production deploy
netlify deploy --prod

# Check deploy status
netlify status

# View logs
netlify logs
```

---

## 📚 Additional Resources

- [Netlify Docs - Expo](https://docs.netlify.com/frameworks/expo/)
- [Expo Web Deployment](https://docs.expo.dev/distribution/publishing-websites/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Netlify CLI Reference](https://docs.netlify.com/cli/get-started/)

---

## ✅ Post-Deployment Checklist

- [ ] Frontend deploys successfully to Netlify
- [ ] Backend environment variables updated with production URLs
- [ ] API connection working (test login/signup)
- [ ] Email notifications send with correct admin panel link
- [ ] Referral invite links use production URL
- [ ] Exchange system saves to database
- [ ] Wallet withdrawal creates backend transactions
- [ ] Admin panel accessible and functional
- [ ] Auto-deploy is DISABLED (manual only)
- [ ] Both frontend and backend `.env` files documented

---

## 🆘 Need Help?

If you encounter issues:

1. Check Netlify deploy logs: Dashboard → Deploys → [Deploy] → Deploy log
2. Check browser console: F12 → Console tab
3. Check backend logs on your server
4. Verify all environment variables are set correctly
5. Test locally first: `npx expo export --platform web` then check `dist/` folder

---

**Deployment Date:** {{ DATE }}  
**Deployed By:** {{ YOUR_NAME }}  
**Version:** 1.0.0

🎉 **Your Beeminor app is now ready for production deployment!**
