# Club Claims Inbox MVP

A web application where club leads can drop in messy inputs (Google Sheets, photos, pasted notes) and get a calm, structured inbox of claims grouped by category.

## Key Principle

**Rows represent truths (claims). Files represent evidence.**

The UI shows claims by default; evidence is one tap away.

## Features

- 📋 **Multiple Input Methods**: Paste text, connect Google Sheets, or upload photos
- 🤖 **Smart Extraction**: AI-powered claim extraction with structured data parsing
- ✏️ **Fast Corrections**: Edit, merge, split, accept, or dispute claims quickly
- 📊 **Category Organization**: Claims grouped by Social, Volunteer, Fundraising, Attendance, Points, Admin
- 🔍 **Evidence Tracking**: Each claim links back to source documents
- 📈 **Confidence Levels**: Visual indicators for claim reliability
- 🎨 **Elegant UI**: Clean, calm interface inspired by thoughtful design

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (Postgres)
- **Storage**: Supabase Storage
- **AI**: OpenAI GPT-4
- **Styling**: Tailwind CSS with custom theme

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase project
- OpenAI API key
- (Optional) Google Cloud Console project for Sheets integration

### Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   
   Create a `.env.local` file with:
   ```bash
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Google OAuth (optional, for Sheets)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

   # App Config
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DEFAULT_CLUB_ID=a0000000-0000-0000-0000-000000000001
   ```

3. **Set up Supabase**:
   
   Run the migrations in your Supabase project:
   ```sql
   -- Run supabase/migrations/001_initial_schema.sql
   -- Then run supabase/seed.sql
   ```

   Or use the Supabase CLI:
   ```bash
   supabase db push
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open the app**: Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Paste Text

Click the "+" button and paste club requirement text. The AI will extract structured claims grouped by category.

### 2. Connect Google Sheet

Connect your Google account, select a spreadsheet, and import requirement data.

### 3. Upload Photos

Take photos of written requirements or printed sheets, and the OCR will extract text for processing.

### 4. Manage Claims

- **Expand** cards to see evidence and details
- **Edit** canonical text to correct extraction errors
- **Accept** claims to mark them as verified
- **Dispute** conflicting claims
- **Merge** duplicate claims
- **Split** combined claims into separate items

### 5. View Evidence

Click on any claim to see the source documents, photos, or sheet ranges that support it.

## Database Schema

- `clubs` - Club organizations
- `categories` - Requirement categories (Social, Volunteer, etc.)
- `sources` - Raw input files (sheets, photos, paste)
- `evidence_chunks` - Pieces of sources supporting claims
- `claims` - Extracted/canonical truths
- `claim_evidence` - Links claims to evidence
- `claim_history` - Audit log of all changes

## Project Structure

```
club_inbox/
├── app/
│   ├── api/           # API routes for sources, claims, mutations
│   ├── globals.css    # Jarvis-inspired design system
│   ├── layout.tsx     # Root layout
│   └── page.tsx       # Main inbox UI
├── components/        # React components
├── lib/
│   ├── supabase/      # Database clients
│   ├── extractors/    # AI extraction logic
│   ├── openai.ts      # OpenAI configuration
│   └── types.ts       # TypeScript types
└── supabase/
    ├── migrations/    # Database migrations
    └── seed.sql       # Seed data
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Design Philosophy

This app follows the "calm inbox" principle:

- **Default view is structured**, not chaotic
- **Evidence is secondary** to the extracted truth
- **Mutations are fast** and feel natural
- **Visual hierarchy is clear** with thoughtful color use
- **Trust is explicit** through confidence indicators

## License

MIT
