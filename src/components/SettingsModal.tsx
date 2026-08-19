import React, { useState, useEffect } from 'react';
import { X, Sliders, FileCheck, Cpu, Terminal, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { AppSettings, DependencyStatus } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  dependency: DependencyStatus | null;
  onRecheckDependency: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  dependency,
  onRecheckDependency,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isRechecking, setIsRechecking] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleCheck = async () => {
    setIsRechecking(true);
    try {
      await onRecheckDependency();
    } finally {
      setIsRechecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface-hover/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Conversion & Engine Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Collision Strategy */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              File Collision Policy
            </label>
            <p className="text-gray-400 text-[11px]">
              Determine what happens when a target Markdown (<code className="font-mono text-gray-300">.md</code>) file already exists in the destination folder.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, overwrite: true })}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  localSettings.overwrite
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/30'
                    : 'bg-surface-hover/60 border-border hover:border-gray-600 text-gray-300'
                }`}
              >
                <div className="font-medium text-xs text-white">Overwrite existing</div>
                <div className="text-[11px] text-gray-400 mt-1 leading-snug">
                  Replaces any existing <code className="font-mono text-gray-300">document.md</code> in-place.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setLocalSettings({ ...localSettings, overwrite: false })}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  !localSettings.overwrite
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-200 ring-1 ring-indigo-500/30'
                    : 'bg-surface-hover/60 border-border hover:border-gray-600 text-gray-300'
                }`}
              >
                <div className="font-medium text-xs text-white">Numbered variants</div>
                <div className="text-[11px] text-gray-400 mt-1 leading-snug">
                  Appends numbers (e.g. <code className="font-mono text-gray-300">document (1).md</code>).
                </div>
              </button>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Section 2: Concurrency Worker Pool */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Concurrent Workers
              </label>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                {localSettings.concurrency} jobs
              </span>
            </div>
            <p className="text-gray-400 text-[11px]">
              Number of simultaneous conversion jobs processed in parallel.
            </p>

            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={localSettings.concurrency}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  concurrency: parseInt(e.target.value, 10),
                })
              }
              className="w-full h-1.5 bg-surface-hover rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>1 (Conservative)</span>
              <span>4 (Default)</span>
              <span>8 (Maximum)</span>
            </div>
          </div>

          <hr className="border-border/60" />

          {/* Section 3: MarkItDown Engine CLI Path */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              CLI Executable Path
            </label>
            <p className="text-gray-400 text-[11px]">
              Path to the <code className="font-mono text-gray-300">markitdown</code> executable. Leave blank to auto-detect from system PATH.
            </p>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Auto-detected (e.g. /Users/.../.local/bin/markitdown)"
                value={localSettings.customExecutablePath}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    customExecutablePath: e.target.value,
                  })
                }
                className="flex-1 bg-[#0d1117] border border-border focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-gray-200 font-mono focus:outline-none transition-colors"
              />
              {localSettings.customExecutablePath && (
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, customExecutablePath: '' })
                  }
                  className="px-3 py-2 rounded-lg bg-surface-hover text-gray-400 hover:text-white border border-border text-xs transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Dependency Status Preview */}
            {dependency && (
              <div className="mt-3 p-3 rounded-lg bg-[#0d1117] border border-border/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  {dependency.available ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <div className="text-[11px] font-medium text-gray-300">
                      {dependency.available ? 'CLI Detected & Operational' : 'CLI Not Detected'}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono truncate max-w-xs">
                      {dependency.executable_path || 'No path resolved'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={isRechecking}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover border border-border text-xs transition-colors"
                  title="Re-check executable"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRechecking ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end space-x-3 bg-surface-hover/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
