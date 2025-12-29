# Vercel Deployment Setup

Your project has been linked to Vercel! Here's how to complete the setup.

## Project Details

- **Project Name**: `club_inbox`
- **Team**: `jarvis-projects-4cd7bb69`
- **Preview URL**: https://clubinbox-g06vzf44y-jarvis-projects-4cd7bb69.vercel.app
- **Production URL**: https://clubinbox-g06vzf44y-jarvis-projects-4cd7bb69.vercel.app

## Step 1: Set Environment Variables

The build failed because environment variables aren't set. Add them in Vercel:

### Option A: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/jarvis-projects-4cd7bb69/club_inbox/settings/environment-variables
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_key
NEXT_PUBLIC_APP_URL=https://clubinbox-g06vzf44y-jarvis-projects-4cd7bb69.vercel.app
DEFAULT_CLUB_ID=a0000000-0000-0000-0000-000000000001
```

**For Google Sheets (optional):**
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://clubinbox-g06vzf44y-jarvis-projects-4cd7bb69.vercel.app/api/auth/google/callback
```

3. Make sure to set them for **Production**, **Preview**, and **Development** environments
4. Click "Save"

### Option B: Via Vercel CLI

```bash
# Set each variable
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add DEFAULT_CLUB_ID

# Optional: Google OAuth
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_REDIRECT_URI
```

## Step 2: Redeploy

After setting environment variables, trigger a new deployment:

```bash
vercel --prod
```

Or redeploy from the Vercel dashboard:
1. Go to: https://vercel.com/jarvis-projects-4cd7bb69/club_inbox
2. Click "Redeploy" on the latest deployment

## Step 3: Update Google OAuth Redirect URI

If you're using Google Sheets integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add this authorized redirect URI:
   ```
   https://clubinbox-g06vzf44y-jarvis-projects-4cd7bb69.vercel.app/api/auth/google/callback
   ```

## Step 4: Verify Deployment

1. Visit your production URL
2. Test paste text ingestion
3. Check that claims are extracted correctly

## Useful Commands

```bash
# View project info
vercel ls

# View environment variables
vercel env ls

# Deploy to production
vercel --prod

# Deploy preview
vercel

# View logs
vercel logs
```

## Troubleshooting

### Build Fails
- Check that all required environment variables are set
- Verify Supabase credentials are correct
- Check build logs in Vercel dashboard

### Runtime Errors
- Check function logs in Vercel dashboard
- Verify API routes are working
- Test with `vercel dev` locally first

### Environment Variables Not Working
- Make sure they're set for the correct environment (Production/Preview)
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

## Next Steps

1. ✅ Set environment variables
2. ✅ Redeploy
3. ✅ Test the application
4. ✅ Set up custom domain (optional)
5. ✅ Configure automatic deployments from Git (optional)

## Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Git Integration (Optional)

1. Connect your GitHub/GitLab/Bitbucket repository
2. Enable automatic deployments
3. Every push to main will deploy to production

---

**Project Status**: ✅ Linked to Vercel
**Next Action**: Set environment variables and redeploy

