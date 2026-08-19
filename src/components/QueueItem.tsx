import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Presentation,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderSearch,
  ExternalLink,
  X,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { QueueItem as QueueItemType } from '../types';

interface QueueItemProps {
  item: QueueItemType;
  onRevealInFinder: (path: string) => void;
  onOpenFile: (path: string) => void;
  onRemoveItem: (id: string) => void;
}

export const QueueItem: React.FC<QueueItemProps> = ({
  item,
  onRevealInFinder,
  onOpenFile,
  onRemoveItem,
}) => {
  const getFileIcon = (ext: string) => {
    const cleanExt = ext.toLowerCase().replace('.', '');
    switch (cleanExt) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-400" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
      case 'tsv':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'ppt':
      case 'pptx':
        return <Presentation className="w-4 h-4 text-orange-400" />;
      case 'html':
      case 'htm':
      case 'json':
      case 'xml':
        return <FileCode className="w-4 h-4 text-purple-400" />;
      case 'zip':
      case 'tar':
      case 'gz':
        return <FileArchive className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTargetFileName = (sourceName: string, outputPath?: string) => {
    if (outputPath) {
      const parts = outputPath.split(/[/\\]/);
      return parts[parts.length - 1];
    }
    const dotIndex = sourceName.lastIndexOf('.');
    const base = dotIndex > 0 ? sourceName.substring(0, dotIndex) : sourceName;
    return `${base}.md`;
  };

  const targetName = getTargetFileName(item.sourceName, item.outputPath);

  // Extract short folder path
  const getParentDir = (fullPath: string) => {
    const separator = fullPath.includes('/') ? '/' : '\\';
    const parts = fullPath.split(separator);
    if (parts.length > 2) {
      return `.../${parts.slice(-2, -1)[0]}`;
    }
    return '';
  };

  const parentFolder = getParentDir(item.sourcePath);

  return (
    <div className="group relative flex items-center justify-between p-3.5 rounded-xl bg-surface/70 hover:bg-surface border border-border/70 hover:border-border transition-all duration-200 shadow-sm">
      <div className="flex items-center space-x-3.5 min-w-0 flex-1 pr-4">
        {/* File Type Icon container */}
        <div className="w-9 h-9 rounded-lg bg-surface-hover border border-border/80 flex items-center justify-center shrink-0">
          {getFileIcon(item.sourceExt)}
        </div>

        {/* Path and Names */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <span
              className="text-xs font-medium text-gray-200 truncate max-w-[180px] sm:max-w-[240px] md:max-w-[300px]"
              title={item.sourcePath}
            >
              {item.sourceName}
            </span>

            <ArrowRight className="w-3 h-3 text-gray-500 shrink-0" />

            <span
              className={`text-xs font-mono font-medium truncate max-w-[160px] sm:max-w-[220px] ${
                item.status === 'success' ? 'text-indigo-300' : 'text-gray-400'
              }`}
              title={item.outputPath || targetName}
            >
              {targetName}
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-0.5 text-[11px] text-gray-500">
            {parentFolder && <span className="font-mono">{parentFolder}</span>}
            {item.error && (
              <span className="text-red-400 truncate max-w-xs font-sans font-normal" title={item.error}>
                • {item.error}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Status and actions */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Status Indicators */}
        {item.status === 'pending' && (
          <div className="flex items-center space-x-1.5 text-xs text-gray-400 bg-[#0d1117] px-2.5 py-1 rounded-md border border-border">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[11px]">Queued</span>
          </div>
        )}

        {item.status === 'converting' && (
          <div className="flex items-center space-x-1.5 text-xs text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span className="text-[11px] font-medium">Converting...</span>
          </div>
        )}

        {item.status === 'success' && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">Done</span>
          </div>
        )}

        {item.status === 'failed' && (
          <div className="flex items-center space-x-1.5 text-xs text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-medium">Failed</span>
          </div>
        )}

        {/* Action: Reveal in Finder (when completed or failed) */}
        {item.status === 'success' && item.outputPath && (
          <>
            <button
              onClick={() => onRevealInFinder(item.outputPath!)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors border border-transparent hover:border-border"
              title="Reveal in Finder"
              aria-label="Reveal in Finder"
            >
              <FolderSearch className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenFile(item.outputPath!)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors border border-transparent hover:border-border"
              title="Open Markdown File"
              aria-label="Open Markdown File"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Remove queue item button */}
        <button
          onClick={() => onRemoveItem(item.id)}
          disabled={item.status === 'converting'}
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
          title="Remove from queue"
          aria-label="Remove item"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
