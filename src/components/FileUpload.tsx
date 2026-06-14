import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  UploadCloud, 
  FileCode, 
  FileSpreadsheet, 
  AlertCircle, 
  Trash2,
  CheckCircle
} from 'lucide-react';
import { parseGoogleJSON, parseGoogleCSV } from '../utils/parser';
import { HistoryItem, FileSummary } from '../types';

interface FileUploadProps {
  onDataLoaded: (newItems: HistoryItem[], fileMeta: FileSummary) => void;
  uploadedFiles: FileSummary[];
  onClearAll: () => void;
}

export function FileUpload({ onDataLoaded, uploadedFiles, onClearAll }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMessage(null);
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    if (fileExtension !== 'json' && fileExtension !== 'csv') {
      setErrorMessage(`Invalid format: "${fileName}". Please upload either .JSON or .CSV files.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let parsedItems: HistoryItem[] = [];

        if (fileExtension === 'json') {
          parsedItems = parseGoogleJSON(text);
        } else if (fileExtension === 'csv') {
          parsedItems = parseGoogleCSV(text);
        }

        if (parsedItems.length === 0) {
          setErrorMessage(`No history items found/parsed in "${fileName}".`);
          return;
        }

        const fileMeta: FileSummary = {
          name: fileName,
          size: file.size,
          itemCount: parsedItems.length,
          fileType: fileExtension === 'json' ? 'JSON' : 'CSV',
        };

        // Notify parent
        onDataLoaded(parsedItems, fileMeta);
      } catch (err: any) {
        setErrorMessage(`Error parsing "${fileName}": ${err.message || 'Malformed file structure.'}`);
      }
    };

    reader.onerror = () => {
      setErrorMessage(`Error reading file "${fileName}".`);
    };

    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      filesArray.forEach((file) => processFile(file));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const filesArray = Array.from(e.target.files) as File[];
      filesArray.forEach((file) => processFile(file));
    }
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  // Human readable file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
      {/* Drag Drop Area */}
      <div className="lg:col-span-7">
        <motion.div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileBrowser}
          whileHover={{ scale: 1.005 }}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 h-[240px] select-none ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50/40 text-indigo-600 scale-[1.01]'
              : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 text-slate-500'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".json,.csv"
            multiple
            onChange={handleFileInputChange}
          />
          
          <div className="p-4 bg-white shadow-[0_4px_10px_-2px_rgba(0,0,0,0.03)] border border-slate-100 rounded-2xl mb-4 text-indigo-500">
            <UploadCloud className="w-8 h-8 strike-[1.75]" />
          </div>

          <h3 className="font-bold text-slate-800 text-sm tracking-tight mb-1">
            Drag and drop Google history files
          </h3>
          <p className="text-xs text-slate-400 font-semibold max-w-sm mb-3">
            Supports Google Takeout <span className="text-indigo-500">.JSON</span> watch history or other tabular digital interactions <span className="text-emerald-500">.CSV</span> formats.
          </p>
          <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 box-shadow px-2.5 py-1 rounded-full uppercase tracking-wider">
            Click to browse files
          </span>
        </motion.div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 bg-red-50 text-red-700 border border-red-100 p-3.5 rounded-xl flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="text-xs font-semibold">
              <span className="font-bold block mb-0.5">Integration Parsing Error</span>
              {errorMessage}
            </div>
          </motion.div>
        )}
      </div>

      {/* Guide & Active files queue */}
      <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-slate-100/80 p-6 rounded-2xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-slate-800 text-sm tracking-tight">Active Files Core Zone</h3>
          </div>
          <p className="text-xs font-medium text-slate-400 leading-relaxed mb-4">
            Upload your exported browser behavior history or Google MyActivity export files. All processing, layout extraction, safety scanning, and analytics happen directly inside your secure local browser container.
          </p>
        </div>

        {/* Uploaded Files Queue */}
        <div className="pt-4 border-t border-slate-50 mt-4 flex flex-col justify-end">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Uploaded Source Files ({uploadedFiles.length})
            </span>
            {uploadedFiles.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Clear Dataset
              </button>
            )}
          </div>

          {uploadedFiles.length > 0 ? (
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {uploadedFiles.map((f, idx) => (
                <div
                  key={`${f.name}-${idx}`}
                  className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100/70 rounded-xl text-xs font-semibold text-slate-600"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {f.fileType === 'JSON' ? (
                      <FileCode className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="truncate" title={f.name}>{f.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400">
                    <span>{formatFileSize(f.size)}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Loaded Active" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 border border-slate-100 border-dashed rounded-xl text-center text-slate-400 text-xs font-semibold">
              No files currently parsed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
