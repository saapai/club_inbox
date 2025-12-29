'use client';

import { useState } from 'react';

interface PasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}

export default function PasteModal({ isOpen, onClose, onSubmit }: PasteModalProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('PasteModal isOpen:', isOpen);
  
  if (!isOpen) return null;

  console.log('PasteModal rendering');

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(text);
      setText('');
      onClose();
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
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
          paste text<span className="text-[var(--highlight-red)]">_</span>
        </h2>
        
        <textarea
          autoFocus
          placeholder="paste or type club requirements here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={14}
          className="w-full px-5 py-4 bg-[var(--card-bg)] text-base text-[var(--text-on-card)] placeholder-[var(--bg-main)] resize-none outline-none border-0 shadow-none focus:outline-none focus:ring-0 focus:border-0 font-mono leading-relaxed rounded-lg"
        />
        
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm text-[var(--text-on-dark)] hover:text-[var(--highlight-red)] hover:bg-[rgba(206,96,135,0.12)] rounded-lg transition-all font-mono flex items-center gap-3"
          >
            cancel<span className="text-xs opacity-50">esc</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !text.trim()}
            className="px-6 py-2.5 text-sm font-mono bg-[var(--card-bg)] text-[var(--text-on-card)] border-2 border-[var(--card-border)] hover:border-[var(--highlight-red)] hover:bg-[var(--card-hover)] rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {isSubmitting ? 'extracting...' : 'extract claims'}
            <span className="text-xs opacity-50">⌘↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}

