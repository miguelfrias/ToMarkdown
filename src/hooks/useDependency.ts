import { useState, useEffect, useCallback } from 'react';
import { DependencyStatus } from '../types';
import { isTauri } from '../utils/tauri';

export function useDependency(customPath?: string) {
  const [dependency, setDependency] = useState<DependencyStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkDependency = useCallback(async (pathOverride?: string) => {
    setIsChecking(true);
    const targetPath = pathOverride !== undefined ? pathOverride : customPath;

    if (!isTauri) {
      // Mock status for browser dev environment
      setDependency({
        available: true,
        executable_path: 'Bundled Sidecar (Ready)',
        version: '0.1.0',
      });
      setIsChecking(false);
      return;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const status = await invoke<DependencyStatus>('check_dependency', {
        customPath: targetPath || null,
      });
      setDependency(status);
    } catch (err: any) {
      console.error('Failed to check CLI dependency:', err);
      setDependency({
        available: false,
        executable_path: '',
        error: err.toString(),
      });
    } finally {
      setIsChecking(false);
    }
  }, [customPath]);

  useEffect(() => {
    checkDependency();
  }, [checkDependency]);

  return { dependency, isChecking, checkDependency };
}
