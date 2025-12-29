// Database types matching the Supabase schema

export type Club = {
  id: string;
  name: string;
  owner_user_id: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  club_id: string | null;
  key: string;
  label: string;
  order_index: number;
};

export type SourceType = 'google_sheet' | 'photo' | 'paste' | 'file';

export type Source = {
  id: string;
  club_id: string;
  type: SourceType;
  title: string;
  uri: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type EvidenceChunkKind = 'sheet_range' | 'ocr_text' | 'image_crop' | 'pasted_chunk';

export type EvidenceChunk = {
  id: string;
  source_id: string;
  club_id: string;
  kind: EvidenceChunkKind;
  text: string | null;
  crop: Record<string, unknown> | null;
  locator: Record<string, unknown> | null;
  created_at: string;
};

export type ClaimStatus = 'unreviewed' | 'accepted' | 'disputed' | 'outdated';
export type ClaimConfidence = 'low' | 'medium' | 'high';

export type Claim = {
  id: string;
  club_id: string;
  category_id: string;
  canonical_text: string;
  structured: Record<string, unknown>;
  status: ClaimStatus;
  confidence: ClaimConfidence;
  signature: string;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClaimEvidence = {
  claim_id: string;
  evidence_chunk_id: string;
  weight: number;
};

export type ClaimHistoryAction = 'create' | 'edit' | 'recategorize' | 'merge' | 'split' | 'status_change';

export type ClaimHistory = {
  id: string;
  claim_id: string;
  actor_user_id: string | null;
  action: ClaimHistoryAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
};

// Extraction output types (from LLM)
export type ExtractedItem = {
  raw_claim: string;
  normalized_claim: string;
  structured?: Record<string, unknown>;
  confidence: ClaimConfidence;
  evidence_refs: string[];
};

export type ExtractedCategory = {
  category_key: string;
  items: ExtractedItem[];
};

export type ExtractionOutput = {
  club_name_guess: string;
  categories: ExtractedCategory[];
  unassigned_items: ExtractedItem[];
};

// Structured claim data (optional, for parsing requirements)
export type ClaimStructured = {
  metric_type?: 'attendance' | 'points' | 'fundraising' | 'volunteer' | 'social' | 'admin' | 'unknown';
  requirement?: {
    quantity?: number;
    out_of?: number;
    unit?: string;
    cadence?: string;
  };
  exceptions?: string[];
  conditions?: string[];
  time_scope?: string;
};

