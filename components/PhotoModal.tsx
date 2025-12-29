'use client';

import { useState } from 'react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
}

export default function PhotoModal({ isOpen, onClose, onUpload }: PhotoModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-8 z-[100] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--bg-main)] rounded-lg shadow-2xl p-8 animate-expand-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[var(--text-on-dark)] mb-6 tracking-tight">
          upload photos<span className="text-[var(--highlight-red)]">_</span>
        </h2>

        {/* Drag and drop area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? 'border-[var(--highlight-blue)] bg-[var(--bg-hover)]'
              : 'border-[var(--border)] hover:border-[var(--border-active)]'
          }`}
        >
          <input
            type="file"
            id="file-input"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <label
            htmlFor="file-input"
            className="cursor-pointer text-[var(--text-meta)] hover:text-[var(--text-on-dark)] transition-colors"
          >
            <div className="text-4xl mb-4">📷</div>
            <div className="text-sm">
              Drag and drop images here, or click to browse
            </div>
            <div className="text-xs mt-2 opacity-60">
              Supports JPG, PNG, GIF, WebP
            </div>
          </label>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm text-[var(--text-meta)] mb-2">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl">🖼️</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[var(--text-on-dark)] truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-[var(--text-meta)]">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-[var(--highlight-red)] hover:bg-[rgba(206,96,135,0.16)] px-2 py-1 rounded transition-colors"
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
            className="px-5 py-2.5 text-sm text-[var(--text-on-dark)] hover:text-[var(--highlight-red)] hover:bg-[rgba(206,96,135,0.12)] rounded-lg transition-all font-mono"
          >
            cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="px-6 py-2.5 text-sm font-mono bg-[var(--card-bg)] text-[var(--text-on-card)] border-2 border-[var(--card-border)] hover:border-[var(--highlight-blue)] hover:bg-[var(--card-hover)] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isUploading ? 'processing...' : `upload & extract (${files.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

