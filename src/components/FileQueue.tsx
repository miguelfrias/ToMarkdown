import React from 'react';
import { Trash2, CheckCheck, Layers } from 'lucide-react';
import { QueueItem as QueueItemType } from '../types';
import { QueueItem } from './QueueItem';

interface FileQueueProps {
  items: QueueItemType[];
  onRevealInFinder: (path: string) => void;
  onOpenFile: (path: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
}

export const FileQueue: React.FC<FileQueueProps> = ({
  items,
  onRevealInFinder,
  onOpenFile,
  onRemoveItem,
  onClearCompleted,
  onClearAll,
}) => {
  const completedItems = items.filter((i) => i.status === 'success');
  const failedItems = items.filter((i) => i.status === 'failed');
  const convertingItems = items.filter((i) => i.status === 'converting');
  const pendingItems = items.filter((i) => i.status === 'pending');

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 px-6 pb-6 select-none">
      {/* Queue control bar */}
      <div className="flex items-center justify-between py-3 border-b border-border/70 mb-3 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
              Queue ({items.length})
            </h2>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            {convertingItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                {convertingItems.length} active
              </span>
            )}
            {completedItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                {completedItems.length} done
              </span>
            )}
            {failedItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
                {failedItems.length} failed
              </span>
            )}
            {pendingItems.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-border font-medium">
                {pendingItems.length} queued
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {completedItems.length > 0 && (
            <button
              onClick={onClearCompleted}
              className="text-xs text-gray-400 hover:text-gray-200 px-2.5 py-1 rounded-md hover:bg-surface-hover transition-colors flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Clear Done</span>
            </button>
          )}

          <button
            onClick={onClearAll}
            disabled={convertingItems.length > 0}
            className="text-xs text-gray-400 hover:text-rose-400 px-2.5 py-1 rounded-md hover:bg-rose-500/10 transition-colors flex items-center space-x-1 disabled:opacity-30 disabled:pointer-events-none"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Queue items list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {items.map((item) => (
          <QueueItem
            key={item.id}
            item={item}
            onRevealInFinder={onRevealInFinder}
            onOpenFile={onOpenFile}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
    </div>
  );
};
