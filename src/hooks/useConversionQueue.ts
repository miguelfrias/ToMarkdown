import { useState, useEffect, useCallback, useRef } from 'react';
import { QueueItem, AppSettings, ConversionProgressPayload } from '../types';
import { isTauri } from '../utils/tauri';

export function useConversionQueue(settings: AppSettings) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Add files to the queue with automatic deduplication
  const addFiles = useCallback((filePaths: string[]) => {
    if (filePaths.length === 0) return;

    const uniquePaths = Array.from(new Set(filePaths));

    setItems((prev) => {
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

  // Listen for real-time progress events from the Rust backend
  useEffect(() => {
    if (!isTauri) return;

    let isMounted = true;
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        if (!isMounted) return;

        const cleanup = await listen<ConversionProgressPayload>(
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
          cleanup();
          return;
        }
        unlisten = cleanup;
      } catch (err) {
        console.error('Failed to subscribe to conversion progress events:', err);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unlisten) unlisten();
    };
  }, []);

  // Automatically process pending queue items
  useEffect(() => {
    const pendingItems = items.filter((i) => i.status === 'pending');
    if (pendingItems.length === 0) return;

    const processQueue = async () => {
      if (!isTauri) {
        // Browser demo mode simulation
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

      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const tasks = pendingItems.map((item) => ({
          id: item.id,
          source_path: item.sourcePath,
        }));

        // Mark items as converting locally
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
      } catch (err) {
        console.error('Error invoking batch conversion:', err);
      }
    };

    processQueue();
  }, [items]);

  // Queue actions
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((i) => i.status !== 'success'));
  }, []);

  const clearAll = useCallback(() => {
    setItems((prev) => prev.filter((i) => i.status === 'converting'));
  }, []);

  const completedCount = items.filter((i) => i.status === 'success').length;

  return {
    items,
    completedCount,
    addFiles,
    removeItem,
    clearCompleted,
    clearAll,
  };
}
