import React, { useRef, useState } from 'react';
import { UploadCloud, FolderDown } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (filePaths: string[]) => void;
  isDraggingOver: boolean;
  hasQueueItems: boolean;
  onBrowseFiles: () => void;
  isTauri?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  isDraggingOver,
  hasQueueItems,
  onBrowseFiles,
  isTauri = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalHover, setInternalHover] = useState(false);

  const supportedFormats = [
    { label: 'PDF', ext: '.pdf', color: 'text-red-400 border-red-500/20 bg-red-500/10' },
    { label: 'Word', ext: '.docx', color: 'text-blue-400 border-blue-500/20 bg-blue-500/10' },
    { label: 'PowerPoint', ext: '.pptx', color: 'text-orange-400 border-orange-500/20 bg-orange-500/10' },
    { label: 'Excel', ext: '.xlsx', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' },
    { label: 'HTML / Web', ext: '.html', color: 'text-purple-400 border-purple-500/20 bg-purple-500/10' },
    { label: 'ZIP', ext: '.zip', color: 'text-amber-400 border-amber-500/20 bg-amber-500/10' },
    { label: 'Data', ext: '.csv, .json, .xml', color: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/10' },
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInternalHover(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInternalHover(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInternalHover(false);

    // In Tauri, file drop is handled by native OS window listener (onDragDropEvent).
    // Only use HTML5 DOM drop in browser mock mode to avoid duplicate ingestion.
    if (!isTauri && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const paths: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        const path = (file as any).path || file.name;
        paths.push(path);
      }
      onFilesSelected(paths);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const paths: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const path = (file as any).path || file.name;
        paths.push(path);
      }
      onFilesSelected(paths);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isActive = isDraggingOver || internalHover;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full transition-all duration-300 ease-out select-none ${
        hasQueueItems ? 'p-4' : 'flex-1 p-6 flex flex-col justify-center'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
        accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.tsv,.html,.htm,.json,.xml,.zip"
      />

      <div
        onClick={onBrowseFiles}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center text-center overflow-hidden ${
          isActive
            ? 'border-indigo-500 bg-indigo-950/20 shadow-2xl shadow-indigo-500/10 dropzone-active scale-[0.995]'
            : 'border-border/80 hover:border-indigo-500/50 bg-surface/50 hover:bg-surface/80'
        } ${hasQueueItems ? 'py-6 px-4' : 'py-12 px-6 flex-1'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`rounded-2xl flex items-center justify-center transition-all duration-300 mb-3 ${
              isActive
                ? 'w-14 h-14 bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-110'
                : 'w-12 h-12 bg-surface-hover text-indigo-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-300 border border-border group-hover:border-indigo-500/30'
            }`}
          >
            {isActive ? (
              <FolderDown className="w-6 h-6 animate-bounce" />
            ) : (
              <UploadCloud className="w-6 h-6 transition-transform group-hover:-translate-y-0.5" />
            )}
          </div>

          <h3 className="text-base font-semibold text-gray-100 tracking-tight flex items-center gap-2">
            {isActive ? (
              <span className="text-indigo-400">Drop documents to convert in-place</span>
            ) : (
              <>
                <span>Drag & Drop files here</span>
                <span className="text-xs font-normal text-gray-400 hidden sm:inline">or</span>
                <span className="text-xs font-medium text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                  browse files
                </span>
              </>
            )}
          </h3>

          <p className="text-xs text-gray-400 mt-1 max-w-md">
            Files are converted to clean Markdown alongside their original paths.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 max-w-xl">
            {supportedFormats.map((fmt) => (
              <span
                key={fmt.label}
                className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${fmt.color} transition-transform group-hover:scale-105`}
              >
                {fmt.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
