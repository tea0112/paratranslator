import { ElectronAPI } from '@electron-toolkit/preload'

interface FileAPI {
  openFileDialog: () => Promise<string | null>
  readJSONFile: (filePath: string) => Promise<unknown>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: FileAPI
  }
}
