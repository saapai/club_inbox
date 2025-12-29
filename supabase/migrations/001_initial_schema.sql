-- Club Claims Inbox - Initial Schema Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clubs table
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table (can be club-specific or global defaults)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  UNIQUE(club_id, key)
);

-- Create index for faster category lookups
CREATE INDEX idx_categories_club_id ON categories(club_id);
CREATE INDEX idx_categories_order ON categories(club_id, order_index);

-- Sources table (raw inputs: sheets, photos, paste)
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('google_sheet', 'photo', 'paste', 'file')),
  title TEXT NOT NULL,
  uri TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sources_club_id ON sources(club_id);
CREATE INDEX idx_sources_type ON sources(type);

-- Evidence chunks (pieces of sources that support claims)
CREATE TABLE evidence_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('sheet_range', 'ocr_text', 'image_crop', 'pasted_chunk')),
  text TEXT,
  crop JSONB,
  locator JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidence_chunks_source_id ON evidence_chunks(source_id);
CREATE INDEX idx_evidence_chunks_club_id ON evidence_chunks(club_id);

-- Claims table (extracted/canonical truths)
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  canonical_text TEXT NOT NULL,
  structured JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'unreviewed' CHECK (status IN ('unreviewed', 'accepted', 'disputed', 'outdated')),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
  signature TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claims_club_id ON claims(club_id);
CREATE INDEX idx_claims_category_id ON claims(category_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_signature ON claims(club_id, signature);

-- Claim evidence junction table (many-to-many)
CREATE TABLE claim_evidence (
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  evidence_chunk_id UUID NOT NULL REFERENCES evidence_chunks(id) ON DELETE CASCADE,
  weight REAL DEFAULT 1.0,
  PRIMARY KEY (claim_id, evidence_chunk_id)
);

CREATE INDEX idx_claim_evidence_claim_id ON claim_evidence(claim_id);
CREATE INDEX idx_claim_evidence_evidence_id ON claim_evidence(evidence_chunk_id);

-- Claim history (audit log for mutations)
CREATE TABLE claim_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  actor_user_id UUID,
  action TEXT NOT NULL CHECK (action IN ('create', 'edit', 'recategorize', 'merge', 'split', 'status_change')),
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_claim_history_claim_id ON claim_history(claim_id);
CREATE INDEX idx_claim_history_created_at ON claim_history(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on claims
CREATE TRIGGER update_claims_updated_at 
  BEFORE UPDATE ON claims 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for demo mode
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_history ENABLE ROW LEVEL SECURITY;

-- Demo mode: Allow all operations (we'll add proper auth later)
-- These policies allow anonymous access for MVP demo mode
CREATE POLICY "Allow all operations on clubs" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sources" ON sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on evidence_chunks" ON evidence_chunks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on claims" ON claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on claim_evidence" ON claim_evidence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on claim_history" ON claim_history FOR ALL USING (true) WITH CHECK (true);

