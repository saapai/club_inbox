# Club Claims Inbox - Setup Guide

## Prerequisites

1. **Node.js 18+** and npm installed
2. **Supabase Account** - Create a free account at [supabase.com](https://supabase.com)
3. **OpenAI API Key** - Get one from [platform.openai.com](https://platform.openai.com)
4. **(Optional) Google Cloud Console** - For Sheets integration

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a New Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details and wait for it to initialize

### 2.2 Run Database Migrations

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click "Run" to execute the migration
4. Copy and paste the contents of `supabase/seed.sql`
5. Click "Run" to seed the default club and categories

### 2.3 Create Storage Bucket for Photos

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `claim-photos`
3. Set it to **Public** (for MVP - in production, use signed URLs)

### 2.4 Get Your Supabase Credentials

1. Go to Project Settings > API
2. Copy the **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
3. Copy the **anon/public key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)
4. Copy the **service_role key** (SUPABASE_SERVICE_ROLE_KEY) - keep this secret!

## Step 3: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key_here

# Google OAuth (optional, for Sheets integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEFAULT_CLUB_ID=a0000000-0000-0000-0000-000000000001
```

## Step 4: (Optional) Set Up Google Sheets Integration

### 4.1 Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API** and **Google Drive API**

### 4.2 Create OAuth 2.0 Credentials

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy the **Client ID** and **Client Secret**
6. Add them to your `.env.local` file

## Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Test the Application

### Test Paste Text Ingestion

1. Click the "+ Add" button in the top right
2. Select "Paste Text"
3. Paste some club requirements, for example:

```
AIM Club Requirements:
- Attend 6 out of 8 general meetings per quarter
- Complete 15 volunteer hours per semester
- Raise $50 for fundraising
- Attend at least 2 social events
```

4. Click "extract claims"
5. Wait for the AI to process and extract claims
6. View the extracted claims in the inbox

### Test Google Sheets (if configured)

1. Click "+ Add" > "Connect Sheet"
2. Authorize your Google account
3. Select a spreadsheet with club requirements
4. Specify the range (e.g., "Sheet1!A1:Z100")
5. Click "import sheet"

### Test Photo Upload

1. Click "+ Add" > "Upload Photos"
2. Drag and drop or select images of written requirements
3. Click "upload & extract"
4. Wait for OCR processing

### Test Mutations

1. Click on any claim card to expand it
2. Try the following actions:
   - **Edit**: Modify the canonical text
   - **Accept**: Mark the claim as verified
   - **Dispute**: Flag conflicting information
   - **History**: View all changes made to the claim

## Troubleshooting

### "Failed to fetch categories"

- Check that your Supabase credentials are correct in `.env.local`
- Verify that the migrations ran successfully
- Check that the seed data was inserted

### "Failed to extract claims"

- Verify your OpenAI API key is correct
- Check that you have sufficient API credits
- Look at the browser console for detailed error messages

### "Not authenticated" for Google Sheets

- Verify your Google OAuth credentials are correct
- Make sure the redirect URI matches exactly
- Check that the Google Sheets API is enabled

### Photos not uploading

- Verify the `claim-photos` bucket exists in Supabase Storage
- Check that the bucket is set to Public
- Ensure file sizes are reasonable (< 10MB)

## Production Deployment

### Environment Variables

Make sure to set all environment variables in your production environment (Vercel, Netlify, etc.)

### Security Considerations

1. **Never commit `.env.local`** to version control
2. Use **Row Level Security (RLS)** policies in Supabase for production
3. Implement proper **user authentication** (currently in demo mode)
4. Use **signed URLs** for Supabase Storage instead of public buckets
5. Add **rate limiting** to API endpoints
6. Validate and sanitize all user inputs

### Database

- Run migrations in your production Supabase instance
- Update `DEFAULT_CLUB_ID` to your actual club ID
- Consider adding indexes for better performance at scale

## Next Steps

- Implement user authentication (Supabase Auth)
- Add search functionality
- Implement Compare Mode for multi-club comparison
- Add email notifications for disputed claims
- Create admin dashboard for managing clubs
- Add export functionality (CSV, PDF)

## Support

For issues or questions:
- Check the [README.md](README.md) for architecture details
- Review the code comments in key files
- Open an issue on GitHub

