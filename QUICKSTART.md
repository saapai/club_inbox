# Quick Start Guide

Get the Club Claims Inbox MVP running in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- An OpenAI API key

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Set Up Supabase (3 min)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/seed.sql`
3. Go to Storage and create a public bucket called `claim-photos`
4. Copy your credentials from Project Settings > API

## Step 3: Configure Environment (2 min)

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEFAULT_CLUB_ID=a0000000-0000-0000-0000-000000000001
```

## Step 4: Run the App (1 min)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 5: Test It Out (3 min)

1. Click **+ Add** → **Paste Text**
2. Paste this example:

```
AIM Club Requirements:
- Attend 6 out of 8 general meetings per quarter
- Complete 15 volunteer hours per semester  
- Raise $50 for fundraising
- Attend at least 2 social events per quarter
- Submit weekly reports on time
```

3. Click **extract claims**
4. Wait 10-20 seconds for AI processing
5. See your claims appear grouped by category!

## What You Can Do

- ✏️ **Edit** any claim to fix extraction errors
- ✅ **Accept** claims to mark them as verified
- ⚠️ **Dispute** conflicting information
- 📜 **View History** to see all changes
- 📊 **Connect Sheet** (requires Google OAuth setup)
- 📷 **Upload Photos** for OCR extraction

## Need Help?

- Check [SETUP.md](SETUP.md) for detailed instructions
- Review [README.md](README.md) for architecture details
- See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for technical overview

## Optional: Google Sheets (5 min)

1. Create a Google Cloud project
2. Enable Google Sheets API and Drive API
3. Create OAuth 2.0 credentials
4. Add to `.env.local`:

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

5. Restart the dev server

## Common Issues

**"Failed to fetch categories"**
- Check Supabase credentials
- Verify migrations ran successfully

**"Failed to extract claims"**
- Verify OpenAI API key
- Check you have API credits

**Photos not uploading**
- Verify `claim-photos` bucket exists
- Check bucket is set to Public

## Next Steps

- Add more club requirements
- Try different input methods
- Explore the mutations (edit, accept, dispute)
- View evidence in expanded claim cards
- Check out the claim history

Enjoy building your calm, structured claims inbox! 🎉

