import React from 'react';
import { DocumentFile } from '../types';

interface DocumentPreviewModalProps {
  document: DocumentFile | null;
  onClose: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ document, onClose }) => {
  if (!document) {
    return null;
  }

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in-fast"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-11/12 md:w-3/4 lg:w-1/2 max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        <header className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 truncate pr-4" title={document.name}>
            Preview: {document.name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            aria-label="Close preview"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto flex-1">
          <pre className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans">
            {document.content}
          </pre>
        </main>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;