import React, { useRef, useState } from 'react';
import { Upload, FileText, X, AlertCircle, Trash2 } from 'lucide-react';

export default function ResumeUpload({ files, onFilesChange, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processFiles = (fileList) => {
    setUploadError(null);
    const incomingFiles = Array.from(fileList);
    const validPdfs = [];
    const invalidFiles = [];

    incomingFiles.forEach((file) => {
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        const alreadyExists = files.some(
          (existing) => existing.name === file.name && existing.size === file.size
        );
        if (!alreadyExists) {
          validPdfs.push(file);
        }
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setUploadError(
        `Only PDF resumes are supported. Rejected: ${invalidFiles.join(', ')}`
      );
    }

    if (validPdfs.length > 0) {
      onFilesChange([...files, ...validPdfs]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer && e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    onFilesChange(updated);
  };

  const handleClearAll = () => {
    onFilesChange([]);
    setUploadError(null);
  };

  return (
    <div className="flex h-full flex-col border border-slate-800 bg-slate-900/50 p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-blue-400" />
            <h2 className="text-sm font-semibold tracking-tight text-slate-100">
              Candidate Resumes
            </h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Upload one or more candidate resumes in PDF format.
          </p>
        </div>

        {files.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 border border-slate-700 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-rose-900 hover:bg-rose-950/20 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="w-3 h-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center border border-dashed p-7 text-center transition-colors ${
          disabled
            ? 'cursor-not-allowed border-slate-800 bg-slate-950/40 opacity-50'
            : isDragging
            ? 'border-blue-500 bg-blue-950/15'
            : 'border-slate-700 bg-slate-950/50 hover:border-slate-500 hover:bg-slate-950/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          disabled={disabled}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="mb-3 flex h-9 w-9 items-center justify-center border border-slate-700 bg-slate-900 text-slate-300">
          <Upload className="h-4 w-4 text-blue-400" />
        </div>

        <p className="text-xs font-medium text-slate-200">
          <span className="font-semibold text-blue-400">Browse files</span> or drag and drop resumes
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          PDF documents only • Multiple files supported
        </p>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="mt-3 flex items-start gap-2 border border-rose-900/70 bg-rose-950/20 p-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* File List */}
      <div className="mt-4 flex min-h-[140px] flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
          <span>Queued Resumes ({files.length})</span>
          {files.length > 0 && (
            <span className="text-[11px] text-emerald-400">Ready for screening</span>
          )}
        </div>

        {files.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center border border-slate-800 bg-slate-950/30 p-6 text-xs text-slate-500">
            <FileText className="w-6 h-6 mb-1 text-slate-600" />
            No resumes queued yet
          </div>
        ) : (
          <div className="max-h-48 space-y-1.5 overflow-y-auto border border-slate-800 bg-slate-950/40 p-2 pr-1">
            {files.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between border border-slate-800 bg-slate-900 px-3 py-2 text-xs transition-colors hover:border-slate-700"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="bg-slate-800 p-1 text-slate-400">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-medium text-slate-200 truncate max-w-[200px] sm:max-w-xs">{file.name}</p>
                    <span className="text-[10px] text-slate-500">{formatFileSize(file.size)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(idx);
                  }}
                  title="Remove resume"
                  className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
