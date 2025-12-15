# Netlify Deployment Guide

## Overview
This Restaurant POS application is configured for easy deployment on Netlify with automatic builds from the main branch.

## Fixed Issues
The following errors have been fixed before deployment:
1. ✅ Added `@react-oauth/google` package for Google OAuth support
2. ✅ Implemented GoogleLogin component in Login.tsx
3. ✅ Wrapped App with GoogleOAuthProvider for OAuth context
4. ✅ Added netlify.toml configuration for automated builds

## Quick Start Deployment

### Method 1: Connect GitHub to Netlify (Recommended)

1. **Go to Netlify**: https://app.netlify.com
2. **Sign Up/Log In** with your GitHub account
3. **Click "New site from Git"** or "Add new site"
4. **Select GitHub** as your Git provider
5. **Authorize Netlify** to access your repositories
6. **Select the repository**: `SETHUABI/backend`
7. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18.x (auto-detected from netlify.toml)
8. **Click "Deploy site"**
9. Netlify will automatically:
   - Build your project
   - Deploy to a live URL
   - Set up auto-deployments on every push to main

### Method 2: Deploy from CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

## Environment Variables Setup

### For Google OAuth

1. **Get Google OAuth Credentials**:
   - Go to: https://console.cloud.google.com
   - Create a new project
   - Enable Google+ API
   - Create OAuth 2.0 credentials (Web application)
   - Copy your Client ID

2. **Update App.tsx**:
   - Replace `YOUR_GOOGLE_CLIENT_ID` in src/App.tsx line 21 with your actual Client ID
   - Or set as Netlify environment variable

3. **Add to Netlify** (Optional):
   - Go to Site Settings > Build & Deploy > Environment
   - Add variable: `VITE_GOOGLE_CLIENT_ID=your_client_id_here`
   - Update App.tsx to use: `process.env.VITE_GOOGLE_CLIENT_ID`

## Build Configuration

The `netlify.toml` file includes:
- **Build Command**: `npm run build` (Vite production build)
- **Publish Directory**: `dist` (Vite output folder)
- **Node Version**: 18.x
- **URL Rewriting**: Single-page app routing support
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, XSS Protection

## Testing Locally

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Post-Deployment

1. **Test the Live App**:
   - Visit your Netlify site URL
   - Test username/password login (admin/admin123)
   - Test Google OAuth login button

2. **Configure Custom Domain** (Optional):
   - Site Settings > Domain Management
   - Add your custom domain
   - Update Google OAuth redirect URIs to match your domain

3. **Monitor Deployment**:
   - Netlify shows build logs and deployment status
   - Check Site Settings > Build & Deploy > Deploys
   - Enable auto-deploys on every push

## Troubleshooting

### Build Fails
- Check build logs in Netlify Dashboard
- Ensure all dependencies are in package.json
- Verify Node version compatibility

### Google Login Not Working
- Verify Client ID is correctly set
- Check Google Console redirect URIs match your Netlify domain
- Test in browser console: `window.google` should be defined

### CORS Issues
- Check cloud.ts API endpoints are accessible
- Ensure Google Apps Script Web App has public access

## Additional Resources
- [Netlify Docs](https://docs.netlify.com)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)
