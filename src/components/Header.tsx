import React from 'react';
import { Settings, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { DependencyStatus } from '../types';

interface HeaderProps {
  dependency: DependencyStatus | null;
  onOpenSettings: () => void;
  completedCount: number;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  dependency,
  onOpenSettings,
  completedCount,
  totalCount,
}) => {
  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-md px-5 flex items-center justify-between select-none z-10 shrink-0">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              ToMarkdown
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Desktop
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-gray-400">Local-first document to Markdown converter</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Markitdown binary status badge */}
        {dependency && (
          <div
            onClick={onOpenSettings}
            className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5 transition-all duration-200 border ${
              dependency.available
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
            }`}
            title={
              dependency.available
                ? `Engine ready: ${dependency.executable_path}`
                : 'CLI not detected - Click to configure'
            }
          >
            {dependency.available ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px]">Engine Ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">CLI Required</span>
              </>
            )}
          </div>
        )}

        {/* Progress summary if items exist */}
        {totalCount > 0 && (
          <div className="text-xs text-gray-400 bg-[#0d1117] px-3 py-1 rounded-md border border-border flex items-center space-x-1.5 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {completedCount}/{totalCount} Done
            </span>
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors border border-transparent hover:border-border"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
