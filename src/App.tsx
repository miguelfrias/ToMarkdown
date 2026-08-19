import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { FileQueue } from './components/FileQueue';
import { DependencyBanner } from './components/DependencyBanner';
import { SettingsModal } from './components/SettingsModal';
import {
  QueueItem,
  AppSettings,
  DependencyStatus,
  ConversionProgressPayload,
} from './types';

const DEFAULT_SETTINGS: AppSettings = {
  overwrite: true,
  concurrency: 4,
  customExecutablePath: '',
};

export const App: React.FC = () => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('tomarkdown_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [dependency, setDependency] = useState<DependencyStatus | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Reference for queue processing
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Helper to check if Tauri APIs are available
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  // Save settings to localStorage
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('tomarkdown_settings', JSON.stringify(newSettings));
    checkDependency(newSettings.customExecutablePath);
  };

  // Check markitdown CLI dependency
  const checkDependency = useCallback(async (customPath?: string) => {
    if (!isTauri) {
      // Mock for browser preview
      setDependency({
        available: true,
        executable_path: 'Bundled Sidecar (Ready)',
        version: '0.1.0',
      });
      return;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const status = await invoke<DependencyStatus>('check_dependency', {
        customPath: customPath || settingsRef.current.customExecutablePath || null,
      });
      setDependency(status);
    } catch (err: any) {
      console.error('Failed to check dependency:', err);
      setDependency({
        available: false,
        executable_path: '',
        error: err.toString(),
      });
    }
  }, [isTauri]);

  // Initial load dependency check
  useEffect(() => {
    checkDependency();
  }, [checkDependency]);

  // Handle addition of files to the conversion queue with deduplication
  const handleFilesSelected = useCallback((filePaths: string[]) => {
    if (filePaths.length === 0) return;

    // Deduplicate within the incoming batch
    const uniquePaths = Array.from(new Set(filePaths));

    setItems((prev) => {
      // Prevent duplicate entries for files that are already pending or converting
      const activePaths = new Set(
        prev
          .filter((i) => i.status === 'pending' || i.status === 'converting')
          .map((i) => i.sourcePath)
      );

      const newItems: QueueItem[] = uniquePaths
        .filter((fullPath) => !activePaths.has(fullPath))
        .map((fullPath) => {
          const separator = fullPath.includes('/') ? '/' : '\\';
          const parts = fullPath.split(separator);
          const fileName = parts[parts.length - 1] || fullPath;
          const dotIndex = fileName.lastIndexOf('.');
          const ext = dotIndex >= 0 ? fileName.substring(dotIndex) : '';

          return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sourcePath: fullPath,
            sourceName: fileName,
            sourceExt: ext,
            status: 'pending',
            addedAt: Date.now(),
          };
        });

      return [...prev, ...newItems];
    });
  }, []);

  // Tauri v2 native Drag and Drop listener & IPC progress listener
  useEffect(() => {
    if (!isTauri) return;

    let isMounted = true;
    let unlistenDragDrop: (() => void) | undefined;
    let unlistenProgress: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const { listen } = await import('@tauri-apps/api/event');
        const currentWindow = getCurrentWindow();

        if (!isMounted) return;

        // Listen for window drag-and-drop events
        const cleanupDrag = await currentWindow.onDragDropEvent((event) => {
          if (event.payload.type === 'enter' || event.payload.type === 'over') {
            setIsDraggingOver(true);
          } else if (event.payload.type === 'drop') {
            setIsDraggingOver(false);
            const droppedPaths = event.payload.paths;
            if (droppedPaths && droppedPaths.length > 0) {
              handleFilesSelected(droppedPaths);
            }
          } else if (event.payload.type === 'leave') {
            setIsDraggingOver(false);
          }
        });

        if (!isMounted) {
          cleanupDrag();
          return;
        }
        unlistenDragDrop = cleanupDrag;

        // Listen for conversion progress events from Rust
        const cleanupProg = await listen<ConversionProgressPayload>(
          'conversion-progress',
          (event) => {
            const { id, status, output_path, error } = event.payload;
            setItems((prev) =>
              prev.map((item) => {
                if (item.id === id) {
                  return {
                    ...item,
                    status,
                    outputPath: output_path || item.outputPath,
                    error,
                    completedAt:
                      status === 'success' || status === 'failed' ? Date.now() : item.completedAt,
                  };
                }
                return item;
              })
            );
          }
        );

        if (!isMounted) {
          cleanupProg();
          return;
        }
        unlistenProgress = cleanupProg;
      } catch (err) {
        console.error('Error setting up Tauri listeners:', err);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      if (unlistenDragDrop) unlistenDragDrop();
      if (unlistenProgress) unlistenProgress();
    };
  }, [isTauri, handleFilesSelected]);

  // Process queued items automatically
  useEffect(() => {
    const pendingItems = items.filter((i) => i.status === 'pending');
    if (pendingItems.length === 0) return;

    const processQueue = async () => {
      if (!isTauri) {
        // Browser demo simulation
        for (const item of pendingItems) {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: 'converting' } : i))
          );
          await new Promise((r) => setTimeout(r, 1200));
          const mockOutput = item.sourcePath.replace(/\.[^/.]+$/, '') + '.md';
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'success',
                    outputPath: mockOutput,
                    completedAt: Date.now(),
                  }
                : i
            )
          );
        }
        return;
      }

      // Convert using Tauri backend
      try {
        const { invoke } = await import('@tauri-apps/api/core');

        // Execute batch conversion on backend
        const tasks = pendingItems.map((item) => ({
          id: item.id,
          source_path: item.sourcePath,
        }));

        // Mark them as converting locally
        setItems((prev) =>
          prev.map((i) =>
            pendingItems.some((p) => p.id === i.id) ? { ...i, status: 'converting' } : i
          )
        );

        await invoke('batch_convert', {
          tasks,
          overwrite: settingsRef.current.overwrite,
          concurrency: settingsRef.current.concurrency,
          customExecutablePath: settingsRef.current.customExecutablePath || null,
        });
      } catch (err: any) {
        console.error('Error executing batch conversion:', err);
      }
    };

    processQueue();
  }, [items, isTauri]);

  // Browse files using native file dialog
  const handleBrowseFiles = async () => {
    if (isTauri) {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({
          multiple: true,
          filters: [
            {
              name: 'Supported Documents',
              extensions: [
                'pdf',
                'docx',
                'doc',
                'pptx',
                'ppt',
                'xlsx',
                'xls',
                'csv',
                'tsv',
                'html',
                'htm',
                'json',
                'xml',
                'zip',
              ],
            },
            {
              name: 'All Files',
              extensions: ['*'],
            },
          ],
        });

        if (selected) {
          const filePaths = Array.isArray(selected) ? selected : [selected];
          handleFilesSelected(filePaths);
        }
      } catch (err) {
        console.error('Failed to open file dialog:', err);
      }
    } else {
      // Browser fallback - trigger dropzone file input
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.click();
    }
  };

  // Reveal file in macOS Finder
  const handleRevealInFinder = async (path: string) => {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('reveal_in_finder', { filePath: path });
      } catch (err) {
        console.error('Failed to reveal in Finder:', err);
      }
    } else {
      alert(`Mock Reveal in Finder: ${path}`);
    }
  };

  // Open file with default application
  const handleOpenFile = async (path: string) => {
    if (isTauri) {
      try {
        const { openUrl, openPath } = await import('@tauri-apps/plugin-opener');
        if (openPath) {
          await openPath(path);
        } else {
          await openUrl(`file://${path}`);
        }
      } catch (err) {
        console.error('Failed to open file:', err);
      }
    } else {
      alert(`Mock Open File: ${path}`);
    }
  };

  // Queue manipulation handlers
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearCompleted = () => {
    setItems((prev) => prev.filter((i) => i.status !== 'success'));
  };

  const handleClearAll = () => {
    setItems((prev) => prev.filter((i) => i.status === 'converting'));
  };

  const completedCount = items.filter((i) => i.status === 'success').length;

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
          onFilesSelected={handleFilesSelected}
          isDraggingOver={isDraggingOver}
          hasQueueItems={items.length > 0}
          onBrowseFiles={handleBrowseFiles}
          isTauri={isTauri}
        />

        {/* Batch Queue List */}
        <FileQueue
          items={items}
          onRevealInFinder={handleRevealInFinder}
          onOpenFile={handleOpenFile}
          onRemoveItem={handleRemoveItem}
          onClearCompleted={handleClearCompleted}
          onClearAll={handleClearAll}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        dependency={dependency}
        onRecheckDependency={() => checkDependency(settings.customExecutablePath)}
      />
    </div>
  );
};
