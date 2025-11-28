# 🚀 TreeListy - Netlify Deployment Guide

This guide will walk you through deploying TreeListy to Netlify with full AI functionality.

---

## Prerequisites

1. **GitHub account** (to push your code)
2. **Netlify account** (free tier is fine - sign up at https://netlify.com)
3. **Anthropic API key** (from https://console.anthropic.com)

---

## Step 1: Push to GitHub

### Option A: Create New Repo (if you don't have one yet)

1. Go to https://github.com/new
2. Name it `treelisty` (or whatever you prefer)
3. Make it **Public** or **Private** (your choice)
4. **Don't** initialize with README (we already have files)
5. Click "Create repository"

### Option B: Initialize Git Locally

```bash
cd "D:\OneDrive\Desktop\Production Versions\treeplexity"

# Initialize git (if not already)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - TreeListy with Analysis Mode"

# Add your GitHub repo as remote (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR_USERNAME/treelisty.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Netlify

### Connect GitHub to Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site" → "Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. **Authorize Netlify** to access your GitHub account
5. **Select your repository** (`treelisty` or whatever you named it)

### Configure Build Settings

Netlify should auto-detect the configuration from `netlify.toml`, but verify:

- **Build command:** (leave blank - static site)
- **Publish directory:** `.` (root directory)
- **Functions directory:** `netlify/functions`

Click **"Deploy site"**

---

## Step 3: Configure Environment Variables

This is **CRITICAL** - the AI won't work without this!

1. In your Netlify dashboard, go to **Site settings**
2. Click **"Environment variables"** (left sidebar)
3. Click **"Add a variable"**
4. Add this variable:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** (paste your Anthropic API key - starts with `sk-ant-`)
   - **Scopes:** Check "All scopes" or at least "Functions"
5. Click **"Create variable"**

### Get Your Anthropic API Key

If you don't have one:
1. Go to https://console.anthropic.com/settings/keys
2. Click **"Create Key"**
3. Copy it (starts with `sk-ant-`)
4. Paste it into Netlify environment variable

---

## Step 4: Trigger Redeploy

After adding the environment variable:

1. Go to **"Deploys"** tab in Netlify
2. Click **"Trigger deploy" → "Deploy site"**
3. Wait ~1-2 minutes for deployment to complete

---

## Step 5: Test Your Deployed Site!

1. Netlify will give you a URL like: `https://YOUR-SITE-NAME.netlify.app`
2. **Click the URL** to open your deployed TreeListy
3. **Test Analysis Mode:**
   - Click "🔍 Analyze Text"
   - It should NOT ask for an API key (that's handled server-side now!)
   - Paste test text
   - Click "🔍 Analyze"
   - Should work without CORS errors!

---

## Step 6: Custom Domain (Optional)

Want a custom domain like `treelisty.com`?

1. In Netlify, go to **"Domain settings"**
2. Click **"Add custom domain"**
3. Follow instructions to:
   - Buy a domain (or use one you own)
   - Update DNS records
   - Enable HTTPS (automatic via Let's Encrypt)

---

## Troubleshooting

### "API key not configured" error

**Problem:** Environment variable not set or misspelled

**Solution:**
1. Go to Site settings → Environment variables
2. Verify `ANTHROPIC_API_KEY` is spelled exactly right
3. Make sure value starts with `sk-ant-`
4. Trigger a redeploy

### "Function not found (404)" error

**Problem:** Serverless function didn't deploy

**Solution:**
1. Check that `netlify/functions/claude-proxy.js` exists in your repo
2. Check deploy logs for errors
3. Make sure `netlify.toml` has `functions = "netlify/functions"`
4. Trigger redeploy

### "CORS error" even on deployed site

**Problem:** You might still have local API key set

**Solution:**
1. Open browser console (F12)
2. Type: `sessionStorage.clear()`
3. Refresh the page
4. The deployed site should use the serverless function automatically

---

## Architecture Overview

```
┌─────────────┐
│   Browser   │
│ (TreeListy) │
└──────┬──────┘
       │
       │ AJAX Request
       ▼
┌─────────────────────────────┐
│  Netlify Serverless Function│
│  /claude-proxy              │
│  (Has API key server-side)  │
└──────┬──────────────────────┘
       │
       │ API Call
       ▼
┌─────────────────┐
│  Anthropic API  │
│  (Claude)       │
└─────────────────┘
```

**Benefits:**
- ✅ No CORS issues
- ✅ API key stays secure (never exposed to browser)
- ✅ Works on any device
- ✅ No local proxy needed
- ✅ Fast and reliable

---

## Cost Estimate

### Netlify (Free Tier)
- ✅ 100GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ 125,000 serverless function calls/month
- **Cost: $0** (for normal usage)

### Anthropic API
- Pattern detection: ~$0.01 per analysis
- Quick Mode conversion: ~$0.01-0.02
- Deep Mode conversion: ~$0.03-0.05
- **Cost: ~$0.03-0.06 per full analysis**

If you analyze 100 texts per month = ~$5/month

---

## Next Steps

Once deployed:

1. ✅ **Share the URL** with others (if public)
2. ✅ **Test all features** (AI, export, dependencies)
3. ✅ **Monitor usage** in Netlify dashboard
4. ✅ **Check API costs** in Anthropic console

---

## Support

If you encounter issues:

1. **Check deploy logs** in Netlify dashboard
2. **Check function logs** in Netlify → Functions tab
3. **Open browser console** (F12) for client-side errors
4. **Check Anthropic console** for API usage/errors

---

**Congratulations! 🎉 TreeListy is now live on Netlify!**

Your Analysis Mode will work smoothly without any CORS issues or timeouts.
