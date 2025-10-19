import { ElectronAPI } from '@electron-toolkit/preload'

interface FileAPI {
  openFileDialog: () => Promise<string | null>
  readJSONFile: (filePath: string) => Promise<unknown>
  writeJSONFile: (filePath: string, data: unknown) => Promise<{ success: boolean }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: FileAPI
  }
}
