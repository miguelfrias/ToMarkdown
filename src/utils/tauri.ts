export const isTauri =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Reveal a file in macOS Finder or platform file manager.
 */
export async function revealInFinder(filePath: string): Promise<void> {
  if (isTauri) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('reveal_in_finder', { filePath });
    } catch (err) {
      console.error('Failed to reveal in Finder:', err);
    }
  } else {
    alert(`Mock Reveal in Finder: ${filePath}`);
  }
}

/**
 * Open a file with the system default application.
 */
export async function openFile(filePath: string): Promise<void> {
  if (isTauri) {
    try {
      const { openUrl, openPath } = await import('@tauri-apps/plugin-opener');
      if (openPath) {
        await openPath(filePath);
      } else {
        await openUrl(`file://${filePath}`);
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  } else {
    alert(`Mock Open File: ${filePath}`);
  }
}

/**
 * Prompt native file open dialog.
 */
export async function browseFiles(onSelected: (paths: string[]) => void): Promise<void> {
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
        onSelected(filePaths);
      }
    } catch (err) {
      console.error('Failed to open file dialog:', err);
    }
  } else {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) input.click();
  }
}
