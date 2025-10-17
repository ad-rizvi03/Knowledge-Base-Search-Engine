import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesAdded, className }) => {
  const [isDragging, setIsDragging] = useState(false);

  // Fix: Corrected event types from React.DragEvent<HTMLDivElement> to React.DragEvent<HTMLLabelElement>
  // to match the element the drag event handlers are attached to.
  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [onFilesAdded]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
    }
  };

  return (
    <div className={className}>
      <label
        htmlFor="file-upload"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200
          ${isDragging 
            ? 'border-indigo-400 bg-slate-100 dark:bg-slate-700' 
            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`
        }
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadIcon className="w-10 h-10 mb-3 text-slate-400 dark:text-slate-500" />
          <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-indigo-500 dark:text-indigo-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">TXT, PDF, DOCX, etc.</p>
        </div>
        <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default FileUploader;