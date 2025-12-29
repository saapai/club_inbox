'use client';

import { useState, useEffect } from 'react';

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

  if (!isOpen) {
    console.log('PhotoModal not rendering - isOpen is false');
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
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    try {
      await onUpload(files);
      setFiles([]);
      onClose();
    } catch (error) {
      console.error('Failed to upload:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-8 z-[100]"
      onClick={onClose}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className="w-full max-w-2xl rounded-lg shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          backgroundColor: '#1a1a2e',
          color: '#ffffff',
          border: '1px solid #333'
        }}
      >
        <h2 className="text-xl font-semibold mb-6 tracking-tight" style={{ color: '#ffffff' }}>
          upload photos<span style={{ color: '#ce6087' }}>_</span>
        </h2>

        {/* Drag and drop area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          className="border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer"
          style={{
            borderColor: dragActive ? '#3b7c96' : '#666',
            backgroundColor: dragActive ? 'rgba(59, 124, 150, 0.1)' : 'transparent'
          }}
        >
          <input
            type="file"
            id="file-input"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="transition-colors" style={{ color: '#ffffff' }}>
            <div className="text-6xl mb-4">📷</div>
            <div className="text-base font-medium mb-2">
              Drag and drop images here, or click to browse
            </div>
            <div className="text-xs opacity-70">
              Supports JPG, PNG, GIF, WebP
            </div>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm mb-2" style={{ color: '#aaa' }}>
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: '#252830' }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl">🖼️</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: '#ffffff' }}>
                        {file.name}
                      </div>
                      <div className="text-xs" style={{ color: '#aaa' }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="px-2 py-1 rounded transition-colors"
                    style={{ color: '#ce6087' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm rounded-lg transition-all font-mono"
            style={{ color: '#ffffff', backgroundColor: 'transparent', border: '1px solid #555' }}
          >
            cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="px-6 py-2.5 text-sm font-mono rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: '#3b7c96', 
              color: '#ffffff',
              border: '2px solid #3b7c96'
            }}
          >
            {isUploading ? 'processing...' : `upload & extract (${files.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

