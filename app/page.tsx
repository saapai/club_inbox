'use client';

import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import ClaimsMatrix from '@/components/ClaimsMatrix';
import ClaimDrawer from '@/components/ClaimDrawer';
import PasteModal from '@/components/PasteModal';
import EditModal from '@/components/EditModal';
import SheetsModal from '@/components/SheetsModal';
import PhotoModal from '@/components/PhotoModal';
import HistoryModal from '@/components/HistoryModal';
import { Category, Claim, Club } from '@/lib/types';

export default function Home() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [claims, setClaims] = useState<(Claim & { category_key: string; sources_count: number })[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showClaimDrawer, setShowClaimDrawer] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [historyClaimId, setHistoryClaimId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  const clubName = clubs[0]?.name || 'Demo Club';

  // Fetch claims
  useEffect(() => {
    fetchClaims();
  }, []);

  // Global drag-and-drop handlers
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only hide if we're leaving the window
      if (!e.relatedTarget || (e.relatedTarget as Node).nodeName === 'HTML') {
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Drop event triggered', e.dataTransfer?.files);
      setIsDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const imageFiles = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith('image/')
        );
        
        console.log('Image files detected:', imageFiles.length);
        
        if (imageFiles.length > 0) {
          // Store files and open photo modal
          console.log('Setting dropped files and opening modal');
          setDroppedFiles(imageFiles);
          setShowPhotoModal(true);
        }
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/claims');
      const data = await res.json();
      setClubs(data.clubs || []);
      setCategories(data.categories || []);
      setClaims(data.claims || []);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = (type: 'paste' | 'sheet' | 'photo') => {
    console.log('handleAddSource called with type:', type);
    if (type === 'paste') {
      console.log('Opening paste modal');
      setShowPasteModal(true);
    } else if (type === 'sheet') {
      console.log('Opening sheets modal');
      setShowSheetsModal(true);
    } else if (type === 'photo') {
      console.log('Opening photo modal');
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
    setSearchQuery(query);
  };

  const handleCellClick = (claim: Claim | null) => {
    setSelectedClaim(claim);
    setShowClaimDrawer(true);
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

      // Refresh claims and update selected claim
      await fetchClaims();
      if (selectedClaim && selectedClaim.id === claimId) {
        const updatedClaim = { ...selectedClaim, status };
        setSelectedClaim(updatedClaim);
      }
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
    console.log('handlePhotoUpload called with', files.length, 'files');
    try {
      for (const file of files) {
        console.log('Processing file:', file.name);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);

        console.log('Uploading to /api/photos/upload...');
        const uploadRes = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          console.error('Upload failed:', errorData);
          throw new Error(`Failed to upload photo: ${errorData.error || 'Unknown error'}`);
        }

        const { source } = await uploadRes.json();
        console.log('Photo uploaded, source ID:', source.id);

        // Trigger OCR processing
        console.log('Starting OCR processing...');
        const ocrRes = await fetch(`/api/photos/${source.id}/ocr`, {
          method: 'POST',
        });

        if (!ocrRes.ok) {
          const errorData = await ocrRes.json();
          console.error('OCR failed:', errorData);
          throw new Error(`Failed to process OCR: ${errorData.error || 'Unknown error'}`);
        }

        const ocrData = await ocrRes.json();
        console.log('OCR completed:', ocrData);
      }

      // Refresh claims
      console.log('Refreshing claims...');
      await fetchClaims();
      console.log('Claims refreshed successfully');
    } catch (error) {
      console.error('Failed to upload photos:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      {/* Global drag indicator */}
      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-[var(--highlight-blue)]/20 backdrop-blur-sm border-4 border-dashed border-[var(--highlight-blue)] flex items-center justify-center pointer-events-none">
          <div className="bg-[var(--bg-elevated)] border-2 border-[var(--highlight-blue)] rounded-lg p-8 shadow-2xl">
            <div className="text-6xl mb-4 text-center">📷</div>
            <div className="text-xl font-semibold text-[var(--text-on-dark)] text-center">
              Drop images to upload
            </div>
          </div>
        </div>
      )}

      <TopBar
        clubName={clubName}
        onAddSource={handleAddSource}
        onSearch={handleSearch}
      />

      {/* Main canvas - Matrix view */}
      <main className="pt-16 min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="text-[var(--text-meta)] animate-pulse">loading...</span>
          </div>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-[var(--text-meta)] mb-4">No claims yet</p>
            <button onClick={() => handleAddSource('paste')} className="button">
              + Add your first source
            </button>
          </div>
        ) : (
          <ClaimsMatrix
            clubs={clubs}
            categories={categories}
            claims={claims}
            selectedClaim={selectedClaim}
            onCellClick={handleCellClick}
            searchQuery={searchQuery}
          />
        )}
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
        onClose={() => {
          setShowPhotoModal(false);
          setDroppedFiles([]);
        }}
        onUpload={handlePhotoUpload}
        initialFiles={droppedFiles}
      />

      <HistoryModal
        claimId={historyClaimId}
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setHistoryClaimId(null);
        }}
      />

      <ClaimDrawer
        claim={selectedClaim}
        isOpen={showClaimDrawer}
        onClose={() => {
          setShowClaimDrawer(false);
          setSelectedClaim(null);
        }}
        onEdit={handleEdit}
        onStatusChange={handleStatusChange}
        onViewHistory={handleViewHistory}
      />
    </div>
  );
}
