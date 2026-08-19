import { useState, useEffect } from 'react';
import { isTauri } from '../utils/tauri';

export function useNativeDrop(onDrop: (paths: string[]) => void) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    if (!isTauri) return;

    let isMounted = true;
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const currentWindow = getCurrentWindow();

        if (!isMounted) return;

        const cleanup = await currentWindow.onDragDropEvent((event) => {
          if (event.payload.type === 'enter' || event.payload.type === 'over') {
            setIsDraggingOver(true);
          } else if (event.payload.type === 'drop') {
            setIsDraggingOver(false);
            const droppedPaths = event.payload.paths;
            if (droppedPaths && droppedPaths.length > 0) {
              onDrop(droppedPaths);
            }
          } else if (event.payload.type === 'leave') {
            setIsDraggingOver(false);
          }
        });

        if (!isMounted) {
          cleanup();
          return;
        }
        unlisten = cleanup;
      } catch (err) {
        console.error('Failed to setup native drag-drop listener:', err);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unlisten) unlisten();
    };
  }, [onDrop]);

  return { isDraggingOver };
}
