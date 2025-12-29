'use client';

import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import CategoryRail from '@/components/CategoryRail';
import ClaimCard from '@/components/ClaimCard';
import PasteModal from '@/components/PasteModal';
import EditModal from '@/components/EditModal';
import SheetsModal from '@/components/SheetsModal';
import PhotoModal from '@/components/PhotoModal';
import HistoryModal from '@/components/HistoryModal';
import { Category, Claim, EvidenceChunk } from '@/lib/types';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [evidenceMap, setEvidenceMap] = useState<Record<string, EvidenceChunk[]>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [claimCounts, setClaimCounts] = useState<Record<string, { total: number; disputed: number }>>({});
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [historyClaimId, setHistoryClaimId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEmptyStateMenu, setShowEmptyStateMenu] = useState(false);

  const clubName = 'Demo Club';

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch claims when category changes
  useEffect(() => {
    fetchClaims();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const url = selectedCategoryId
        ? `/api/claims?category_id=${selectedCategoryId}`
        : '/api/claims';
      const res = await fetch(url);
      const data = await res.json();
      setClaims(data.claims || []);
      setEvidenceMap(data.evidence || {});
      setClaimCounts(data.counts || {});
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = (type: 'paste' | 'sheet' | 'photo') => {
    if (type === 'paste') {
      setShowPasteModal(true);
    } else if (type === 'sheet') {
      setShowSheetsModal(true);
    } else if (type === 'photo') {
      setShowPhotoModal(true);
    }
  };

  const handlePasteSubmit = async (text: string) => {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'paste',
          title: 'Pasted text',
          text,
        }),
      });

      if (!res.ok) throw new Error('Failed to create source');

      const data = await res.json();
      
      // Trigger ingestion
      await fetch(`/api/sources/${data.source.id}/ingest`, {
        method: 'POST',
      });

      // Refresh claims
      await fetchClaims();
    } catch (error) {
      console.error('Failed to submit paste:', error);
      throw error;
    }
  };

  const handleSearch = (query: string) => {
    console.log('Search:', query);
    // TODO: Implement search
  };

  const handleEdit = (claimId: string) => {
    const claim = claims.find((c) => c.id === claimId);
    if (claim) {
      setEditingClaim(claim);
      setShowEditModal(true);
    }
  };

  const handleEditSave = async (claimId: string, canonicalText: string, structured: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/claims/${claimId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canonical_text: canonicalText, structured }),
      });

      if (!res.ok) throw new Error('Failed to edit claim');

      // Refresh claims
      await fetchClaims();
    } catch (error) {
      console.error('Failed to edit claim:', error);
      throw error;
    }
  };

  const handleStatusChange = async (claimId: string, status: Claim['status']) => {
    try {
      const res = await fetch(`/api/claims/${claimId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      // Refresh claims
      await fetchClaims();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleViewHistory = (claimId: string) => {
    setHistoryClaimId(claimId);
    setShowHistoryModal(true);
  };

  const handleSheetsImport = async (spreadsheetId: string, range: string, title: string) => {
    try {
      const res = await fetch('/api/sheets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId, range, title }),
      });

      if (!res.ok) throw new Error('Failed to import sheet');

      // Refresh claims
      await fetchClaims();
    } catch (error) {
      console.error('Failed to import sheet:', error);
      throw error;
    }
  };

  const handlePhotoUpload = async (files: File[]) => {
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);

        const uploadRes = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload photo');

        const { source } = await uploadRes.json();

        // Trigger OCR processing
        await fetch(`/api/photos/${source.id}/ocr`, {
          method: 'POST',
        });
      }

      // Refresh claims
      await fetchClaims();
    } catch (error) {
      console.error('Failed to upload photos:', error);
      throw error;
    }
  };

  const filteredClaims = claims;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <TopBar
        clubName={clubName}
        onAddSource={handleAddSource}
        onSearch={handleSearch}
      />

      <CategoryRail
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        claimCounts={claimCounts}
      />

      {/* Main canvas - add left margin for category rail */}
      <main className="ml-64 pt-16 min-h-screen">
        <div className="max-w-5xl mx-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <span className="text-[var(--text-meta)] animate-pulse">loading...</span>
            </div>
          ) : filteredClaims.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-[var(--text-meta)] mb-4">No claims yet</p>
              <div className="relative">
                <button
                  onClick={() => setShowEmptyStateMenu(!showEmptyStateMenu)}
                  className="button"
                >
                  + Add your first source
                </button>
                {showEmptyStateMenu && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden animate-slide-in z-10">
                    <button
                      onClick={() => {
                        handleAddSource('paste');
                        setShowEmptyStateMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-[var(--text-on-dark)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      📝 Paste Text
                    </button>
                    <button
                      onClick={() => {
                        handleAddSource('sheet');
                        setShowEmptyStateMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-[var(--text-on-dark)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      📊 Connect Sheet
                    </button>
                    <button
                      onClick={() => {
                        handleAddSource('photo');
                        setShowEmptyStateMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-[var(--text-on-dark)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      📷 Upload Photos
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClaims.map((claim) => {
                const category = categories.find((c) => c.id === claim.category_id);
                if (!category) return null;
                
                return (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    category={category}
                    evidenceChunks={evidenceMap[claim.id] || []}
                    onEdit={handleEdit}
                    onStatusChange={handleStatusChange}
                    onViewHistory={handleViewHistory}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <PasteModal
        isOpen={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onSubmit={handlePasteSubmit}
      />

      <EditModal
        claim={editingClaim}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingClaim(null);
        }}
        onSave={handleEditSave}
      />

      <SheetsModal
        isOpen={showSheetsModal}
        onClose={() => setShowSheetsModal(false)}
        onImport={handleSheetsImport}
      />

      <PhotoModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onUpload={handlePhotoUpload}
      />

      <HistoryModal
        claimId={historyClaimId}
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setHistoryClaimId(null);
        }}
      />
    </div>
  );
}
