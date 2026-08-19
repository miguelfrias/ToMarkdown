import React, { useState } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { FileQueue } from './components/FileQueue';
import { DependencyBanner } from './components/DependencyBanner';
import { SettingsModal } from './components/SettingsModal';

import { useSettings } from './hooks/useSettings';
import { useDependency } from './hooks/useDependency';
import { useConversionQueue } from './hooks/useConversionQueue';
import { useNativeDrop } from './hooks/useNativeDrop';
import { isTauri, revealInFinder, openFile, browseFiles } from './utils/tauri';

export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. App settings & localStorage sync
  const { settings, saveSettings } = useSettings();

  // 2. Engine CLI & sidecar health checks
  const { dependency, checkDependency } = useDependency(settings.customExecutablePath);

  // 3. Batch queue, deduplication, and conversion state
  const { items, completedCount, addFiles, removeItem, clearCompleted, clearAll } =
    useConversionQueue(settings);

  // 4. Native macOS window drag-and-drop
  const { isDraggingOver } = useNativeDrop(addFiles);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d1117] text-gray-100 overflow-hidden select-none">
      {/* Top Application Header */}
      <Header
        dependency={dependency}
        onOpenSettings={() => setIsSettingsOpen(true)}
        completedCount={completedCount}
        totalCount={items.length}
      />

      {/* Missing CLI Warning Banner */}
      <DependencyBanner
        dependency={dependency}
        onVerify={() => checkDependency(settings.customExecutablePath)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Drop Zone */}
        <DropZone
          onFilesSelected={addFiles}
          isDraggingOver={isDraggingOver}
          hasQueueItems={items.length > 0}
          onBrowseFiles={() => browseFiles(addFiles)}
          isTauri={isTauri}
        />

        {/* Batch Queue List */}
        <FileQueue
          items={items}
          onRevealInFinder={revealInFinder}
          onOpenFile={openFile}
          onRemoveItem={removeItem}
          onClearCompleted={clearCompleted}
          onClearAll={clearAll}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={saveSettings}
        dependency={dependency}
        onRecheckDependency={() => checkDependency(settings.customExecutablePath)}
      />
    </div>
  );
};
