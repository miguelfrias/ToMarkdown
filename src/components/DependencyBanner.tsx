import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check, Terminal, Settings } from 'lucide-react';
import { DependencyStatus } from '../types';

interface DependencyBannerProps {
  dependency: DependencyStatus | null;
  onVerify: () => Promise<void>;
  onOpenSettings: () => void;
}

export const DependencyBanner: React.FC<DependencyBannerProps> = ({
  dependency,
  onVerify,
  onOpenSettings,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!dependency || dependency.available) {
    return null;
  }

  const installCommand = 'pip install markitdown';

  const handleCopy = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await onVerify();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 shadow-lg select-none">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-amber-200">
            Microsoft MarkItDown CLI Not Detected
          </h4>
          <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
            ToMarkdown requires the <code className="font-mono bg-black/30 px-1 py-0.5 rounded text-amber-100">markitdown</code> command line tool to execute conversions locally.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Command snippet pill */}
            <div className="flex items-center space-x-2 bg-black/40 border border-amber-500/30 rounded-lg px-3 py-1.5 font-mono text-xs text-amber-100">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>{installCommand}</span>
              <button
                onClick={handleCopy}
                className="p-1 hover:text-white rounded transition-colors"
                title="Copy install command"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Checking...' : 'Verify Installation'}</span>
            </button>

            {/* Custom Path Button */}
            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium text-xs transition-colors flex items-center space-x-1.5 border border-amber-500/30"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure Path</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
