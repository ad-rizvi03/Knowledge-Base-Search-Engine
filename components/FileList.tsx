import React from 'react';
import { DocumentFile } from '../types';
import { FileIcon, TrashIcon, WarningIcon, BookOpenIcon } from './Icons';

interface FileListProps {
  documents: DocumentFile[];
  onRemoveDocument: (name: string) => void;
  onPreviewDocument: (doc: DocumentFile) => void;
}

const FileList: React.FC<FileListProps> = ({ documents, onRemoveDocument, onPreviewDocument }) => {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Uploaded Documents</h3>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.name}
            className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-3 rounded-md animate-fade-in"
          >
            <div className="flex items-center min-w-0">
                {doc.readable ? 
                    <FileIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" /> :
                    <WarningIcon className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                }
              
              <span className="ml-3 text-sm text-slate-600 dark:text-slate-200 truncate" title={doc.name}>{doc.name}</span>
            </div>
            <div className="flex items-center space-x-2">
                {doc.readable && (
                     <button
                        onClick={() => onPreviewDocument(doc)}
                        className="p-1 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-colors"
                        aria-label={`Preview ${doc.name}`}
                    >
                        <BookOpenIcon className="w-5 h-5" />
                    </button>
                )}
                <button
                onClick={() => onRemoveDocument(doc.name)}
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
                aria-label={`Remove ${doc.name}`}
                >
                <TrashIcon className="w-5 h-5" />
                </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileList;