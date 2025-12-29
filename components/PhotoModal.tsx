'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  initialFiles?: File[];
}

export default function PhotoModal({ isOpen, onClose, onUpload, initialFiles = [] }: PhotoModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load initial files when modal opens
  useEffect(() => {
    console.log('PhotoModal isOpen changed:', isOpen);
    if (isOpen && initialFiles.length > 0) {
      console.log('Loading initial files:', initialFiles.length);
      setFiles(initialFiles);
    } else if (!isOpen) {
      setFiles([]);
    }
  }, [isOpen, initialFiles]);

  if (!isOpen || !mounted) {
    console.log('PhotoModal not rendering - isOpen is false or not mounted');
    return null;
  }

  console.log('PhotoModal rendering with files:', files.length);
  console.log('PhotoModal isOpen:', isOpen);
  console.log('PhotoModal initialFiles:', initialFiles);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed, files:', e.target.files);
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      console.log('Adding files:', newFiles.length);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    console.log('Upload button clicked, files:', files.length);
    if (files.length === 0 || isUploading) {
      console.log('Upload aborted - no files or already uploading');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting upload for', files.length, 'files');
      await onUpload(files);
      console.log('Upload completed successfully');
      setFiles([]);
      onClose();
    } catch (error) {
      console.error('Failed to upload:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const modalContent = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '800px',
          backgroundColor: '#1a1a2e',
          borderRadius: '8px',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid #333',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', color: '#d9ccba', letterSpacing: '-0.01em' }}>
          upload photos<span style={{ color: '#ce6087' }}>_</span>
        </h2>

        {/* Drag and drop area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          style={{
            border: dragActive ? '2px dashed #3b7c96' : '2px dashed rgba(255, 255, 255, 0.18)',
            backgroundColor: dragActive ? 'rgba(59, 124, 150, 0.1)' : 'transparent',
            borderRadius: '8px',
            padding: '48px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="file"
            id="file-input"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <div style={{ color: '#7e858c' }}>
            <div style={{ fontSize: '60px', marginBottom: '16px' }}>📷</div>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: '#d9ccba' }}>
              Drag and drop images here, or click to browse
            </div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              Supports JPG, PNG, GIF, WebP
            </div>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '14px', color: '#7e858c', marginBottom: '8px' }}>
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </div>
            <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
              {files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: '#16191d',
                    borderRadius: '8px',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '24px' }}>🖼️</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', color: '#d9ccba', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7e858c' }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    style={{
                      color: '#ce6087',
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              color: '#d9ccba',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              transition: 'all 0.2s ease',
            }}
          >
            cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontFamily: 'JetBrains Mono, monospace',
              backgroundColor: '#d6c9ba',
              color: '#3a3a3c',
              border: '2px solid #c4b5a0',
              borderRadius: '8px',
              cursor: files.length === 0 || isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: files.length === 0 || isUploading ? 0.3 : 1,
            }}
          >
            {isUploading ? 'processing...' : `upload & extract (${files.length})`}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

